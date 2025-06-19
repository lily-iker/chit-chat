import type { MediaType } from './enum/MediaType'
import type { MessageType } from './enum/MessageType'

export interface Message {
  id: string
  content?: string | null
  senderId?: string
  senderName?: string
  chatId: string
  messageType?: MessageType
  mediaType?: MediaType | null
  mediaUrl?: string | null
  replyToMessageId?: string | null
  replyToMessageContent?: string | null
  replyToMessageSenderId?: string | null
  replyToMessageSenderName?: string | null
  isEdited?: boolean
  isDeleted?: boolean
  createdAt: string
  updatedAt: string
  readInfo?: MessageReadInfo[]
}

interface MessageReadInfo {
  userId: string
  readAt: string
}
