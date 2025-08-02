'use client'

import { useChatStore } from '@/store/useChatStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Search, Users, Plus, MessageSquareText, Settings, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import type { Chat } from '@/types/Chat'
import { Link } from 'react-router'
import { MessageType } from '@/types/enum/MessageType'
import ChatsSkeleton from './skeleton/chats-skeleton'
import ChatTime from './chat-time'
import CreateChatModal from '../chat/create-chat-modal'
import { DEFAULT_PROFILE_IMAGE } from '@/constant/image'

const ChatList = () => {
  const {
    chats,
    getChatById,
    subscribe,
    unsubscribe,
    selectedChat,
    isChatsLoading,
    isLoadingMoreChats,
    hasMoreChats,
    loadMoreChats,
    chatSearchResults,
    chatSearchLoading,
    chatSearchHasMore,
    chatSearchQuery,
    chatSearchTotalCount,
    searchChats,
    loadMoreSearchResults,
    clearSearch,
  } = useChatStore()

  const { authUser } = useAuthStore()
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isCreateChatModalOpen, setIsCreateChatModalOpen] = useState(false)

  // Debounced search effect
  useEffect(() => {
    if (localSearchQuery.trim() !== chatSearchQuery) {
      setIsTyping(true)
    }

    const timer = setTimeout(async () => {
      if (localSearchQuery.trim() !== chatSearchQuery) {
        if (localSearchQuery.trim()) {
          await searchChats(localSearchQuery.trim(), true)
        } else {
          clearSearch()
        }
      }
      setIsTyping(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [localSearchQuery, chatSearchQuery, searchChats, clearSearch])

  // Reset typing when search loading starts
  useEffect(() => {
    if (chatSearchLoading) {
      setIsTyping(false)
    }
  }, [chatSearchLoading])

  const handleClearSearch = () => {
    setLocalSearchQuery('')
    setIsTyping(false)
    clearSearch()
  }

  const handleLoadMoreSearch = () => {
    if (localSearchQuery.trim()) {
      loadMoreSearchResults()
    }
  }

  // Show loading when either typing or search is in progress
  const isSearchLoading = isTyping || chatSearchLoading

  // Use search results if searching, otherwise use regular chats
  const displayChats = localSearchQuery.trim() ? chatSearchResults : chats
  const displayLoading = localSearchQuery.trim() ? isSearchLoading : isChatsLoading
  const displayHasMore = localSearchQuery.trim() ? chatSearchHasMore : hasMoreChats
  const displayLoadMore = localSearchQuery.trim() ? handleLoadMoreSearch : loadMoreChats

  // Infinite scroll for chats
  const { containerRef: chatsContainerRef, handleScroll } = useInfiniteScroll({
    hasMore: displayHasMore,
    isLoading: isLoadingMoreChats,
    onLoadMore: displayLoadMore,
    threshold: 100,
    direction: 'bottom',
  })

  useEffect(() => {
    const container = chatsContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const handleChatClick = async (chatId: string) => {
    // Prevent re-fetching if already selected
    if (selectedChat?.id === chatId) return
    // Disconnect from previous chat
    if (selectedChat) {
      unsubscribe()
    }
    // Get chat details and connect to WebSocket
    await getChatById(chatId)
    subscribe(chatId)
  }

  const getMessagePreview = (chat: Chat) => {
    const sender = chat.isGroupChat
      ? chat.lastMessageSenderId === authUser?.id
        ? 'You'
        : chat.lastMessageSenderName && chat.lastMessageSenderName
      : chat.lastMessageSenderId === authUser?.id && 'You'

    // Handle deleted message preview
    if (chat.isLastMessageDeleted) {
      return (
        <span className="italic text-base-content/50">
          {chat.isGroupChat
            ? sender
              ? `${sender} deleted a message`
              : 'A message was deleted'
            : chat.lastMessageSenderId === authUser?.id
            ? 'You deleted a message'
            : 'A message was deleted'}
        </span>
      )
    }

    // if (chat.lastMessageType === MessageType.AUDIO) {
    //   return (
    //     <div className="flex items-center gap-1 text-base-content/70">
    //       <span>{sender} send an audio 🎶</span>
    //     </div>
    //   )
    // } else
    if (chat.lastMessageType === MessageType.IMAGE) {
      return (
        <div className="flex items-center gap-1 text-base-content/70">
          <span>{sender} send an image 🖼</span>
        </div>
      )
    } else if (chat.lastMessageType === MessageType.VIDEO) {
      return (
        <div className="flex items-center gap-1 text-base-content/70">
          <span>{sender} send a video 🎬</span>
        </div>
      )
    } else if (chat.lastMessageType === MessageType.GIF) {
      return (
        <div className="flex items-center gap-1 text-base-content/70">
          <span>{sender} send a GIF 👾</span>
        </div>
      )
    }

    // Regular text message
    if (!chat.lastMessageContent) return null

    const combined = sender ? `${sender}: ${chat.lastMessageContent}` : chat.lastMessageContent

    const preview = combined.length > 33 ? `${combined.slice(0, 30)}...` : combined

    if (chat.lastMessageType === MessageType.SYSTEM) {
      return <span className="text-accent/90 italic">{preview}</span>
    }

    return <span className="text-base-content/70">{preview}</span>
  }

  return (
    <div className="flex flex-col h-full w-full bg-base-100">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-base-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquareText className="w-5 h-5 text-primary" />
              </div>
              <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
                ChitChat
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-circle btn-sm btn-ghost">
              <Settings className="w-4 h-4" />
            </button>
            <button
              className="btn btn-circle btn-sm btn-ghost"
              onClick={() => setIsCreateChatModalOpen(true)}
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Search chats and contacts..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-2 bg-base-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {localSearchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-base-300 rounded-full transition-colors"
            >
              {isSearchLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Search Results Header */}
        {localSearchQuery.trim() && (
          <div className="text-sm text-base-content/70">
            {!isSearchLoading && (
              <span className="block truncate max-w-full" title={localSearchQuery}>
                {chatSearchTotalCount} result{chatSearchTotalCount !== 1 ? 's' : ''} for "
                <span className="font-medium">{localSearchQuery}</span>"
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chat List */}
      <div
        ref={chatsContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent"
      >
        {displayLoading ? (
          <ChatsSkeleton />
        ) : displayChats.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Users className="w-16 h-16 text-base-content/30 mb-4" />
            <h3 className="text-lg font-medium text-base-content/70 mb-2">
              {localSearchQuery ? 'No chats found' : 'No conversations yet'}
            </h3>
            <p className="text-sm text-base-content/50">
              {localSearchQuery
                ? 'Try searching for a chat name or message content'
                : 'Make some friends to see it here'}
            </p>
          </div>
        ) : (
          // Chat items
          <div>
            {displayChats.map((chat) => {
              const isTyping = chat.typingParticipants && chat.typingParticipants?.length > 0
              return (
                <button
                  key={chat.id}
                  onClick={() => handleChatClick(chat.id)}
                  className={`
                    w-full p-3 flex items-center gap-3 hover:bg-base-200
                     transition-colors relative
                    ${selectedChat?.id === chat.id ? 'bg-base-200' : ''}
                  `}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <img
                        src={chat.chatImageUrl || DEFAULT_PROFILE_IMAGE}
                        alt={chat.name || 'Chat Avatar'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Online indicator - can be added based on your online status logic */}
                    {/* <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-base-100"></div> */}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`font-medium truncate ${
                          chat.unreadMessageCount ? 'font-semibold' : ''
                        }`}
                      >
                        {chat.name || 'Unknown Chat'}
                      </h3>
                      {chat.lastMessageTime && (
                        <ChatTime
                          timestamp={chat.lastMessageTime}
                          className={`text-xs ${
                            chat.unreadMessageCount ? 'text-base-content' : 'text-base-content/60'
                          }`}
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-0.5">
                      <div className="truncate text-xs max-w-[85%]">
                        {isTyping ? (
                          <div className="flex items-center gap-1">
                            <div className="bg-secondary rounded-xl px-2 py-1.5">
                              <div className="flex space-x-1">
                                <div
                                  className="w-1.5 h-1.5 rounded-full bg-secondary-content opacity-60 animate-bounce"
                                  style={{ animationDelay: '0ms' }}
                                />
                                <div
                                  className="w-1.5 h-1.5 rounded-full bg-secondary-content opacity-60 animate-bounce"
                                  style={{ animationDelay: '100ms' }}
                                />
                                <div
                                  className="w-1.5 h-1.5 rounded-full bg-secondary-content opacity-60 animate-bounce"
                                  style={{ animationDelay: '200ms' }}
                                />
                              </div>
                            </div>
                          </div>
                        ) : chat.lastMessageType ? (
                          getMessagePreview(chat)
                        ) : (
                          <span className="text-base-content/50 italic">No messages yet</span>
                        )}
                      </div>

                      {/* Unread message count */}
                      {chat.unreadMessageCount ? (
                        <div className="min-w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs px-1">
                          {chat.unreadMessageCount}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
              )
            })}

            {/* Loading more indicator */}
            {(isLoadingMoreChats || (localSearchQuery.trim() && chatSearchLoading)) && (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner loading-sm"></span>
              </div>
            )}

            {/* Load more for search results */}
            {localSearchQuery.trim() && chatSearchHasMore && !chatSearchLoading && (
              <div className="flex justify-center py-4">
                <button onClick={handleLoadMoreSearch} className="btn btn-sm btn-ghost">
                  Load more results
                </button>
              </div>
            )}

            {/* No more results indicator */}
            {!displayHasMore && displayChats.length > 0 && (
              <div className="flex justify-center py-2">
                <span className="text-xs text-base-content/50">
                  {localSearchQuery.trim() ? 'No more search results' : "You're all caught up!"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateChatModal
        isOpen={isCreateChatModalOpen}
        onClose={() => setIsCreateChatModalOpen(false)}
      />
    </div>
  )
}

export default ChatList
