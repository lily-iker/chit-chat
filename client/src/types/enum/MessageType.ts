export const MessageType = {
  TEXT: 'TEXT',
  MEDIA: 'MEDIA',
  TEXT_WITH_MEDIA: 'TEXT_WITH_MEDIA',
  SYSTEM: 'SYSTEM',
} as const

export type MessageType = keyof typeof MessageType
