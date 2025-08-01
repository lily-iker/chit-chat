import { useState } from 'react'
import { useMessageStore } from '@/store/useMessageStore'
import type { Message } from '@/types/Message'

interface MessageEditFormProps {
  message: Message
  onCancel: () => void
  onSave: () => void
}

export default function MessageEditForm({ message, onCancel, onSave }: MessageEditFormProps) {
  const [content, setContent] = useState(message.content || '')
  const { updateMessage, isUpdating } = useMessageStore()

  const handleSave = async () => {
    if (content.trim() === message.content?.trim()) {
      onCancel()
      return
    }

    if (!content.trim()) {
      return
    }

    try {
      await updateMessage(message.id, content.trim())
      onSave()
    } catch (error) {
      console.error('Failed to update message:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        className="textarea textarea-bordered w-full min-h-[60px] resize-none"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Edit your message..."
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <button className="btn btn-outline btn-sm" onClick={onCancel} disabled={isUpdating}>
          Cancel
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={isUpdating || !content.trim()}
        >
          {isUpdating ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Saving...
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>
      <div className="text-xs text-base-content/60">Press Enter to save, Escape to cancel</div>
    </div>
  )
}
