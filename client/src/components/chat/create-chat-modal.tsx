import { useState, useEffect, useRef } from 'react'
import { X, Users, Check, Camera } from 'lucide-react'
import { useRelationshipStore } from '@/store/useRelationshipStore'
import { useChatStore } from '@/store/useChatStore'
import { useAuthStore } from '@/store/useAuthStore'
import toast from 'react-hot-toast'
import type { UserProfileResponse } from '@/types/response/UserProfileResponse'
import { DEFAULT_PROFILE_IMAGE } from '@/constant/image'

interface CreateChatModalProps {
  isOpen: boolean
  onClose: () => void
}

const CreateChatModal = ({ isOpen, onClose }: CreateChatModalProps) => {
  const [query, setQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState<UserProfileResponse[]>([])
  const [chatName, setChatName] = useState('')
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

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
  const { createChat, isCreatingChat } = useChatStore()

  const friendsListRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Current display image (preview if file selected, otherwise default)
  const currentDisplayImage = previewImageUrl || DEFAULT_PROFILE_IMAGE

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

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewImageUrl && previewImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewImageUrl)
      }
    }
  }, [previewImageUrl])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    // if (file.size > 5 * 1024 * 1024) {
    //   toast.error('Image size should be less than 5MB')
    //   return
    // }

    // Clean up previous preview URL
    if (previewImageUrl && previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl)
    }

    // Set new file and preview
    setSelectedImageFile(file)
    setPreviewImageUrl(URL.createObjectURL(file))
  }

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

    if (!authUser) return

    const createChatRequest = {
      name: selectedParticipants.length > 1 ? chatName : 'private',
      participants: [...selectedParticipants.map((p) => p.id), authUser.id],
      admins: [authUser.id],
    }

    await createChat(createChatRequest, selectedImageFile)
    handleClose()
  }

  const handleClose = () => {
    setQuery('')
    setIsTyping(false)
    setSelectedParticipants([])
    setChatName('')
    setSelectedImageFile(null)
    if (previewImageUrl && previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl)
    }
    setPreviewImageUrl(null)
    setIsPreviewOpen(false)
    searchFriends('', true)
    onClose()
  }

  const displayUsers = query.trim() ? friendSearchResults : friends
  const isLoading = isTyping || (query.trim() ? friendSearchLoading : friendsLoading)
  const hasMore = query.trim() ? friendSearchHasMore : friendsHasMore

  if (!isOpen) return null

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />

      <div className="modal modal-open">
        <div className="modal-box w-11/12 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Create New Chat</h3>
            <button onClick={handleClose} className="btn btn-sm btn-circle btn-ghost">
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedParticipants.length > 1 && (
            <div className="mb-6 space-y-4">
              {/* Group Image Section */}
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <div
                    className="w-24 h-24 rounded-full overflow-hidden bg-base-300 shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setIsPreviewOpen(true)}
                  >
                    <img
                      src={currentDisplayImage || '/placeholder.svg'}
                      alt="Group Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Edit button overlay */}
                  <button
                    className="absolute bottom-0 right-0 bg-primary p-2 rounded-full shadow-lg hover:bg-primary-focus transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    title="Change group image"
                  >
                    <Camera className="w-4 h-4 text-primary-content" />
                  </button>
                </div>
              </div>

              {/* Group Name Input */}
              <div className="space-y-2">
                <label className="label">
                  <span className="label-text">Group Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter group name"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  className="w-full pl-4 pr-12 py-2 ring-1 ring-gray-500 bg-base-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={100}
                />
                <div className="label">
                  <span className="label-text-alt">{chatName.length}/100 characters</span>
                </div>
              </div>
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
                className="w-full pl-4 pr-12 py-2 ring-1 ring-gray-500 bg-base-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                      src={participant.profileImageUrl || DEFAULT_PROFILE_IMAGE}
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
                                src={user.profileImageUrl || DEFAULT_PROFILE_IMAGE}
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
                  {!hasMore && displayUsers.length > 20 && (
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
              disabled={selectedParticipants.length === 0 || isCreatingChat}
              className={`btn btn-primary ${isCreatingChat ? 'loading' : ''}`}
            >
              {isCreatingChat
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

      {/* Image Preview Modal */}
      {isPreviewOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="relative bg-base-100 rounded-lg shadow-xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-2 right-2 bg-base-200 hover:bg-error text-base-content hover:text-white p-1.5 rounded-full shadow transition"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={currentDisplayImage || '/placeholder.svg'}
              alt="Group Avatar Preview"
              className="w-full h-auto rounded"
            />
          </div>
        </div>
      )}
    </>
  )
}

export default CreateChatModal
