import { create } from 'zustand'

type ThemeState = {
  theme: string
  setTheme: (theme: string) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: localStorage.getItem('chit-chat-theme') || 'dracula',
  setTheme: (theme) => {
    localStorage.setItem('chit-chat-theme', theme)
    set({ theme })
  },
}))
