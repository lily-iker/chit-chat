import type { MessageType } from './enum/MessageType'

export interface Message {
  id: string
  content?: string | null
  senderId?: string
  senderName?: string
  chatId: string
  messageType?: MessageType
  mediaUrl?: string | null
  replyToMessageId?: string | null
  replyToMessageContent?: string | null
  replyToMessageType?: MessageType | null
  replyToMessageMediaUrl?: string | null
  replyToMessageSenderId?: string | null
  isReplyMessageEdited?: boolean
  isReplyMessageDeleted?: boolean
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
