export const ChatEvent = {
  NEW_MESSAGE: 'NEW_MESSAGE',
  MESSAGE_EDITED: 'MESSAGE_EDITED',
  MESSAGE_DELETED: 'MESSAGE_DELETED',
  CHAT_READ: 'CHAT_READ',
  NEW_CHAT: 'NEW_CHAT',
  CHAT_UPDATED: 'CHAT_UPDATED',
  USER_TYPING: 'USER_TYPING',
} as const

export type ChatEvent = (typeof ChatEvent)[keyof typeof ChatEvent]
