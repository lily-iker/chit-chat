import { create } from 'zustand'
import axios from '@/lib/axios-custom'
import toast from 'react-hot-toast'
import type { AuthUser } from '@/types/AuthUser'
import { useMessageStore } from './useMessageStore'
import { useChatStore } from './useChatStore'
import { useNotificationStore } from './useNotificationStore'
import { useVideoCallStore } from './useVideoCall'
import { useWebSocketStore } from './useWebSocketStore'

type AuthState = {
  authUser: AuthUser | null
  isAuthLoading: boolean
  isLoading: boolean
  error: string | null

  setAuthUser: (user: AuthUser | null) => void
  fetchAuthUser: () => Promise<void>
  setupBasicInfo: (fullName: string, bio: string, profileImageFile?: File) => Promise<void>
  login: (identifier: string, password: string) => Promise<void>
  register: (
    username: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<void>
  cleanup: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authUser: null,
  isAuthLoading: false,
  isLoading: false,
  error: null,

  setAuthUser: (user) => set({ authUser: user }),

  fetchAuthUser: async () => {
    set({ isAuthLoading: true })
    try {
      const res = await axios.get('/api/v1/users/me')
      console.log(res.data.result)
      set({ authUser: res.data.result })
    } catch (error) {
      console.error(error)
    } finally {
      set({ isAuthLoading: false })
    }
  },

  setupBasicInfo: async (fullName: string, bio: string, profileImageFile?: File) => {
    set({ isLoading: true })
    try {
      const formData = new FormData()

      const userInfo = {
        fullName,
        bio,
      }

      formData.append(
        'userInfoRequest',
        new Blob([JSON.stringify(userInfo)], { type: 'application/json' })
      )

      if (profileImageFile) {
        formData.append('profileImageFile', profileImageFile)
      }

      const response = await axios.post('/api/v1/users/setup-basic-info', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      set({ authUser: response.data.result })
      toast.success('User info updated successfully')
    } catch (error: unknown) {
      console.log(error)
      toast.error('Failed to update user info. Please try again')
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  login: async (identifier: string, password: string) => {
    set({ isLoading: true })
    try {
      await axios.post('/api/v1/auth/login', { identifier, password })
      await useAuthStore.getState().fetchAuthUser()
      toast.success('Logged in successfully')
    } catch (error: unknown) {
      console.log(error)
      toast.error('Wrong identifier or password. Please try again')
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (username: string, email: string, password: string, confirmPassword: string) => {
    set({ isLoading: true })
    try {
      const registerData = { username, email, password, confirmPassword }
      await axios.post('/api/v1/auth/register', registerData)
      await useAuthStore.getState().fetchAuthUser()
      toast.success('Registered successfully')
    } catch (error: unknown) {
      console.log(error)
      toast.error('Registration failed. Please try again')
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await axios.post('/api/v1/auth/logout')

      get().cleanup()
      useMessageStore.getState().cleanup()
      useChatStore.getState().cleanup()
      useNotificationStore.getState().cleanup()
      useVideoCallStore.getState().cleanup()
      useWebSocketStore.getState().cleanup()

      toast.success('Logged out successfully')
    } catch (error: unknown) {
      console.log(error)
      toast.error('Something went wrong')
    } finally {
      set({ isLoading: false })
    }
  },

  forgotPassword: async (email: string) => {
    set({ isLoading: true })
    try {
      const response = await axios.post('/api/v1/auth/forgot-password', { email })
      toast.success(response.data.result.message || 'Reset password link sent to your email')
    } catch (error: unknown) {
      console.log(error)
      toast.error('Failed to send reset password link. Please try again')
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  resetPassword: async (token: string, password: string, confirmPassword: string) => {
    set({ isLoading: true })
    try {
      const searchParams = new URLSearchParams(window.location.search)
      const email = searchParams.get('email')

      if (!email) {
        throw new Error('Email is required')
      }

      const response = await axios.post('/api/v1/auth/reset-password', {
        token,
        email,
        password,
        confirmPassword,
      })
      toast.success(response.data.result.message || 'Password reset successful')
    } catch (error: unknown) {
      console.log(error)
      toast.error('Failed to reset password. Please try again')
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  cleanup: () =>
    set({
      authUser: null,
      isAuthLoading: false,
      isLoading: false,
      error: null,
    }),
}))
