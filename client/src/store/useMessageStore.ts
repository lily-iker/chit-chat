import { create } from 'zustand'
import axios from '@/lib/axios-custom'
import toast from 'react-hot-toast'
import type { SystemMessageAction } from '@/types/enum/SystemMessageAction'
import { useVideoCallStore } from './useVideoCall'

type MessageState = {
  isLoading: boolean
  isDeleting: boolean
  isUpdating: boolean
  sendMessage: (formdata: FormData) => Promise<void>
  sendVideoCallSystemMessage: (action: SystemMessageAction, chatId?: string) => Promise<void>
  updateMessage: (messageId: string, newContent: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  cleanup: () => void
}

export const useMessageStore = create<MessageState>((set) => ({
  isLoading: false,
  isDeleting: false,
  isUpdating: false,

  sendMessage: async (formdata) => {
    set({ isLoading: true })
    try {
      await axios.post('/api/v1/messages/send', formdata)
    } catch (error) {
      console.error(error)
      toast.error('Failed to send message')
    } finally {
      set({ isLoading: false })
    }
  },

  sendVideoCallSystemMessage: async (action: SystemMessageAction, chatId?: string) => {
    try {
      const targetChatId = chatId || useVideoCallStore.getState().currentChatId
      if (!targetChatId) {
        console.error('No chat ID available for video call system message')
        return
      }

      await axios.post(
        `/api/v1/messages/video-call`,
        { chatId: targetChatId },
        { params: { action } }
      )

      console.log(`Video call ${action} system message sent for chat:`, targetChatId)
    } catch (error) {
      console.error(`Failed to send video call ${action} system message:`, error)
    }
  },

  updateMessage: async (messageId: string, newContent: string) => {
    set({ isUpdating: true })
    try {
      await axios.put(`/api/v1/messages/${messageId}`, {
        newContent: newContent,
      })
      toast.success('Message updated successfully')
    } catch (error) {
      console.error(error)
      toast.error('Failed to update message')
    } finally {
      set({ isUpdating: false })
    }
  },

  deleteMessage: async (messageId: string) => {
    set({ isDeleting: true })
    try {
      await axios.delete(`/api/v1/messages/${messageId}`)
      toast.success('Message deleted successfully')
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete message')
    } finally {
      set({ isDeleting: false })
    }
  },

  cleanup: () =>
    set({
      isLoading: false,
      isDeleting: false,
      isUpdating: false,
    }),
}))
