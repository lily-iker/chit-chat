export const RelationshipStatus = {
  FRIEND: 'FRIEND',
  BLOCKED: 'BLOCKED',
  FRIEND_REQUEST_SENT: 'FRIEND_REQUEST_SENT',
  FRIEND_REQUEST_RECEIVED: 'FRIEND_REQUEST_RECEIVED',
  NONE: 'NONE',
} as const

export type RelationshipStatus = (typeof RelationshipStatus)[keyof typeof RelationshipStatus]
