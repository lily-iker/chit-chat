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

    const formatNames = (participants: any[] | undefined): string => {
      if (!participants || participants.length === 0) return 'Unknown'
      return participants.map((p) => (p.id === authUserId ? 'you' : p.fullName)).join(', ')
    }

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
      case SystemMessageAction.VIDEO_CALL_START:
        return `${actorName} started a video call`
      case SystemMessageAction.VIDEO_CALL_JOIN:
        return `${actorName} joined the video call`
      case SystemMessageAction.VIDEO_CALL_LEAVE:
        return `${actorName} left the video call`
      case SystemMessageAction.VIDEO_CALL_END:
        return `Video call ended`
      case SystemMessageAction.ADD_PARTICIPANTS:
        return `${actorName} added ${formatNames(parsedContent.metadata.participants)} to the chat`
      case SystemMessageAction.REMOVE_PARTICIPANT:
        return `${actorName} removed ${formatNames(
          parsedContent.metadata.participants
        )} from the chat`
      case SystemMessageAction.PROMOTE_TO_ADMIN:
        return `${actorName} promoted ${formatNames(parsedContent.metadata.participants)} to admin`
      case SystemMessageAction.DEMOTE_FROM_ADMIN:
        return `${actorName} demoted ${formatNames(parsedContent.metadata.participants)} from admin`
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
      case SystemMessageAction.VIDEO_CALL_START:
        return `${actorName} started a video call`
      case SystemMessageAction.VIDEO_CALL_JOIN:
        return `${actorName} joined the video call`
      case SystemMessageAction.VIDEO_CALL_LEAVE:
        return `${actorName} left the video call`
      case SystemMessageAction.VIDEO_CALL_END:
        return `Video call ended`
      case SystemMessageAction.ADD_PARTICIPANTS: {
        const names = formatParticipants(
          parsedContent.metadata.participants,
          authUserId,
          participantsInfo
        )
        return `${actorName} added ${names} to the chat`
      }
      case SystemMessageAction.REMOVE_PARTICIPANT: {
        const names = formatParticipants(
          parsedContent.metadata.participants,
          authUserId,
          participantsInfo
        )
        return `${actorName} removed ${names} from the chat`
      }
      case SystemMessageAction.PROMOTE_TO_ADMIN: {
        const names = formatParticipants(
          parsedContent.metadata.participants,
          authUserId,
          participantsInfo
        )
        return `${actorName} promoted ${names} to admin`
      }
      case SystemMessageAction.DEMOTE_FROM_ADMIN: {
        const names = formatParticipants(
          parsedContent.metadata.participants,
          authUserId,
          participantsInfo
        )
        return `${actorName} demoted ${names} from admin`
      }
      default:
        return `${actorName} performed an action`
    }
  } catch (e) {
    return '[Invalid system message]'
  }
}
const formatParticipants = (
  participants: any[] | undefined,
  authUserId: string,
  participantsInfo: ParticipantInfo[] | undefined
) => {
  if (!participants || participants.length === 0) return 'Unknown'

  const names = participants.map((p) => {
    if (p.id === authUserId) return 'you'
    return participantsInfo?.find((pi) => pi.id === p.id)?.fullName ?? p.fullName ?? 'Unknown'
  })

  // Move "you" to the front if exists
  const youIndex = names.indexOf('you')
  if (youIndex > 0) {
    names.splice(youIndex, 1)
    names.unshift('you')
  }

  // Join with commas and "and" for the last element
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}
