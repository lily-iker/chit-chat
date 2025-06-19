import { create } from 'zustand'
import axios from '@/lib/axios-custom'
import toast from 'react-hot-toast'
import { useChatStore } from './useChatStore'
import { useAuthStore } from './useAuthStore'

type MessageState = {
  isLoading: boolean
  sendMessage: (formdata: FormData) => Promise<void>
}

export const useMessageStore = create<MessageState>((set) => ({
  isLoading: false,

  sendMessage: async (formdata) => {
    set({ isLoading: true })
    try {
      // Get current user and selected chat
      // const authUser = useAuthStore.getState().authUser
      // const selectedChat = useChatStore.getState().selectedChat

      // // Clear typing indicator immediately for current user when sending message
      // if (authUser && selectedChat) {
      //   useChatStore.getState().removeTypingUser(authUser.id)
      // }

      await axios.post('/api/v1/messages/send', formdata)
    } catch (error) {
      console.error(error)
      toast.error('Failed to send message')
    } finally {
      set({ isLoading: false })
    }
  },
}))
