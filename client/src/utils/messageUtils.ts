import type { ParticipantInfo } from '@/types/Chat'
import { SystemMessageAction } from '@/types/enum/SystemMessageAction'
import type { Message } from '@/types/Message'
import type { SystemMessage } from '@/types/SystemMessage'

export const renderLastSystemMessage = (
  content: string,
  senderName: string,
  authUserId: string
) => {
  try {
    const parsedContent: SystemMessage = JSON.parse(content ?? '{}')
    const actorName = parsedContent.actorId === authUserId ? 'You' : senderName

    switch (parsedContent.action) {
      case SystemMessageAction.CREATE_PRIVATE_CHAT:
        return `You can now chat each other`
      case SystemMessageAction.CREATE_GROUP_CHAT:
        return `${actorName} created the group`
      case SystemMessageAction.UPDATE_GROUP_CHAT_NAME:
        return `${actorName} updated the chat name to "${parsedContent.metadata.newGroupChatName}"`
      case SystemMessageAction.UPDATE_GROUP_CHAT_IMAGE:
        return `${actorName} updated the chat image`
      default:
        return `${actorName} performed an action`
    }
  } catch (e) {
    return '[Invalid system message]'
  }
}

export const renderSystemMessage = (
  message: Message,
  participantsInfo: ParticipantInfo[] | undefined,
  authUserId: string
) => {
  try {
    if (message.messageType !== 'SYSTEM' || !message.content) return

    const parsedContent: SystemMessage = JSON.parse(message.content ?? '{}')

    const actorInfo = participantsInfo?.find((p) => p.id === parsedContent.actorId)

    const actorName =
      parsedContent.actorId === authUserId ? 'You' : actorInfo?.fullName ?? 'Unknown User'

    switch (parsedContent.action) {
      case SystemMessageAction.CREATE_PRIVATE_CHAT:
        return `You can now chat each other`
      case SystemMessageAction.CREATE_GROUP_CHAT:
        return `${actorName} created the group`
      case SystemMessageAction.UPDATE_GROUP_CHAT_NAME:
        return `${actorName} updated the chat name to "${parsedContent.metadata.newGroupChatName}"`
      case SystemMessageAction.UPDATE_GROUP_CHAT_IMAGE:
        return `${actorName} updated the chat image`
      default:
        return `${actorName} performed an action`
    }
  } catch (e) {
    return '[Invalid system message]'
  }
}
