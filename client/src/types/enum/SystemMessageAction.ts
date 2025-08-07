export const SystemMessageAction = {
  CREATE_PRIVATE_CHAT: 'CREATE_PRIVATE_CHAT',
  CREATE_GROUP_CHAT: 'CREATE_GROUP_CHAT',
  UPDATE_GROUP_CHAT_NAME: 'UPDATE_GROUP_CHAT_NAME',
  UPDATE_GROUP_CHAT_IMAGE: 'UPDATE_GROUP_CHAT_IMAGE',
} as const

export type SystemMessageAction = (typeof SystemMessageAction)[keyof typeof SystemMessageAction]
