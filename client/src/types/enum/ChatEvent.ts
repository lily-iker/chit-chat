export const ChatEvent = {
  NEW_MESSAGE: 'NEW_MESSAGE',
  MESSAGE_EDITED: 'MESSAGE_EDITED',
  MESSAGE_DELETED: 'MESSAGE_DELETED',
  CHAT_READ: 'CHAT_READ',
  CHAT_CREATED: 'CHAT_CREATED',
  USER_TYPING: 'USER_TYPING',
} as const

export type ChatEvent = (typeof ChatEvent)[keyof typeof ChatEvent]
