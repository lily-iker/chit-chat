import type { ChatEvent } from '../enum/ChatEvent'

export interface WebSocketResponse<T> {
  event: ChatEvent
  data: T
}
