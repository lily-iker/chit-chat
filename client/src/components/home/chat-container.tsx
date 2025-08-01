import { useChatStore } from '@/store/useChatStore'
import { useEffect, useRef } from 'react'
import ChatHeader from './chat-header'
import MessageInput from './message-input'
import { useAuthStore } from '@/store/useAuthStore'
import { MessageType } from '@/types/enum/MessageType'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import TypingIndicator from './typing-indicator'
import { isSameDay } from '@/utils/timeUtils'
import ChatMessagesSkeleton from './skeleton/chat-messages-skeleton'
import ChatMessage from '../message/chat-message'

const ChatContainer = () => {
  const {
    selectedChat,
    selectedChatMessages,
    getSelectedChatMessages,
    isSelectedChatMessagesLoading,
    isLoadingMoreMessages,
    hasMoreMessages,
    loadMoreMessages,
    markChatAsRead,
  } = useChatStore()

  const { authUser } = useAuthStore()

  const lastMarkedMessageId = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const initialLoadComplete = useRef<boolean>(false)

  const { containerRef: messagesContainerRef, handleScroll } = useInfiniteScroll({
    hasMore: hasMoreMessages,
    isLoading: isLoadingMoreMessages,
    onLoadMore: async () => {
      if (selectedChat && messagesContainerRef.current) {
        const container = messagesContainerRef.current
        const prevScrollHeight = container.scrollHeight
        const prevScrollTop = container.scrollTop

        await loadMoreMessages(selectedChat.id)

        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight
          const scrollDelta = newScrollHeight - prevScrollHeight
          container.scrollTop = prevScrollTop + scrollDelta
        })
      }
    },
    threshold: 50,
    direction: 'top',
  })

  // Auto scroll to bottom when new messages arrive if the scroll near bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 500

      if (isNearBottom || !initialLoadComplete.current) {
        bottomRef.current?.scrollIntoView({ behavior: isNearBottom ? 'smooth' : 'auto' })
      }
    }
  }, [selectedChatMessages.length])

  // Fetch messages when chat changes
  useEffect(() => {
    if (selectedChat) {
      initialLoadComplete.current = false
      getSelectedChatMessages(selectedChat.id).then(() => {
        // Immediately scroll to bottom after messages are loaded
        requestAnimationFrame(() => {
          if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'auto' })
            initialLoadComplete.current = true
          }
        })
      })
    }
  }, [selectedChat, getSelectedChatMessages])

  useEffect(() => {
    if (!selectedChat || !selectedChatMessages.length || !authUser?.id) return

    const lastMessage = selectedChatMessages[selectedChatMessages.length - 1]

    if (lastMessage.senderId !== authUser.id && lastMessage.id !== lastMarkedMessageId.current) {
      markChatAsRead(selectedChat.id)
      lastMarkedMessageId.current = lastMessage.id
    }
  }, [selectedChatMessages])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // Get the latest seen message for each user
  const getLatestSeenByUser = () => {
    const latestSeenByUser = new Map<string, { messageId: string; readAt: string }>()

    for (let i = selectedChatMessages.length - 1; i >= 0; i--) {
      const message = selectedChatMessages[i]

      if (message.readInfo) {
        message.readInfo.forEach((readInfo) => {
          if (readInfo.userId === authUser?.id) return

          if (!latestSeenByUser.has(readInfo.userId)) {
            latestSeenByUser.set(readInfo.userId, {
              messageId: message.id,
              readAt: readInfo.readAt,
            })
          }
        })
      }
    }

    return latestSeenByUser
  }

  const latestSeenByUser = getLatestSeenByUser()

  const shouldShowSeenIndicators = (messageId: string, senderId: string) => {
    const message = selectedChatMessages.find((m) => m.id === messageId)
    if (!message || !message.readInfo) return []

    const seenUsers = Array.from(latestSeenByUser.entries())
      .filter(([_, data]) => data.messageId === messageId)
      .map(([userId]) => userId)
      .filter((userId) => userId !== senderId) // Exclude the sender from seen indicators
      .filter((userId) => {
        // Find when this user read the message
        const readInfo = message.readInfo?.find((r) => r.userId === userId)
        if (!readInfo) return false

        const readTime = new Date(readInfo.readAt).getTime()

        // Check if this user sent any message after reading this message
        const userSentMessageAfterReading = selectedChatMessages.some(
          (msg) =>
            msg.senderId === userId &&
            new Date(msg.createdAt).getTime() > readTime &&
            msg.messageType !== MessageType.SYSTEM
        )

        // Only show seen indicator if user hasn't sent a message after reading
        return !userSentMessageAfterReading
      })

    return seenUsers
  }

  if (isSelectedChatMessagesLoading) {
    return <ChatMessagesSkeleton />
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatHeader />

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Loading indicator for more messages */}
        {isLoadingMoreMessages && (
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        )}

        {/* No more messages indicator */}
        {!hasMoreMessages && selectedChatMessages.length > 20 && (
          <div className="flex justify-center py-4">
            <span className="text-xs text-base-content/60">
              {"🎉 You've reached the beginning of this chat"}
            </span>
          </div>
        )}

        {selectedChatMessages.map((message, index) => {
          const isMyMessage = message.senderId === authUser?.id
          const seenByUsers = shouldShowSeenIndicators(message.id, message.senderId ?? '')

          // Find the sender's info from chat participants
          const senderInfo = selectedChat?.participantsInfo?.find((p) => p.id === message.senderId)

          // Check if this message is consecutive from the same sender
          const prevMessage = selectedChatMessages[index - 1]
          const isConsecutive =
            prevMessage &&
            prevMessage.senderId === message.senderId &&
            prevMessage.messageType !== MessageType.SYSTEM

          // Check if next message is from same sender
          const nextMessage = selectedChatMessages[index + 1]
          const nextIsFromSameSender =
            nextMessage &&
            nextMessage.senderId === message.senderId &&
            nextMessage.messageType !== MessageType.SYSTEM

          // Determine if this message should show profile image
          const showProfileImage = !nextIsFromSameSender

          const shouldShowDateDivider =
            (!prevMessage || !isSameDay(message.createdAt, prevMessage.createdAt)) &&
            // Don't show date divider on first message if we're loading more messages
            !(index === 0 && isLoadingMoreMessages)

          return (
            <div key={message.id} className="relative">
              <ChatMessage
                message={message}
                isMyMessage={isMyMessage}
                senderInfo={senderInfo}
                showProfileImage={showProfileImage}
                isConsecutive={isConsecutive}
                isGroupChat={selectedChat?.isGroupChat || false}
                seenByUsers={seenByUsers}
                participantsInfo={selectedChat?.participantsInfo}
                shouldShowDateDivider={shouldShowDateDivider}
              />
            </div>
          )
        })}
        <TypingIndicator />

        <div ref={bottomRef} />
      </div>

      <MessageInput />
    </div>
  )
}

export default ChatContainer
