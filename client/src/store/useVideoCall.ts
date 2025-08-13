import { create } from 'zustand'
import { StreamVideoClient, type Call } from '@stream-io/video-react-sdk'
import axios from '@/lib/axios-custom'
import { useChatStore } from '@/store/useChatStore'
import { useAuthStore } from './useAuthStore'
import { useMessageStore } from './useMessageStore'
import { SystemMessageAction } from '@/types/enum/SystemMessageAction'

type VideoCallState = {
  client: StreamVideoClient | null
  call: Call | null
  isCallActive: boolean
  currentChatId: string | null
  isPiPMode: boolean
  pipPosition: { x: number; y: number }
  callParticipants: Set<string>
  setClient: (client: StreamVideoClient) => void
  setCall: (call: Call) => void
  startCall: (callId: string) => Promise<void>
  endCall: () => void
  togglePiPMode: () => void
  setPiPPosition: (position: { x: number; y: number }) => void
  checkExistingParticipants: (callId: string) => Promise<number>
  cleanup: () => void
}

export const useVideoCallStore = create<VideoCallState>((set, get) => ({
  client: null,
  call: null,
  isCallActive: false,
  currentChatId: null,
  isPiPMode: false,
  pipPosition: { x: 20, y: 20 }, // Distance from bottom-right corner
  callParticipants: new Set(),

  setClient: (client) => set({ client }),
  setCall: (call) => set({ call }),

  checkExistingParticipants: async (callId: string) => {
    try {
      const { client } = get()
      if (!client) return 0

      const call = client.call('default', callId)
      const callState = await call.get()

      const activeParticipants = callState.call?.session?.participants || []
      return activeParticipants.length
    } catch (error) {
      console.error('Failed to check existing participants:', error)
      return 0
    }
  },

  startCall: async (callId: string) => {
    const { client: existingClient, call: existingCall } = get()
    const { selectedChat } = useChatStore.getState()

    if (!selectedChat) {
      throw new Error('No chat selected')
    }

    if (existingCall) {
      try {
        await existingCall.leave()
      } catch (error) {
        console.error('Error cleaning up existing call:', error)
      }
    }

    try {
      const { authUser } = useAuthStore.getState()

      if (!authUser) {
        throw new Error('User not authenticated')
      }

      const res = await axios.get(`/api/v1/stream/token`)
      const streamToken = res.data.result

      let streamClient = existingClient
      if (!streamClient) {
        streamClient = new StreamVideoClient({
          apiKey: import.meta.env.VITE_STREAM_API_KEY,
          user: {
            id: authUser.id,
            name: authUser.fullName || authUser.username,
            image: authUser.profileImageUrl,
          },
          token: streamToken,
        })
        await streamClient.connectUser({ id: authUser.id })
        set({ client: streamClient })
      }

      const newCall = streamClient.call('default', callId)

      const existingParticipantCount = await get().checkExistingParticipants(callId)

      if (existingParticipantCount > 0) {
        await useMessageStore
          .getState()
          .sendVideoCallSystemMessage(SystemMessageAction.VIDEO_CALL_JOIN, selectedChat.id)
      } else {
        await useMessageStore
          .getState()
          .sendVideoCallSystemMessage(SystemMessageAction.VIDEO_CALL_START, selectedChat.id)
      }

      const handleParticipantJoined = (event: any) => {
        const participantId = event.participant?.user_id || event.participant?.userId
        console.log('Participant joined event:', event.participant)

        if (participantId && participantId !== authUser.id) {
          console.log(`Participant ${participantId} joined the call`)

          useMessageStore
            .getState()
            .sendVideoCallSystemMessage(SystemMessageAction.VIDEO_CALL_JOIN, selectedChat.id)

          set((state) => {
            const newParticipants = new Set([...state.callParticipants, participantId])
            console.log(`Updated participants after join:`, Array.from(newParticipants))
            return { callParticipants: newParticipants }
          })
        }
      }

      const handleParticipantLeft = (event: any) => {
        const participantId = event.participant?.user_id || event.participant?.userId
        console.log('Participant left event:', event.participant)

        if (participantId && participantId !== authUser.id) {
          console.log(`Participant ${participantId} left the call`)

          set((state) => {
            const newParticipants = new Set(state.callParticipants)
            newParticipants.delete(participantId)
            console.log(`Updated participants after leave:`, Array.from(newParticipants))

            return { callParticipants: newParticipants }
          })
        }
      }

      newCall.on('call.session_participant_joined', handleParticipantJoined)
      newCall.on('call.session_participant_left', handleParticipantLeft)

      await newCall.join({ create: true })

      // Initialize participants with current user only
      const initialParticipants = new Set([authUser.id])

      // Get actual participants from the call state after joining
      try {
        // Wait a bit for the call state to stabilize
        setTimeout(async () => {
          try {
            const callState = await newCall.get()
            const participants = callState.call?.session?.participants || []

            console.log('Raw participants from call state:', participants)

            const validParticipants = new Set([authUser.id])

            participants.forEach((participant: any) => {
              const participantId = participant?.user.id
              console.log('Processing participant:', participant, 'ID:', participantId)

              if (participantId && participantId !== authUser.id) {
                validParticipants.add(participantId)
              }
            })

            console.log('Final valid participants:', Array.from(validParticipants))

            set({ callParticipants: validParticipants })
          } catch (error) {
            console.error('Failed to update participants after join:', error)
          }
        }, 1000)
      } catch (error) {
        console.error('Failed to get existing participants:', error)
      }

      set({
        call: newCall,
        isCallActive: true,
        currentChatId: selectedChat.id,
        callParticipants: initialParticipants,
      })

      console.log(
        `Successfully joined call with ${initialParticipants.size} participants:`,
        Array.from(initialParticipants)
      )
    } catch (error) {
      console.error('Failed to start call:', error)
      throw error
    }
  },

  endCall: () => {
    const { call, callParticipants } = get()
    const { selectedChat } = useChatStore.getState()

    if (!call || !selectedChat) {
      set({
        call: null,
        isCallActive: false,
        currentChatId: null,
        isPiPMode: false,
        callParticipants: new Set(),
      })
      return
    }

    console.log(
      `Ending call with ${callParticipants.size} participants:`,
      Array.from(callParticipants)
    )

    useMessageStore
      .getState()
      .sendVideoCallSystemMessage(SystemMessageAction.VIDEO_CALL_LEAVE, selectedChat.id)

    if (callParticipants.size <= 1) {
      setTimeout(() => {
        useMessageStore
          .getState()
          .sendVideoCallSystemMessage(SystemMessageAction.VIDEO_CALL_END, selectedChat.id)
      }, 500)
    }

    call
      .leave()
      .then(() => {
        console.log('Successfully left the call')
      })
      .catch((error) => {
        console.error('Error leaving call:', error)
      })
      .finally(() => {
        set({
          call: null,
          isCallActive: false,
          currentChatId: null,
          isPiPMode: false,
          callParticipants: new Set(),
        })
      })
  },

  togglePiPMode: () => {
    set((state) => ({ isPiPMode: !state.isPiPMode }))
  },

  setPiPPosition: (position) => {
    set({ pipPosition: position })
  },

  cleanup: () => {
    const { client, call } = get()

    if (call) {
      call.leave().catch((error) => {
        console.error('Error during cleanup:', error)
      })
    }

    if (client) {
      client.disconnectUser().catch((error) => {
        console.error('Error disconnecting user:', error)
      })
    }

    set({
      client: null,
      call: null,
      isCallActive: false,
      currentChatId: null,
      isPiPMode: false,
      callParticipants: new Set(),
    })
  },
}))
