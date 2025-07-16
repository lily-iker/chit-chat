import { create } from 'zustand'
import { StreamVideoClient, type Call } from '@stream-io/video-react-sdk'
import axios from '@/lib/axios-custom'
import { useChatStore } from '@/store/useChatStore'
import { useAuthStore } from './useAuthStore'

type VideoCallState = {
  client: StreamVideoClient | null
  call: Call | null
  isCallActive: boolean
  setClient: (client: StreamVideoClient) => void
  setCall: (call: Call) => void
  startCall: (callId: string) => Promise<void>
  endCall: () => void
  cleanup: () => void
}

export const useVideoCallStore = create<VideoCallState>((set, get) => ({
  client: null,
  call: null,
  isCallActive: false,

  setClient: (client) => set({ client }),
  setCall: (call) => set({ call }),

  startCall: async (callId: string) => {
    const { client: existingClient, call: existingCall } = get()
    const { selectedChat } = useChatStore.getState()

    if (!selectedChat) {
      throw new Error('No chat selected')
    }

    if (existingCall) {
      await existingCall.leave()
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
      await newCall.join({ create: true })

      set({
        call: newCall,
        isCallActive: true,
      })
    } catch (error) {
      console.error('Failed to start call:', error)
      throw error
    }
  },

  endCall: () => {
    const { call } = get()
    if (call) {
      call.leave().catch(console.error)
    }
    set({
      call: null,
      isCallActive: false,
    })
  },

  cleanup: () => {
    console.log('Cleaning up video call store')
    const { client, call } = get()
    if (call) {
      call.leave().catch(console.error)
    }
    if (client) {
      client.disconnectUser().catch(console.error)
    }
    set({
      client: null,
      call: null,
      isCallActive: false,
    })
  },
}))
