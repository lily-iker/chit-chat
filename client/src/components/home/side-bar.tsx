'use client'

import { useChatStore } from '@/store/useChatStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Search, Users, Plus, Phone, Video, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import ChatsSkeleton from './skeleton/chats-skeleton'
import type { Chat } from '@/types/Chat'
import { formatChatTime } from '@/utils/timeUtils'

const Sidebar = () => {
  const {
    selectedChat,
    getChatById,
    chats,
    isChatsLoading,
    isLoadingMoreChats,
    hasMoreChats,
    loadMoreChats,
    subscribe,
    unsubscribe,
  } = useChatStore()

  const { authUser } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')

  // Infinite scroll for chats
  const { containerRef: chatsContainerRef, handleScroll } = useInfiniteScroll({
    hasMore: hasMoreChats,
    isLoading: isLoadingMoreChats,
    onLoadMore: loadMoreChats,
    threshold: 50,
    direction: 'bottom',
  })

  const handleSelectChat = (chatId: string) => {
    // Prevent re-fetching if already selected
    if (selectedChat?.id === chatId) return
    // Disconnect from previous chat
    if (selectedChat) {
      unsubscribe()
    }
    // Get chat details and connect to WebSocket
    getChatById(chatId).then(() => {
      subscribe(chatId)
    })
  }

  useEffect(() => {
    const container = chatsContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // Filter chats based on search query
  const filteredChats = chats.filter(
    (chat) =>
      chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessageContent?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getMessagePreview = (chat: Chat) => {
    if (!chat.lastMessageContent) return null

    // if (chat.lastMessageMediaType === 'VOICE') {
    //   return (
    //     <div className="flex items-center gap-1 text-base-content/70">
    //       <Phone className="w-3 h-3" />
    //       <span>Voice Message</span>
    //     </div>
    //   )
    // } else
    if (chat.lastMessageMediaType === 'IMAGE') {
      return (
        <div className="flex items-center gap-1 text-base-content/70">
          <span className="text-base-content/70">📷 Photo</span>
        </div>
      )
    } else if (chat.lastMessageMediaType === 'VIDEO') {
      return (
        <div className="flex items-center gap-1 text-base-content/70">
          <Video className="w-3 h-3" />
          <span>Video</span>
        </div>
      )
    }

    // Regular text message
    const sender = chat.isGroupChat
      ? chat.lastMessageSenderId === authUser?.id
        ? 'You'
        : `${chat.lastMessageSenderName}`
      : chat.lastMessageSenderId === authUser?.id && 'You'

    const combined = sender ? `${sender}: ${chat.lastMessageContent}` : chat.lastMessageContent

    const preview = combined.length > 33 ? `${combined.slice(0, 30)}...` : combined

    return <span className="text-base-content/70">{preview}</span>
  }

  return (
    <aside className="h-full w-[350px] border-r border-base-300 flex flex-col bg-base-100">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Chats</h1>
          <div className="flex items-center gap-2">
            <button className="btn btn-circle btn-sm btn-ghost">
              <Settings className="w-4 h-4" />
            </button>
            <button
              className="btn btn-circle btn-sm btn-ghost"
              onClick={() => console.log('Create new chat')}
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Search in chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-base-200 rounded-full text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* Chat List */}
      <div
        ref={chatsContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent"
      >
        {isChatsLoading ? (
          <ChatsSkeleton />
        ) : filteredChats.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Users className="w-16 h-16 text-base-content/30 mb-4" />
            <h3 className="text-lg font-medium text-base-content/70 mb-2">
              {searchQuery ? 'No chats found' : 'No conversations yet'}
            </h3>
            <p className="text-sm text-base-content/50">
              {searchQuery
                ? 'Try searching for something else'
                : 'Make some friends to see it here'}
            </p>
          </div>
        ) : (
          // Chat items
          <div>
            {filteredChats.map((chat) => {
              // const isTyping = chat.participantsInfo?.some(
              //   (p) => p.id !== authUser?.id && chat.typingUserIds?.includes(p.id)
              // )

              const isTyping = chat.typingParticipants && chat.typingParticipants?.length > 0

              return (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`
                    w-full p-3 flex items-center gap-3 hover:bg-base-200 
                    transition-colors relative
                    ${selectedChat?.id === chat.id ? 'bg-base-200' : ''}
                  `}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-base-300">
                      <img
                        src={chat.chatImageUrl || '/avatar.png'}
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
                      <span
                        className={`text-xs ${
                          chat.unreadMessageCount ? 'text-base-content' : 'text-base-content/60'
                        }`}
                      >
                        {chat.lastMessageTime && formatChatTime(chat.lastMessageTime)}
                      </span>
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
                        ) : chat.lastMessageContent ? (
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
            {isLoadingMoreChats && (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner loading-sm"></span>
              </div>
            )}

            {/* No more chats indicator */}
            {!hasMoreChats && chats.length > 0 && (
              <div className="flex justify-center py-2">
                <span className="text-xs text-base-content/50">You're all caught up!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
