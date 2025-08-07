import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Send, X, AudioLinesIcon, ImagesIcon } from 'lucide-react'
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react'
import { useMessageStore } from '@/store/useMessageStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useChatStore } from '@/store/useChatStore'
import GifPicker from './gif-picker'
import { HiGif } from 'react-icons/hi2'
import { FaRegSmile } from 'react-icons/fa'
import ReplyPreview from '../message/reply-preview'

const TYPING_EVENT_DEBOUNCE_TIME = 3000
const TYPING_EVENT_THROTTLE_TIME = 3000

const MessageInput = () => {
  const [text, setText] = useState('')
  const [mediaPreview, setMediaPreview] = useState<{
    url: string
    type: 'image' | 'video' | 'audio'
  } | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const textInputRef = useRef<HTMLInputElement | null>(null)
  const emojiPickerRef = useRef<HTMLDivElement | null>(null)
  const gifPickerRef = useRef<HTMLDivElement | null>(null)
  const lastTypingTimeRef = useRef<number>(0)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef<boolean>(false)

  const { sendMessage } = useMessageStore()
  const { selectedChat, sendTypingEvent, replyingToMessage, setReplyingToMessage } = useChatStore()
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setText(value)

    if (!selectedChat || !authUser) return
    sendTypingEventWithStrategy()
  }

  const handleMediaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const url = reader.result as string

      if (file.type.startsWith('image/')) {
        setMediaPreview({ url, type: 'image' })
      } else if (file.type.startsWith('video/')) {
        setMediaPreview({ url, type: 'video' })
      } else if (file.type.startsWith('audio/')) {
        setMediaPreview({ url, type: 'audio' })
      }
    }
    reader.readAsDataURL(file)
  }

  // Update removeMedia function
  const removeMedia = () => {
    setMediaPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji
    const input = textInputRef.current

    if (input) {
      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0
      const newText = text.slice(0, start) + emoji + text.slice(end)
      const newCursorPosition = start + emoji.length

      setText(newText)

      // Cursor positioning
      requestAnimationFrame(() => {
        input.focus()
        input.setSelectionRange(newCursorPosition, newCursorPosition)
      })
    } else {
      setText((prev) => prev + emoji)
    }

    // Trigger typing event when emoji is added
    if (!selectedChat || !authUser) return
    sendTypingEventWithStrategy()
  }

  const handleGifSelect = (gifUrl: string) => {
    // Send GIF message immediately when selected (like Messenger/Discord)
    if (!selectedChat || !authUser) return

    const formData = new FormData()
    const sendMessageRequest = {
      chatId: selectedChat.id,
      senderId: authUser.id,
      mediaUrl: gifUrl, // Send GIF URL as mediaUrl
      ...(replyingToMessage && { replyToMessageId: replyingToMessage.id }),
    }

    formData.append(
      'sendMessageRequest',
      new Blob([JSON.stringify(sendMessageRequest)], { type: 'application/json' })
    )

    sendMessage(formData)
    setShowGifPicker(false)
    setReplyingToMessage(null)
  }

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev)
    setShowGifPicker(false)
  }

  const toggleGifPicker = () => {
    setShowGifPicker((prev) => !prev)
    setShowEmojiPicker(false)
  }

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim() && !mediaPreview) return

    // Clear typing state when sending message
    isTypingRef.current = false
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (!selectedChat || !authUser) return

    // Send text message if there is text
    if (text.trim()) {
      const formData = new FormData()

      const sendMessageRequest = {
        chatId: selectedChat.id,
        senderId: authUser.id,
        content: text.trim(),
        ...(replyingToMessage && { replyToMessageId: replyingToMessage.id }),
      }

      formData.append(
        'sendMessageRequest',
        new Blob([JSON.stringify(sendMessageRequest)], { type: 'application/json' })
      )

      await sendMessage(formData)
    }

    // Send 2 separate messages if both text and media are present
    if (mediaPreview) {
      const mediaFormData = new FormData()
      const sendMessageRequest = {
        chatId: selectedChat.id,
        senderId: authUser.id,
        ...(replyingToMessage && { replyToMessageId: replyingToMessage.id }),
      }

      mediaFormData.append(
        'sendMessageRequest',
        new Blob([JSON.stringify(sendMessageRequest)], { type: 'application/json' })
      )
      const blob = await fetch(mediaPreview.url).then((res) => res.blob())
      const fileExtension =
        mediaPreview.type === 'image' ? 'png' : mediaPreview.type === 'video' ? 'mp4' : 'mp3'
      mediaFormData.append('mediaFile', blob, `media.${fileExtension}`)

      await sendMessage(mediaFormData)
    }

    // Clear the input fields after sending the messages
    setText('')
    setMediaPreview(null)
    setShowEmojiPicker(false)
    setReplyingToMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('[data-emoji-button]')
      ) {
        setShowEmojiPicker(false)
      }

      if (
        gifPickerRef.current &&
        !gifPickerRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('[data-gif-button]')
      ) {
        setShowGifPicker(false)
      }
    }

    if (showEmojiPicker || showGifPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker, showGifPicker])

  return (
    <div className="p-4 w-full relative">
      {/* Reply Preview */}
      {replyingToMessage && (
        <ReplyPreview message={replyingToMessage} onCancel={() => setReplyingToMessage(null)} />
      )}
      {mediaPreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            {mediaPreview.type === 'image' && (
              <img
                src={mediaPreview.url}
                alt="Preview"
                className="max-w-[200px] object-cover rounded-lg border border-zinc-700"
              />
            )}

            {mediaPreview.type === 'video' && (
              <video
                controls
                className="max-w-[200px] object-cover rounded-lg border border-zinc-700"
              >
                <source src={mediaPreview.url} type="video/mp4" />
              </video>
            )}

            {mediaPreview.type === 'audio' && (
              <div className="max-w-[200px] flex items-center justify-center bg-gray-100 rounded-lg border border-zinc-700">
                <AudioLinesIcon size={20} className="text-gray-500" />
              </div>
            )}
            <button
              onClick={removeMedia}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-full right-32 mb-2 z-50">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            autoFocusSearch={false}
            theme={Theme.AUTO}
            width={350}
            height={400}
            previewConfig={{
              showPreview: false,
            }}
            skinTonesDisabled
            searchDisabled={false}
          />
        </div>
      )}

      {/* GIF Picker */}
      {showGifPicker && (
        <div ref={gifPickerRef} className="absolute bottom-full left-4 mb-2 z-50">
          <GifPicker onGifSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            ref={textInputRef}
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder={replyingToMessage ? 'Reply to message...' : 'Type a message...'}
            value={text}
            onChange={handleInputChange}
          />

          <input
            type="file"
            accept="image/*,video/*,audio/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleMediaChange}
          />

          {/* Emoji Button */}
          <button
            type="button"
            className={`btn btn-circle bg-transparent border-none btn-sm sm:btn-md ${
              showEmojiPicker
                ? 'text-primary hover:text-primary-focus'
                : 'text-zinc-400 hover:text-primary'
            }`}
            onClick={toggleEmojiPicker}
            data-emoji-button
          >
            <FaRegSmile size={21} />
          </button>

          {/* GIF Button */}
          <button
            type="button"
            className={`btn btn-circle bg-transparent border-none btn-sm sm:btn-md ${
              showGifPicker
                ? 'text-primary hover:text-primary-focus'
                : 'text-zinc-400 hover:text-primary'
            }`}
            onClick={toggleGifPicker}
            data-gif-button
          >
            <HiGif size={24} />
          </button>

          {/* Image Button */}
          <button
            type="button"
            className={`btn btn-circle bg-transparent border-none btn-sm sm:btn-md ${
              mediaPreview
                ? 'text-primary hover:text-primary-focus'
                : 'text-zinc-400 hover:text-primary'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagesIcon size={20} />
          </button>
        </div>

        <button
          type="submit"
          className={`btn btn-sm bg-transparent border-none btn-circle sm:btn-md text-zinc-400 ${
            !text.trim() && !mediaPreview ? 'pointer-events-none' : 'hover:text-primary'
          }`}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  )
}

export default MessageInput
