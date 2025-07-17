import { create } from 'zustand'
import type { IMessage } from '@stomp/stompjs'
import { useWebSocketStore } from './useWebSocketStore'
import { useAuthStore } from './useAuthStore'
import { useChatStore } from './useChatStore'
import axios from '@/lib/axios-custom'

export type Notification = {
  id: string
  content: string
  timestamp: string
  read?: boolean
}

interface NotificationState {
  notifications: Notification[]
  chatTypingTimeouts: Record<string, Record<string, NodeJS.Timeout>> // chatId -> userId -> timeout

  subscribeToNotifications: () => void
  unsubscribeFromNotifications: () => void
  addNotification: (notification: Notification) => void
  clearNotifications: () => void
  clearChatTypingUser: (chatId: string, userId: string) => void // New method

  cleanup: () => void
}

let notificationSubscription: any = null

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  chatTypingTimeouts: {},

  addNotification: (notification: Notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),

  clearNotifications: () => set({ notifications: [] }),

  clearChatTypingUser: (chatId: string, userId: string) => {
    set((state) => {
      const chatTimeouts = state.chatTypingTimeouts[chatId]
      if (chatTimeouts && chatTimeouts[userId]) {
        clearTimeout(chatTimeouts[userId])

        const { [userId]: _, ...remainingUserTimeouts } = chatTimeouts
        const updatedChatTimeouts = {
          ...state.chatTypingTimeouts,
          [chatId]: remainingUserTimeouts,
        }

        return { chatTypingTimeouts: updatedChatTimeouts }
      }
      return state
    })

    // Also clear from chat store
    useChatStore.setState((state) => {
      const updatedChats = state.chats.map((chat) => {
        if (chat.id === chatId) {
          return {
            ...chat,
            typingParticipants: (chat.typingParticipants || []).filter((id) => id !== userId),
          }
        }
        return chat
      })
      return { chats: updatedChats }
    })
  },

  subscribeToNotifications: () => {
    const client = useWebSocketStore.getState().client
    const user = useAuthStore.getState().authUser

    if (!client || !user || !user.id || !client.connected) return

    console.log('[Notification] Subscribing to notifications for user:', user.id)

    const destination = `/queue/notifications/${user.id}`

    if (notificationSubscription) {
      notificationSubscription.unsubscribe()
    }

    notificationSubscription = client.subscribe(destination, async (msg: IMessage) => {
      const data = JSON.parse(msg.body)
      console.log('[Notification]', data)

      if (data.type === 'TYPING') {
        const { chatId, userId } = data

        // Clear existing timeout for this user in this chat
        const state = get()
        const chatTimeouts = state.chatTypingTimeouts[chatId] || {}
        if (chatTimeouts[userId]) {
          clearTimeout(chatTimeouts[userId])
        }

        // Set new timeout
        const timeoutId = setTimeout(() => {
          get().clearChatTypingUser(chatId, userId)
        }, 5000)

        // Update timeouts
        set((state) => ({
          chatTypingTimeouts: {
            ...state.chatTypingTimeouts,
            [chatId]: {
              ...chatTimeouts,
              [userId]: timeoutId,
            },
          },
        }))

        // Update chat store
        useChatStore.setState((state) => {
          const updatedChats = state.chats.map((chat) => {
            if (chat.id === chatId) {
              const typingList = chat.typingParticipants || []
              return {
                ...chat,
                typingParticipants: typingList.includes(userId)
                  ? typingList
                  : [...typingList, userId],
              }
            }
            return chat
          })
          return { chats: updatedChats }
        })
      }

      if (data && data.chatId && data.senderName) {
        // Clear typing indicator for the sender when they send a message
        get().clearChatTypingUser(data.chatId, data.senderId)

        if (useChatStore.getState().selectedChat?.id === data.chatId) {
          return
        }

        const chatExists = useChatStore.getState().chats.some((chat) => chat.id === data.chatId)

        if (chatExists) {
          const currentUserId = useAuthStore.getState().authUser?.id

          useChatStore.setState((state) => {
            const updatedChats = [...state.chats]
            const chatIndex = updatedChats.findIndex((chat) => chat.id === data.chatId)

            if (chatIndex !== -1) {
              const chat = updatedChats[chatIndex]

              const isFromOtherUser = data.senderId !== currentUserId
              const isFromSelectedChat = chat.id === useChatStore.getState().selectedChat?.id
              const shouldUpdateUnreadCount = isFromOtherUser && !isFromSelectedChat
              const unreadCount = chat.unreadMessageCount || 0

              const updatedChat = {
                ...chat,
                lastMessageContent: data.content,
                lastMessageSenderId: data.senderId,
                lastMessageSenderName: data.senderName,
                lastMessageTime: data.createdAt,
                lastMessageType: data.messageType,
                lastMessageMediaType: data.mediaType,
                lastMessageMediaUrl: data.mediaUrl,
                unreadMessageCount: shouldUpdateUnreadCount ? unreadCount + 1 : unreadCount,
                // Clear typing participants when message is received
                typingParticipants: [],
              }

              updatedChats.splice(chatIndex, 1)
              updatedChats.unshift(updatedChat)

              return {
                chats: updatedChats,
                oldestLoadedChatId: updatedChats[updatedChats.length - 1]?.id || null,
              }
            }

            return {}
          })
        } else {
          try {
            const res = await axios.get(`/api/v1/chats/${data.chatId}`)
            const fetchedChat = res.data.result

            useChatStore.setState((state) => {
              const alreadyExists = state.chats.some((chat) => chat.id === fetchedChat.id)
              if (alreadyExists) return {}

              const updatedChats = [fetchedChat, ...state.chats]

              return {
                chats: updatedChats,
                oldestLoadedChatId: updatedChats[updatedChats.length - 1]?.id || null,
              }
            })
          } catch (error) {
            console.error('Failed to fetch new chat:', error)
          }
        }
      }
    })
  },

  unsubscribeFromNotifications: () => {
    // Clear all typing timeouts
    const { chatTypingTimeouts } = get()
    Object.values(chatTypingTimeouts).forEach((chatTimeouts) => {
      Object.values(chatTimeouts).forEach((timeout) => clearTimeout(timeout))
    })

    set({ chatTypingTimeouts: {} })

    if (notificationSubscription) {
      notificationSubscription.unsubscribe()
      notificationSubscription = null
    }
  },

  cleanup: () => {
    set({
      notifications: [],
      chatTypingTimeouts: {},
    })
  },
}))
