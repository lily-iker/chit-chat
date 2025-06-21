import type React from 'react'

import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Image, Send, X } from 'lucide-react'
import { useMessageStore } from '@/store/useMessageStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useChatStore } from '@/store/useChatStore'

const TYPING_EVENT_DEBOUNCE_TIME = 3000
const TYPING_EVENT_THROTTLE_TIME = 3000

const MessageInput = () => {
  const [text, setText] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const lastTypingTimeRef = useRef<number>(0)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef<boolean>(false)

  const { sendMessage } = useMessageStore()
  const { selectedChat, sendTypingEvent } = useChatStore()
  const { authUser } = useAuthStore()

  const sendTypingEventWithStrategy = () => {
    if (!selectedChat || !authUser) return

    const now = Date.now()
    const timeSinceLastTyping = now - lastTypingTimeRef.current

    // If this is the first typing event or enough time has passed, send immediately
    if (!isTypingRef.current || timeSinceLastTyping > TYPING_EVENT_THROTTLE_TIME) {
      lastTypingTimeRef.current = now
      isTypingRef.current = true
      sendTypingEvent(selectedChat.id, authUser.id)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set a timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
    }, TYPING_EVENT_DEBOUNCE_TIME)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setText(value)

    if (!selectedChat || !authUser) return

    sendTypingEventWithStrategy()
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim() && !imagePreview) return

    // Clear typing state when sending message
    isTypingRef.current = false
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (!selectedChat || !authUser) return

    const formData = new FormData()

    const sendMessageRequest = {
      chatId: selectedChat.id,
      senderId: authUser.id,
      content: text.trim(),
    }

    formData.append(
      'sendMessageRequest',
      new Blob([JSON.stringify(sendMessageRequest)], { type: 'application/json' })
    )

    if (imagePreview) {
      const blob = await fetch(imagePreview).then((res) => res.blob())
      formData.append('mediaFile', blob, 'image.png')
    }

    await sendMessage(formData)

    setText('')
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview || '/placeholder.svg'}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={handleInputChange}
          />
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`sm:flex btn btn-circle ${
              imagePreview ? 'text-emerald-500' : 'text-zinc-400'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  )
}

export default MessageInput
