import type { MessageType } from './enum/MessageType'

export interface Chat {
  id: string
  name: string
  chatImageUrl?: string | null
  isGroupChat: boolean
  lastMessageContent?: string | null
  lastMessageSenderId?: string | null
  lastMessageSenderName?: string | null
  lastMessageType?: MessageType | null
  lastMessageMediaUrl?: string | null
  lastMessageTime?: string | null
  admins: string[] | null
  createdAt: string
  updatedAt: string
  createdBy: string
  participantsInfo?: ParticipantInfo[]
  unreadMessageCount?: number | null
  typingParticipants?: string[]
}

export interface ParticipantInfo {
  id: string
  fullName: string
  profileImageUrl: string
}
