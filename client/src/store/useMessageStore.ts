import { create } from 'zustand'
import axios from '@/lib/axios-custom'
import toast from 'react-hot-toast'

type MessageState = {
  isLoading: boolean
  sendMessage: (formdata: FormData) => Promise<void>

  cleanup: () => void
}

export const useMessageStore = create<MessageState>((set) => ({
  isLoading: false,

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

  cleanup: () =>
    set({
      isLoading: false,
    }),
}))
