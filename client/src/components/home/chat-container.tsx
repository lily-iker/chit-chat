import { useChatStore } from '@/store/useChatStore'
import { useEffect, useRef } from 'react'
import ChatHeader from './chat-header'
import MessageInput from './message-input'
import { useAuthStore } from '@/store/useAuthStore'
import { MessageType } from '@/types/enum/MessageType'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import TypingIndicator from './typing-indicator'
import { formatDateDivider, formatMessageTime, isSameDay } from '@/utils/timeUtils'
import DateDivider from './date-divider'
import ChatMessagesSkeleton from './skeleton/chat-messages-skeleton'

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

  const shouldShowSeenIndicators = (messageId: string) => {
    const seenUsers = Array.from(latestSeenByUser.entries())
      .filter(([_, data]) => data.messageId === messageId)
      .map(([userId]) => userId)

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
          const seenByUsers = shouldShowSeenIndicators(message.id)

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
            !prevMessage || !isSameDay(message.createdAt, prevMessage.createdAt)

          // SYSTEM message
          if (message.messageType === MessageType.SYSTEM) {
            return (
              <div key={message.id} className="w-full text-center py-2">
                {shouldShowDateDivider && (
                  <DateDivider date={formatDateDivider(message.createdAt)} />
                )}
                <div className="w-full text-center py-2">
                  <span className="text-xs text-base-content/60 italic">{message.content}</span>
                </div>{' '}
              </div>
            )
          }

          return (
            <div key={message.id} className="relative">
              {shouldShowDateDivider && <DateDivider date={formatDateDivider(message.createdAt)} />}
              {/* Message container */}
              <div
                className={`flex items-end gap-2 ${isMyMessage ? 'justify-end' : 'justify-start'} ${
                  isConsecutive ? 'mt-1' : 'mt-4'
                }`}
              >
                {/* Left side - Other user's profile image */}
                {!isMyMessage && (
                  <div className="flex-shrink-0 w-8 h-8">
                    {showProfileImage ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img
                          src={
                            senderInfo?.profileImageUrl ||
                            'https://avatars.githubusercontent.com/u/157276347?s=96&v=4' ||
                            '/placeholder.svg'
                          }
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8"></div>
                    )}
                  </div>
                )}

                {/* Message content */}
                <div
                  className={`flex flex-col tooltip max-w-[50%] lg:max-w-[60%] ${
                    isMyMessage ? 'items-end tooltip-left' : 'items-start tooltip-right'
                  }`}
                  data-tip={formatMessageTime(message.createdAt)}
                >
                  {/* Sender name for group chats */}
                  {!isConsecutive && !isMyMessage && selectedChat?.isGroupChat && (
                    <div className="text-xs font-semibold text-base-content/70 mb-1 px-1">
                      {senderInfo?.fullName || 'Unknown'}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className="relative">
                    {/* Media attachment if any */}
                    {message.mediaUrl ? (
                      <div className="mb-2">
                        {message.messageType === 'IMAGE' && (
                          <img
                            src={message.mediaUrl}
                            alt={message.content || 'Image attachment'}
                            className="max-w-[250px] rounded-lg"
                            loading="lazy"
                          />
                        )}

                        {message.messageType === 'GIF' && (
                          <img
                            src={message.mediaUrl}
                            alt={message.content || 'GIF attachment'}
                            className="max-w-[250px] rounded-lg"
                            loading="lazy"
                          />
                        )}

                        {message.messageType === 'VIDEO' && (
                          <video controls className="max-w-[250px] rounded-lg">
                            <source src={message.mediaUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        )}

                        {message.messageType === 'AUDIO' && (
                          <audio controls className="w-full max-w-[250px]">
                            <source
                              src={message.mediaUrl}
                              type={`audio/${message.mediaUrl.split('.').pop()}`}
                            />
                            Your browser does not support audio.
                          </audio>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`px-3 py-2 break-words whitespace-pre-wrap relative ${
                          isMyMessage
                            ? `bg-primary text-primary-content ${
                                showProfileImage ? 'rounded-xl rounded-br-sm' : 'rounded-xl'
                              }`
                            : `bg-secondary text-secondary-content ${
                                showProfileImage ? 'rounded-xl rounded-bl-sm' : 'rounded-xl'
                              }`
                        }`}
                        style={{
                          wordBreak: 'break-word', // Ensures breaking of long words
                          wordWrap: 'break-word', // Prevents overflow by wrapping long words
                        }}
                      >
                        {/* Message content */}
                        {message.content && <div>{message.content}</div>}
                      </div>
                    )}

                    {/* Message tail for last message in sequence */}
                    {showProfileImage && <></>}
                  </div>
                </div>

                {/* Right side - My profile image */}
                {isMyMessage && (
                  <div className="flex-shrink-0 w-8 h-8">
                    {showProfileImage && (
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img
                          src={
                            senderInfo?.profileImageUrl ||
                            'https://avatars.githubusercontent.com/u/157276347?s=96&v=4' ||
                            '/placeholder.svg'
                          }
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Seen indicators */}
              {seenByUsers.length > 0 && isMyMessage && (
                <div className="flex justify-end mt-1 mr-10">
                  <div className="flex flex-wrap gap-1 justify-end relative">
                    {seenByUsers.slice(0, 5).map((userId) => {
                      const participant = selectedChat?.participantsInfo?.find(
                        (p) => p.id === userId
                      )
                      return (
                        <div
                          key={userId}
                          className="w-4 h-4 rounded-full border-2 border-base-100 tooltip tooltip-left"
                          data-tip={`Seen by ${
                            participant?.fullName || 'Unknown'
                          } ${formatMessageTime(
                            message.readInfo?.find((r) => r.userId === userId)?.readAt || ''
                          )}`}
                        >
                          <img
                            src={
                              participant?.profileImageUrl ||
                              'https://avatars.githubusercontent.com/u/157276347?s=96&v=4' ||
                              '/placeholder.svg'
                            }
                            alt="Seen"
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                      )
                    })}
                    {seenByUsers.length > 5 && (
                      <div
                        className="w-4 h-4 rounded-full bg-base-300 border-2 border-base-100 flex items-center justify-center tooltip tooltip-left"
                        data-tip={`Seen by ${seenByUsers.length} people`}
                      >
                        <span className="text-xs text-base-content font-bold">
                          +{seenByUsers.length - 5}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
