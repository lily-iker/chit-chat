import { X } from 'lucide-react'
import type { Message } from '@/types/Message'
import { MessageType } from '@/types/enum/MessageType'
import { useChatStore } from '@/store/useChatStore'
import { FaReply } from 'react-icons/fa'
import { useAuthStore } from '@/store/useAuthStore'

interface ReplyPreviewProps {
  message: Message
  onCancel: () => void
}

export default function ReplyPreview({ message, onCancel }: ReplyPreviewProps) {
  const { authUser } = useAuthStore()
  const { selectedChat } = useChatStore()

  const getSenderInfo = () => {
    if (!selectedChat?.participantsInfo) return null
    return selectedChat.participantsInfo.find((p) => p.id === message.senderId)
  }

  const senderInfo = getSenderInfo()

  const getContentPreview = () => {
    if (message.isDeleted) {
      return <span className="italic text-base-content/50">This message was deleted</span>
    }

    if (message.messageType === MessageType.IMAGE) {
      return (
        <div className="flex items-center gap-2">
          <span>📷</span>
          <span>{message.content || 'Image'}</span>
        </div>
      )
    }

    if (message.messageType === MessageType.VIDEO) {
      return (
        <div className="flex items-center gap-2">
          <span>🎥</span>
          <span>{message.content || 'Video'}</span>
        </div>
      )
    }

    if (message.messageType === MessageType.AUDIO) {
      return (
        <div className="flex items-center gap-2">
          <span>🎵</span>
          <span>{message.content || 'Audio'}</span>
        </div>
      )
    }

    if (message.messageType === MessageType.GIF) {
      return (
        <div className="flex items-center gap-2">
          <span>🎬</span>
          <span>GIF</span>
        </div>
      )
    }

    // Text message
    const content = message.content || ''
    return content.length > 50 ? `${content.substring(0, 50)}...` : content
  }

  return (
    <div className="mb-3 p-3 bg-base-300 rounded-lg">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <FaReply className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-primary">
                Replying to{' '}
                {senderInfo?.id === authUser?.id ? 'you' : senderInfo?.fullName || 'Unknown User'}
              </span>
              {message.isEdited && (
                <span className="text-xs text-base-content/50 italic">(edited)</span>
              )}
            </div>
            <div className="text-sm text-base-content/70 break-words">{getContentPreview()}</div>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="btn btn-ghost btn-xs btn-circle flex-shrink-0"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
