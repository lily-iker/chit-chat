import { create } from 'zustand'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useNotificationStore } from './useNotificationStore'

type WebSocketState = {
  client: Client | null

  connect: () => void
  disconnect: () => void

  cleanup: () => void
}

let didSubscribeToNotifications = false

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  client: null,

  connect: () => {
    const { client } = get()

    // Prevent reconnecting to websocket if already connected
    if (client && client.connected) {
      console.log('Already connected to WebSocket')
      return
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
    const webSocketPath = '/ws'

    const newClient = new Client({
      webSocketFactory: () => new SockJS(`${backendUrl}${webSocketPath}`),
      reconnectDelay: 5000,
      onConnect: () => {
        set({ client: newClient })
        console.log('WebSocket connected')
        if (!didSubscribeToNotifications) {
          useNotificationStore.getState().subscribeToNotifications()
          didSubscribeToNotifications = true
        }
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame)
      },
      onWebSocketClose: () => {
        console.log('WebSocket connection closed')
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event)
      },
    })

    newClient.activate()
  },

  disconnect: () => {
    const { client } = get()

    client?.deactivate()

    set({ client: null })

    didSubscribeToNotifications = false
  },

  cleanup: () => {
    get().disconnect()
    set({ client: null })
  },
}))
