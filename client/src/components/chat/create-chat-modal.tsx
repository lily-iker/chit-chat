import { useState, useEffect, useRef } from 'react'
import { X, Users, Check } from 'lucide-react'
import { useRelationshipStore } from '@/store/useRelationshipStore'
import { useChatStore } from '@/store/useChatStore'
import { useAuthStore } from '@/store/useAuthStore'
import axios from '@/lib/axios-custom'
import toast from 'react-hot-toast'
import type { UserProfileResponse } from '@/types/response/UserProfileResponse'

interface CreateChatModalProps {
  isOpen: boolean
  onClose: () => void
}

interface CreateChatRequest {
  name: string
  participants: string[]
  admins: string[]
}

const CreateChatModal = ({ isOpen, onClose }: CreateChatModalProps) => {
  const [query, setQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState<UserProfileResponse[]>([])
  const [chatName, setChatName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const { authUser } = useAuthStore()
  const {
    friends,
    getFriends,
    friendsLoading,
    friendsHasMore,
    friendSearchResults,
    friendSearchLoading,
    friendSearchHasMore,
    friendSearchQuery,
    searchFriends,
  } = useRelationshipStore()
  const { getChats } = useChatStore()
  const friendsListRef = useRef<HTMLDivElement>(null)

  // Load friends when modal opens
  useEffect(() => {
    if (isOpen) {
      getFriends(true)
    }
  }, [isOpen, getFriends])

  // Clear results immediately when query changes
  useEffect(() => {
    if (query.trim() !== friendSearchQuery && friendSearchQuery !== '') {
      searchFriends('', true)
      setIsTyping(true)
    } else if (query.trim()) {
      setIsTyping(true)
    }
  }, [query, friendSearchQuery, searchFriends])

  // Debounced search
  useEffect(() => {
    if (query.trim()) setIsTyping(true)

    const timer = setTimeout(async () => {
      if (query.trim() !== friendSearchQuery) {
        if (query.trim()) {
          await searchFriends(query.trim(), true)
        }
      }
      setIsTyping(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [query, friendSearchQuery, searchFriends])

  // Reset typing when loading
  useEffect(() => {
    if (friendSearchLoading) {
      setIsTyping(false)
    }
  }, [friendSearchLoading])

  const handleClearSearch = () => {
    setQuery('')
    setIsTyping(false)
    searchFriends('', true)
  }

  const handleLoadMore = () => {
    if (query.trim()) {
      searchFriends(query.trim(), false)
    } else if (friendsHasMore && !friendsLoading) {
      getFriends(false)
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50
    if (isNearBottom) handleLoadMore()
  }

  const handleParticipantToggle = (user: UserProfileResponse) => {
    setSelectedParticipants((prev) => {
      const isSelected = prev.some((p) => p.id === user.id)
      return isSelected ? prev.filter((p) => p.id !== user.id) : [...prev, user]
    })
  }

  const handleCreateChat = async () => {
    if (selectedParticipants.length === 0) {
      toast.error('Please select at least one participant')
      return
    }
    if (selectedParticipants.length > 1 && !chatName.trim()) {
      toast.error('Please enter a group name')
      return
    }

    setIsCreating(true)
    try {
      if (!authUser) return

      const createChatRequest: CreateChatRequest = {
        name: selectedParticipants.length > 1 ? chatName : 'private',
        participants: [...selectedParticipants.map((p) => p.id), authUser.id],
        admins: [authUser.id],
      }

      const formData = new FormData()
      formData.append(
        'createChatRequest',
        new Blob([JSON.stringify(createChatRequest)], { type: 'application/json' })
      )

      await axios.post('/api/v1/chats', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      toast.success('Chat created successfully')
      await getChats()
      handleClose()
    } catch (error: any) {
      console.error('Failed to create chat:', error)
      toast.error(error.response?.data?.message || 'Failed to create chat')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setQuery('')
    setIsTyping(false)
    setSelectedParticipants([])
    setChatName('')
    searchFriends('', true)
    onClose()
  }

  const displayUsers = query.trim() ? friendSearchResults : friends
  const isLoading = isTyping || (query.trim() ? friendSearchLoading : friendsLoading)
  const hasMore = query.trim() ? friendSearchHasMore : friendsHasMore

  if (!isOpen) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">Create New Chat</h3>
          <button onClick={handleClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="w-4 h-4" />
          </button>
        </div>

        {selectedParticipants.length > 1 && (
          <div className="mb-4 space-y-2">
            <label className="label">
              <span className="label-text">Group Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter group name"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              className="input input-bordered w-full"
              maxLength={100}
            />
          </div>
        )}

        <div className="mb-4 space-y-2">
          <label className="label">
            <span className="label-text">Search Friends</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search friends by name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input input-bordered w-full"
            />
            {query && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-base-300 rounded-full"
              >
                {isLoading && query.trim() ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {selectedParticipants.length > 0 && (
          <div className="mb-4 space-y-2">
            <label className="label">
              <span className="label-text">
                Selected Participants ({selectedParticipants.length})
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedParticipants.map((participant) => (
                <div key={participant.id} className="badge badge-primary gap-2 py-3">
                  <img
                    src={
                      participant.profileImageUrl ||
                      '/placeholder.svg?height=20&width=20&query=user avatar'
                    }
                    alt={participant.fullName}
                    className="w-4 h-4 rounded-full"
                  />
                  {participant.fullName}
                  <button onClick={() => handleParticipantToggle(participant)}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 space-y-2">
          <label className="label">
            <span className="label-text">{query.trim() ? 'Search Results' : 'Your Friends'}</span>
          </label>
          <div
            ref={friendsListRef}
            className="max-h-60 overflow-y-auto border border-base-300 rounded-lg"
            onScroll={handleScroll}
          >
            {isLoading && displayUsers.length === 0 ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-2 rounded-lg bg-base-200 animate-pulse"
                  >
                    <div className="w-10 h-10 rounded-full bg-base-300" />
                    <div className="h-4 w-32 bg-base-300 rounded" />
                  </div>
                ))}
              </div>
            ) : displayUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="w-12 h-12 text-base-content/30 mb-2" />
                <p className="text-sm text-base-content/60">
                  {query.trim() ? 'No friends found' : 'No friends yet'}
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-base-300">
                  {displayUsers.map((user) => {
                    const isSelected = selectedParticipants.some((p) => p.id === user.id)
                    return (
                      <div
                        key={user.id}
                        className={`p-3 flex items-center gap-3 hover:bg-base-200 cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => handleParticipantToggle(user)}
                      >
                        <div className="avatar">
                          <div className="w-10 h-10 rounded-full">
                            <img
                              src={
                                user.profileImageUrl ||
                                '/placeholder.svg?height=40&width=40&query=user avatar'
                              }
                              alt={user.fullName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{user.fullName}</h4>
                        </div>
                        <div className="flex items-center">
                          {isSelected ? (
                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-content" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 border-2 border-base-300 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {isLoading && displayUsers.length > 0 && (
                  <div className="flex justify-center py-4">
                    <span className="loading loading-spinner loading-sm"></span>
                  </div>
                )}

                {!hasMore && displayUsers.length > 0 && (
                  <div className="text-center py-4">
                    <span className="text-sm text-base-content/60">
                      {query.trim() ? 'No more results' : "You've reached the end"}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={handleClose} className="btn btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleCreateChat}
            disabled={selectedParticipants.length === 0 || isCreating}
            className={`btn btn-primary ${isCreating ? 'loading' : ''}`}
          >
            {isCreating
              ? 'Creating...'
              : selectedParticipants.length === 0
              ? 'Create Chat'
              : selectedParticipants.length < 2
              ? 'Create Private Chat'
              : 'Create Group Chat'}
          </button>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </div>
  )
}

export default CreateChatModal
