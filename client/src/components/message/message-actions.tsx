import { MoreHorizontal, Trash2, Copy, Pencil } from 'lucide-react'
import { useMessageStore } from '@/store/useMessageStore'
import { useAuthStore } from '@/store/useAuthStore'
import type { Message } from '@/types/Message'
import { MessageType } from '@/types/enum/MessageType'
import toast from 'react-hot-toast'

interface MessageActionsProps {
  message: Message
  onEdit?: () => void
}

export default function MessageActions({ message, onEdit }: MessageActionsProps) {
  const { deleteMessage, isDeleting } = useMessageStore()
  const { authUser } = useAuthStore()

  const isMyMessage = message.senderId === authUser?.id
  const canEdit = isMyMessage && message.messageType === MessageType.TEXT && !message.isDeleted
  const canDelete = isMyMessage && !message.isDeleted

  const handleCopy = async () => {
    if (message.content) {
      try {
        await navigator.clipboard.writeText(message.content)
        toast.success('Message copied to clipboard')
      } catch (error) {
        toast.error('Failed to copy message')
      }
    }
  }

  const handleEdit = () => {
    onEdit?.()
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage(message.id)
      } catch (error) {
        console.error('Failed to delete message:', error)
      }
    }
  }

  return (
    <div
      className={`dropdown dropdown-center dropdown-top ${
        isMyMessage ? 'dropdown-left' : 'dropdown-right'
      }`}
    >
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreHorizontal className="w-5 h-5 -m-0.5" />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
      >
        <li>
          <button onClick={handleCopy} className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Copy message
          </button>
        </li>
        {canEdit && (
          <li>
            <button onClick={handleEdit} className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Edit message
            </button>
          </li>
        )}
        {canDelete && (
          <li>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 text-error"
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete message'}
            </button>
          </li>
        )}
      </ul>
    </div>
  )
}
