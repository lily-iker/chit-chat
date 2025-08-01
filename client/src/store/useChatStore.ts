import { create } from 'zustand'
import axios from '@/lib/axios-custom'
import toast from 'react-hot-toast'
import type { Chat } from '@/types/Chat'
import type { Message } from '@/types/Message'
import type { IMessage, StompSubscription } from '@stomp/stompjs'
import { useWebSocketStore } from './useWebSocketStore'
import { ChatEvent } from '@/types/enum/ChatEvent'
import type { WebSocketResponse } from '@/types/response/WebSocketResponse'

interface ChatState {
  selectedChat: Chat | null
  selectedChatMessages: Message[]
  chats: Chat[]
  isSelectedChatMessagesLoading: boolean
  isChatsLoading: boolean
  isLoadingMoreMessages: boolean
  isLoadingMoreChats: boolean
  hasMoreMessages: boolean
  hasMoreChats: boolean
  oldestLoadedChatId: string | null
  oldestLoadedMessageId: string | null
  chatSubscription: StompSubscription | null
  currentSubscribedChatId: string | null
  typingUserIds: string[]
  typingTimeouts: Record<string, NodeJS.Timeout>
  chatSearchResults: Chat[]
  chatSearchLoading: boolean
  chatSearchHasMore: boolean
  chatSearchPage: number
  chatSearchQuery: string
  chatSearchTotalCount: number

  setSelectedChat: (chat: Chat | null) => void
  getChatById: (chatId: string) => Promise<void>
  getChats: () => Promise<void>
  getSelectedChatMessages: (chatId: string) => Promise<void>
  loadMoreMessages: (chatId: string) => Promise<void>
  loadMoreChats: () => Promise<void>
  addMessage: (message: Message) => void
  updateMessage: (message: Message) => void
  deleteMessage: (messageId: string) => void
  markChatAsRead: (chatId: string) => Promise<void>
  updateMessageReadStatus: (userId: string, readAt: string) => void
  sendTypingEvent: (chatId: string, userId: string) => void
  addTypingUser: (userId: string) => void
  removeTypingUser: (userId: string) => void
  updateSelectedChatOrder: (message: Message) => void
  searchChats: (query: string, reset?: boolean) => Promise<void>
  loadMoreSearchResults: () => Promise<void>
  clearSearch: () => void

  subscribe: (chatId: string) => void
  unsubscribe: () => void

  cleanup: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  selectedChat: null,
  selectedChatMessages: [],
  chats: [],
  isSelectedChatMessagesLoading: false,
  isChatsLoading: false,
  isLoadingMoreMessages: false,
  isLoadingMoreChats: false,
  hasMoreMessages: true,
  hasMoreChats: true,
  chatSubscription: null,
  currentSubscribedChatId: null,
  oldestLoadedChatId: null,
  oldestLoadedMessageId: null,
  typingUserIds: [],
  typingTimeouts: {},
  chatSearchResults: [],
  chatSearchLoading: false,
  chatSearchHasMore: true,
  chatSearchPage: 1,
  chatSearchQuery: '',
  chatSearchTotalCount: 0,

  setSelectedChat: (chat) => {
    // Clear all typing indicators and timeouts when switching chats
    const { typingTimeouts } = get()
    Object.values(typingTimeouts).forEach((timeout) => clearTimeout(timeout))

    set({
      selectedChat: chat,
      selectedChatMessages: [],
      hasMoreMessages: true,
      oldestLoadedMessageId: null,
      typingUserIds: [],
      typingTimeouts: {},
    })
  },

  getChatById: async (chatId: string) => {
    set({ isSelectedChatMessagesLoading: true })
    try {
      const res = await axios.get(`/api/v1/chats/${chatId}`)
      set({ selectedChat: res.data.result })

      set((state) => ({
        chats: state.chats.map((chat) =>
          chat.id === get().selectedChat?.id ? { ...chat, unreadMessageCount: 0 } : chat
        ),
      }))
    } catch (error) {
      console.error(error)
      toast.error('Failed to fetch chat')
    } finally {
      set({ isSelectedChatMessagesLoading: false })
    }
  },

  getChats: async () => {
    set({ isChatsLoading: true })
    try {
      const res = await axios.get('/api/v1/chats/my-chats')
      const data = res.data.result
      console.log('Fetched chats:', data)

      const normalizedChats = data.content.map((chat: Chat) => ({
        ...chat,
        typingParticipants: [],
      }))

      set({
        chats: normalizedChats,
        hasMoreChats: data.pageNumber < data.totalPages,
        oldestLoadedChatId:
          data.content.length > 0 ? data.content[data.content.length - 1].id : null,
      })
    } catch (error) {
      console.error(error)
      toast.error('Failed to fetch chats')
    } finally {
      set({ isChatsLoading: false })
    }
  },

  loadMoreChats: async () => {
    const { isLoadingMoreChats, hasMoreChats, oldestLoadedChatId } = get()

    if (isLoadingMoreChats || !hasMoreChats) return

    set({ isLoadingMoreChats: true })

    try {
      let url = '/api/v1/chats/my-chats?pageNumber=1'
      if (oldestLoadedChatId) {
        url += `&beforeChatId=${oldestLoadedChatId}`
      }

      const res = await axios.get(url)
      const data = res.data.result

      const normalizedChats = data.content.map((chat: Chat) => ({
        ...chat,
        typingParticipants: chat.typingParticipants ?? [],
      }))

      set((state) => ({
        chats: [...state.chats, ...normalizedChats],
        hasMoreChats: data.pageNumber < data.totalPages,
        isLoadingMoreChats: false,
        oldestLoadedChatId:
          data.content.length > 0
            ? data.content[data.content.length - 1].id
            : state.oldestLoadedChatId,
      }))
    } catch (error) {
      console.error(error)
      toast.error('Failed to load more chats')
      set({ isLoadingMoreChats: false })
    }
  },

  getSelectedChatMessages: async (chatId: string) => {
    set({ isSelectedChatMessagesLoading: true })
    try {
      const res = await axios.get(`/api/v1/chats/${chatId}/messages`)
      const data = res.data.result

      set({
        selectedChatMessages: data.content,
        hasMoreMessages: data.pageNumber < data.totalPages,
        oldestLoadedMessageId: data.content.length > 0 ? data.content[0].id : null,
      })

      console.log('Fetched chat messages:', data.content)
    } catch (error) {
      console.error(error)
      toast.error('Failed to fetch chat messages')
    } finally {
      set({ isSelectedChatMessagesLoading: false })
    }
  },

  loadMoreMessages: async (chatId: string) => {
    const { isLoadingMoreMessages, hasMoreMessages, oldestLoadedMessageId } = get()

    if (isLoadingMoreMessages || !hasMoreMessages) return

    set({ isLoadingMoreMessages: true })
    try {
      let url = `/api/v1/chats/${chatId}/messages?pageNumber=1`
      if (oldestLoadedMessageId) {
        url += `&beforeMessageId=${oldestLoadedMessageId}`
      }

      const res = await axios.get(url)
      const data = res.data.result

      console.log('Loaded more messages:', data)

      set((state) => {
        return {
          selectedChatMessages: [...data.content, ...state.selectedChatMessages],
          hasMoreMessages: data.pageNumber < data.totalPages,
          isLoadingMoreMessages: false,
          oldestLoadedMessageId:
            data.content.length > 0 ? data.content[0].id : state.oldestLoadedMessageId,
        }
      })
    } catch (error) {
      console.error(error)
      toast.error('Failed to load more messages')
      set({ isLoadingMoreMessages: false })
    }
  },

  addMessage: (message: Message) =>
    set((state) => {
      const messageExists = state.selectedChatMessages.some(
        (existingMessage) => existingMessage.id === message.id
      )

      if (messageExists) {
        console.log('Message already exists, skipping duplicate:', message.id)
        return state
      }

      // Clear typing indicator for the sender when they send a message
      if (message.senderId) {
        get().removeTypingUser(message.senderId)
      }

      return {
        selectedChatMessages: [...state.selectedChatMessages, message],
      }
    }),

  updateMessage: (updatedMessage: Message) =>
    set((state) => {
      const updatedMessages = state.selectedChatMessages.map((message) =>
        message.id === updatedMessage.id ? updatedMessage : message
      )

      return {
        selectedChatMessages: updatedMessages,
      }
    }),

  deleteMessage: (messageId: string) =>
    set((state) => {
      const updatedMessages = state.selectedChatMessages.map((message) =>
        message.id === messageId ? { ...message, isDeleted: true } : message
      )

      return {
        selectedChatMessages: updatedMessages,
      }
    }),

  markChatAsRead: async (chatId: string) => {
    try {
      await axios.put(`/api/v1/chats/mark-as-read/${chatId}`)
    } catch (err) {
      console.error('Failed to mark chat as read', err)
    }
  },

  updateMessageReadStatus: (userId: string, readAt: string) => {
    set((state) => {
      const messages = [...state.selectedChatMessages]
      const message = messages[messages.length - 1]

      if (message.senderId === userId) return { selectedChatMessages: messages }

      if (!message.readInfo) {
        message.readInfo = []
      }

      const existingReadInfo = message.readInfo.find((info) => info.userId === userId)

      if (!existingReadInfo) {
        message.readInfo.push({
          userId: userId,
          readAt: readAt,
        })
      }

      return { selectedChatMessages: messages }
    })
  },

  sendTypingEvent: (chatId: string, userId: string) => {
    const client = useWebSocketStore.getState().client
    if (client && client.connected) {
      client.publish({
        destination: `/app/chat/${chatId}/typing`,
        body: JSON.stringify({
          userId,
          chatId,
        }),
      })
    }
  },

  addTypingUser: (userId: string) => {
    set((state) => {
      // Don't add if user is already typing
      if (state.typingUserIds.includes(userId)) {
        // Just refresh the timeout
        if (state.typingTimeouts[userId]) {
          clearTimeout(state.typingTimeouts[userId])
        }

        const timeoutId = setTimeout(() => {
          get().removeTypingUser(userId)
        }, 5000)

        return {
          typingTimeouts: { ...state.typingTimeouts, [userId]: timeoutId },
        }
      }

      // Clear existing timeout if user is already typing
      if (state.typingTimeouts[userId]) {
        clearTimeout(state.typingTimeouts[userId])
      }

      // Set new timeout
      const timeoutId = setTimeout(() => {
        get().removeTypingUser(userId)
      }, 5000)

      return {
        typingUserIds: [...state.typingUserIds, userId],
        typingTimeouts: { ...state.typingTimeouts, [userId]: timeoutId },
      }
    })
  },

  removeTypingUser: (userId: string) => {
    set((state) => {
      // Clear any pending timeout
      if (state.typingTimeouts[userId]) {
        clearTimeout(state.typingTimeouts[userId])
      }

      // Remove both user ID and its timeout
      const { [userId]: _, ...remainingTimeouts } = state.typingTimeouts
      return {
        typingUserIds: state.typingUserIds.filter((id) => id !== userId),
        typingTimeouts: remainingTimeouts,
      }
    })
  },

  updateSelectedChatOrder: (message: Message) => {
    useChatStore.setState((state) => {
      const updatedChats = [...state.chats]
      const chatIndex = updatedChats.findIndex((chat) => chat.id === get().selectedChat?.id)

      if (chatIndex !== -1) {
        const chat = updatedChats[chatIndex]

        const updatedChat = {
          ...chat,
          lastMessageContent: message.content,
          lastMessageSenderId: message.senderId,
          lastMessageSenderName: message.senderName,
          lastMessageTime: message.createdAt,
          lastMessageType: message.messageType,
          lastMessageMediaUrl: message.mediaUrl,
          isLastMessageDeleted: false,
        }

        updatedChats.splice(chatIndex, 1)
        updatedChats.unshift(updatedChat)

        return {
          chats: updatedChats,
        }
      }

      return {}
    })
  },

  searchChats: async (query: string, reset = true) => {
    if (!query.trim()) {
      set({
        chatSearchResults: [],
        chatSearchQuery: '',
        chatSearchPage: 1,
        chatSearchHasMore: true,
        chatSearchTotalCount: 0,
      })
      return
    }

    const { chatSearchLoading } = get()
    if (chatSearchLoading) return

    set({ chatSearchLoading: true })

    try {
      const page = reset ? 1 : get().chatSearchPage
      const response = await axios.get(
        `/api/v1/chats/search-my-chats?keyword=${encodeURIComponent(
          query
        )}&pageNumber=${page}&pageSize=10`
      )
      const data = response.data.result

      const normalizedChats = data.content.map((chat: Chat) => ({
        ...chat,
        typingParticipants: chat.typingParticipants ?? [],
      }))

      set((state) => ({
        chatSearchResults: reset
          ? normalizedChats
          : [...state.chatSearchResults, ...normalizedChats],
        chatSearchQuery: query,
        chatSearchPage: page,
        chatSearchHasMore: page < data.totalPages,
        chatSearchTotalCount: data.totalElements || normalizedChats.length,
        chatSearchLoading: false,
      }))
    } catch (error) {
      console.error('Failed to search chats:', error)
      toast.error('Failed to search chats')
      set({ chatSearchLoading: false })
    }
  },

  loadMoreSearchResults: async () => {
    const { chatSearchQuery, chatSearchHasMore, chatSearchPage } = get()
    if (!chatSearchHasMore || !chatSearchQuery) return

    set({ chatSearchPage: chatSearchPage + 1 })
    await get().searchChats(chatSearchQuery, false)
  },

  clearSearch: () =>
    set({
      chatSearchResults: [],
      chatSearchQuery: '',
      chatSearchPage: 1,
      chatSearchHasMore: true,
      chatSearchTotalCount: 0,
    }),

  subscribe: (chatId: string) => {
    const { chatSubscription, currentSubscribedChatId } = get()
    const client = useWebSocketStore.getState().client

    if (!client) return

    if (client && client.connected && currentSubscribedChatId === chatId) {
      console.log('Already connected to this chat.')
      return
    }

    chatSubscription?.unsubscribe()

    const subscription = client.subscribe(`/topic/${chatId}`, (msg: IMessage) => {
      const response = JSON.parse(msg.body) as WebSocketResponse<any>
      console.log('Received message:', response)

      const { event, data } = response

      switch (event) {
        case ChatEvent.USER_TYPING:
          get().addTypingUser(data.userId)
          break

        case ChatEvent.CHAT_READ:
          get().updateMessageReadStatus(data.userId, data.readAt)
          break

        case ChatEvent.NEW_MESSAGE:
          get().addMessage(data)
          get().updateSelectedChatOrder(data)
          break

        case ChatEvent.MESSAGE_EDITED:
          get().updateMessage(data)
          break

        case ChatEvent.MESSAGE_DELETED:
          get().deleteMessage(data.id)
          // get().updateChatLastMessage(data.chatId, data.content, true)
          break

        default:
          console.error(`Unhandled chat event type: ${event}`, data)
          return
      }
    })

    set({ chatSubscription: subscription, currentSubscribedChatId: chatId })
  },

  unsubscribe: () => {
    const { chatSubscription, typingTimeouts } = get()

    // Clear all typing timeouts when unsubscribing
    Object.values(typingTimeouts).forEach((timeout) => clearTimeout(timeout))

    chatSubscription?.unsubscribe()

    set({
      chatSubscription: null,
      currentSubscribedChatId: null,
      typingUserIds: [],
      typingTimeouts: {},
    })
  },

  cleanup: () =>
    set({
      selectedChat: null,
      selectedChatMessages: [],
      chats: [],
      isSelectedChatMessagesLoading: false,
      isChatsLoading: false,
      isLoadingMoreMessages: false,
      isLoadingMoreChats: false,
      hasMoreMessages: true,
      hasMoreChats: true,
      chatSubscription: null,
      currentSubscribedChatId: null,
      oldestLoadedChatId: null,
      oldestLoadedMessageId: null,
      typingUserIds: [],
      typingTimeouts: {},
    }),
}))
