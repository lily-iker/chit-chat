export const MessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  GIF: 'GIF',
  SYSTEM: 'SYSTEM',
} as const

export type MessageType = keyof typeof MessageType
