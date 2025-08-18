import {
  X,
  Users,
  Calendar,
  Crown,
  MessageSquareText,
  UserPlus,
  UserMinus,
  LogOut,
  Camera,
  Save,
  Trash2,
  ChevronUp,
  ChevronDown,
  MoreVertical,
} from 'lucide-react'
import { DEFAULT_PROFILE_IMAGE } from '@/constant/image'
import { useAuthStore } from '@/store/useAuthStore'
import type { Chat } from '@/types/Chat'
import { formatMessageTime } from '@/utils/timeUtils'
import { useNavigate } from 'react-router'
import { useRef, useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { TbCancel } from 'react-icons/tb'
import { useChatStore } from '@/store/useChatStore'
import AddParticipantModal from './add-participant-modal'

interface ChatInfoModalProps {
  isOpen: boolean
  onClose: () => void
  chat: Chat
}

export default function ChatInfoModal({ isOpen, onClose, chat }: ChatInfoModalProps) {
  const { authUser } = useAuthStore()
  const {
    updateChat,
    isUpdatingChat,
    removeParticipantFromChat,
    promoteParticipantToAdmin,
    demoteAdminToParticipant,
    // leaveChat,
    // deleteChat,
    isManagingParticipants,
    setSelectedChat,
    unsubscribe,
  } = useChatStore()

  const navigate = useNavigate()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [chatName, setChatName] = useState(chat.name)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    type: 'remove' | 'promote' | 'demote' | 'leave' | 'delete'
    targetUserId?: string
    targetUserName?: string
  } | null>(null)

  const isCurrentUserAdmin = chat.admins?.includes(authUser?.id || '')
  const isGroupChat = chat.isGroupChat
  const participantCount = chat.participantsInfo?.length || 0

  // Check if there are any changes
  const hasChanges = chatName.trim() !== chat.name || selectedImageFile !== null

  // Current display image (preview if file selected, otherwise original)
  const currentDisplayImage = previewImageUrl || chat.chatImageUrl || DEFAULT_PROFILE_IMAGE

  // Reset form when modal opens/closes or chat changes
  useEffect(() => {
    if (isOpen) {
      setChatName(chat.name)
      setSelectedImageFile(null)
      setPreviewImageUrl('')
    }
  }, [isOpen, chat.name])

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewImageUrl && previewImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewImageUrl)
      }
    }
  }, [previewImageUrl])

  const getCreatorInfo = () => {
    return chat.participantsInfo?.find((p) => p.id === chat.createdBy)
  }

  const handleImageClick = () => {
    if (isGroupChat) {
      setIsPreviewOpen(true)
    } else {
      const otherParticipant = chat.participantsInfo?.find((p) => p.id !== authUser?.id)
      if (otherParticipant) {
        navigate(`/user/${otherParticipant.id}`)
      }
    }
  }

  const creatorInfo = getCreatorInfo()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Clean up previous preview URL
    if (previewImageUrl && previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl)
    }

    // Set new file and preview
    setSelectedImageFile(file)
    setPreviewImageUrl(URL.createObjectURL(file))
  }

  const handleUpdateChat = async () => {
    if (!hasChanges) return

    // Validate chat name
    if (!chatName.trim()) {
      toast.error('Chat name cannot be empty')
      return
    }

    if (chatName.trim().length < 2) {
      toast.error('Chat name must be at least 2 characters')
      return
    }

    await updateChat(chat.id, { name: chatName.trim() }, selectedImageFile)
    setSelectedImageFile(null)
    if (previewImageUrl && previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl)
    }
    setPreviewImageUrl('')
    onClose()
  }

  const handleDiscardChanges = () => {
    setChatName(chat.name)
    setSelectedImageFile(null)

    if (previewImageUrl && previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl)
    }
    setPreviewImageUrl('')
  }

  const handleAddParticipant = () => {
    setShowAddParticipantModal(true)
  }

  const handleRemoveParticipant = async (participantId: string) => {
    if (showConfirmDialog?.type === 'remove' && showConfirmDialog.targetUserId === participantId) {
      await removeParticipantFromChat(chat.id, participantId)
      setShowConfirmDialog(null)
    } else {
      const participant = chat.participantsInfo?.find((p) => p.id === participantId)
      setShowConfirmDialog({
        type: 'remove',
        targetUserId: participantId,
        targetUserName: participant?.fullName || 'Unknown User',
      })
    }
  }

  const handlePromoteParticipant = async (participantId: string) => {
    if (showConfirmDialog?.type === 'promote' && showConfirmDialog.targetUserId === participantId) {
      await promoteParticipantToAdmin(chat.id, participantId)
      setShowConfirmDialog(null)
    } else {
      const participant = chat.participantsInfo?.find((p) => p.id === participantId)
      setShowConfirmDialog({
        type: 'promote',
        targetUserId: participantId,
        targetUserName: participant?.fullName || 'Unknown User',
      })
    }
  }

  const handleDemoteAdmin = async (participantId: string) => {
    if (showConfirmDialog?.type === 'demote' && showConfirmDialog.targetUserId === participantId) {
      await demoteAdminToParticipant(chat.id, participantId)
      setShowConfirmDialog(null)
    } else {
      const participant = chat.participantsInfo?.find((p) => p.id === participantId)
      setShowConfirmDialog({
        type: 'demote',
        targetUserId: participantId,
        targetUserName: participant?.fullName || 'Unknown User',
      })
    }
  }

  const handleLeaveGroup = async () => {
    if (showConfirmDialog?.type === 'leave') {
      // await leaveChat(chat.id)
      setShowConfirmDialog(null)
      unsubscribe()
      setSelectedChat(null)
      onClose()
    } else {
      setShowConfirmDialog({ type: 'leave' })
    }
  }

  const handleDeleteChat = async () => {
    if (showConfirmDialog?.type === 'delete') {
      // await deleteChat(chat.id)
      setShowConfirmDialog(null)
      unsubscribe()
      setSelectedChat(null)
      onClose()
    } else {
      setShowConfirmDialog({ type: 'delete' })
    }
  }

  const canRemoveParticipant = (participantId: string) => {
    if (!isCurrentUserAdmin) return false
    if (participantId === authUser?.id) return false

    // Check if removing this admin would leave no admins
    const isTargetAdmin = chat.admins?.includes(participantId)
    const adminCount = chat.admins?.length || 0

    if (isTargetAdmin && adminCount <= 1) return false

    return true
  }

  const canPromoteParticipant = (participantId: string) => {
    return (
      isCurrentUserAdmin && participantId !== authUser?.id && !chat.admins?.includes(participantId)
    )
  }

  const canDemoteAdmin = (participantId: string) => {
    if (!isCurrentUserAdmin) return false
    if (participantId === authUser?.id) return false
    if (!chat.admins?.includes(participantId)) return false

    // Don't allow demoting if it would leave no admins
    const adminCount = chat.admins?.length || 0
    return adminCount > 1
  }

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

      {/* Modal backdrop */}
      <div className="modal modal-open">
        <div className="modal-box w-11/12 max-w-md max-h-[80vh] overflow-y-auto">
          {/* Modal header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              {isGroupChat ? (
                <Users className="w-5 h-5" />
              ) : (
                <MessageSquareText className="w-5 h-5" />
              )}
              {isGroupChat ? 'Group Info' : 'Chat Info'}
            </h3>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Chat Avatar and Name Section */}
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Avatar with edit functionality */}
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden bg-base-300 shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleImageClick}
                >
                  <img
                    src={currentDisplayImage || '/placeholder.svg'}
                    alt="Chat Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Edit button overlay for admins */}
                {isCurrentUserAdmin && isGroupChat && (
                  <button
                    className="absolute bottom-0 right-0 bg-base-300 p-2 rounded-full shadow-lg hover:bg-primary-focus transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUpdatingChat}
                    title="Change group image"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Chat name input */}
              <div className="w-full space-y-2">
                {isCurrentUserAdmin && isGroupChat ? (
                  <div className="form-control w-full max-w-xs mx-auto">
                    <input
                      type="text"
                      value={chatName}
                      onChange={(e) => setChatName(e.target.value)}
                      className="w-full rounded-xl px-4 py-1 text-center text-xl font-semibold focus:outline-none hover:bg-base-200 focus:ring-2 focus:ring-primary transition-all"
                      placeholder="Enter chat name"
                      maxLength={100}
                    />
                    {hasChanges && isCurrentUserAdmin && isGroupChat && (
                      <div className="label pt-1">
                        <span className="label-text-alt text-center w-full">
                          {chatName.length}/100 characters
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <h2 className="text-xl font-semibold">{chat.name}</h2>
                )}
              </div>

              {/* Update/Discard buttons - only show when there are changes */}
              {hasChanges && isCurrentUserAdmin && isGroupChat && (
                <div className="flex gap-2 w-full">
                  <button
                    className="btn btn-sm flex-1 text-error"
                    onClick={handleDiscardChanges}
                    disabled={isUpdatingChat}
                  >
                    <TbCancel className="w-4 h-4" />
                    Discard
                  </button>
                  <button
                    className="btn btn-primary btn-sm flex-1 gap-2"
                    onClick={handleUpdateChat}
                    disabled={isUpdatingChat}
                  >
                    {isUpdatingChat ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Update Chat
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Chat Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-accent" />
                <div>
                  <p className="font-medium">Created at</p>
                  <p className="text-base-content/70">{formatMessageTime(chat.createdAt)}</p>
                </div>
              </div>

              {creatorInfo && (
                <div className="flex items-center gap-3 text-sm">
                  <Crown className="w-4 h-4 text-warning" />
                  <div>
                    <p className="font-medium">Created by</p>
                    <p className="text-base-content/70">
                      {creatorInfo.fullName}
                      {creatorInfo.id === authUser?.id && ' (You)'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Participants Section */}
            {isGroupChat && chat.participantsInfo && (
              <>
                <div className="divider"></div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Participants ({participantCount})</h3>
                    {isCurrentUserAdmin && (
                      <button className="btn btn-sm" onClick={handleAddParticipant}>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {[...chat.participantsInfo]
                      .sort((a, b) => {
                        const isCurrentUserA = a.id === authUser?.id
                        const isCurrentUserB = b.id === authUser?.id
                        const isAdminA = chat.admins?.includes(a.id)
                        const isAdminB = chat.admins?.includes(b.id)

                        if (isCurrentUserA) return -1
                        if (isCurrentUserB) return 1
                        if (isAdminA && !isAdminB) return -1
                        if (isAdminB && !isAdminA) return 1
                        return a.fullName.localeCompare(b.fullName)
                      })
                      .map((participant) => {
                        const isAdmin = chat.admins?.includes(participant.id)
                        const isCurrentUser = participant.id === authUser?.id

                        return (
                          <div
                            key={participant.id}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200 transition-colors"
                          >
                            <div
                              className="flex items-center gap-3 flex-1 cursor-pointer"
                              onClick={() => navigate(`/user/${participant.id}`)}
                            >
                              <div className="avatar">
                                <div className="w-8 h-8 rounded-full">
                                  <img
                                    src={participant.profileImageUrl || DEFAULT_PROFILE_IMAGE}
                                    alt={participant.fullName}
                                  />
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {participant.fullName}
                                  {isCurrentUser && (
                                    <span className="text-base-content/50 ml-1">(You)</span>
                                  )}
                                </p>
                                {isAdmin && (
                                  <div className="badge badge-warning badge-sm gap-1">
                                    <Crown className="w-3 h-3" />
                                    Admin
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Participant Actions */}
                            {isCurrentUserAdmin && !isCurrentUser && (
                              <div className="dropdown dropdown-left dropdown-center">
                                <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                                  <MoreVertical className="w-4 h-4" />
                                </div>
                                <ul
                                  tabIndex={0}
                                  className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                                >
                                  {!isAdmin && canPromoteParticipant(participant.id) && (
                                    <li>
                                      <button
                                        onClick={() => handlePromoteParticipant(participant.id)}
                                        disabled={isManagingParticipants}
                                        className="text-success"
                                      >
                                        <ChevronUp className="w-4 h-4" />
                                        Promote to Admin
                                      </button>
                                    </li>
                                  )}
                                  {isAdmin && canDemoteAdmin(participant.id) && (
                                    <li>
                                      <button
                                        onClick={() => handleDemoteAdmin(participant.id)}
                                        disabled={isManagingParticipants}
                                        className="text-warning"
                                      >
                                        <ChevronDown className="w-4 h-4" />
                                        Demote to Member
                                      </button>
                                    </li>
                                  )}
                                  {canRemoveParticipant(participant.id) && (
                                    <li>
                                      <button
                                        onClick={() => handleRemoveParticipant(participant.id)}
                                        disabled={isManagingParticipants}
                                        className="text-error"
                                      >
                                        <UserMinus className="w-4 h-4" />
                                        Remove from Group
                                      </button>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              </>
            )}

            {/* Actions Section */}
            <div className="divider"></div>
            <div className="space-y-2">
              {isGroupChat && (
                <button
                  className="btn w-full justify-start text-error"
                  onClick={handleLeaveGroup}
                  disabled={isManagingParticipants}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave Group
                </button>
              )}

              {(isCurrentUserAdmin || !isGroupChat) && (
                <button
                  className="btn btn-error w-full justify-start"
                  onClick={handleDeleteChat}
                  disabled={isManagingParticipants}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isGroupChat ? 'Delete Group' : 'Delete Chat'}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="modal-backdrop" onClick={onClose}></div>
      </div>

      {/* Add Participant Modal */}
      <AddParticipantModal
        isOpen={showAddParticipantModal}
        onClose={() => setShowAddParticipantModal(false)}
        chat={chat}
      />

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {showConfirmDialog.type === 'remove' && 'Remove Participant'}
              {showConfirmDialog.type === 'promote' && 'Promote to Admin'}
              {showConfirmDialog.type === 'demote' && 'Demote to Member'}
              {showConfirmDialog.type === 'leave' && 'Leave Group'}
              {showConfirmDialog.type === 'delete' && `Delete ${isGroupChat ? 'Group' : 'Chat'}`}
            </h3>

            <p className="py-4">
              {showConfirmDialog.type === 'remove' &&
                `Are you sure you want to remove ${showConfirmDialog.targetUserName} from this group?`}
              {showConfirmDialog.type === 'promote' &&
                `Are you sure you want to promote ${showConfirmDialog.targetUserName} to admin?`}
              {showConfirmDialog.type === 'demote' &&
                `Are you sure you want to demote ${showConfirmDialog.targetUserName} to member?`}
              {showConfirmDialog.type === 'leave' && 'Are you sure you want to leave this group?'}
              {showConfirmDialog.type === 'delete' &&
                `Are you sure you want to delete this ${
                  isGroupChat ? 'group' : 'chat'
                }? This action cannot be undone.`}
            </p>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowConfirmDialog(null)}
                disabled={isManagingParticipants}
              >
                Cancel
              </button>
              <button
                className={`btn ${
                  showConfirmDialog.type === 'delete' ||
                  showConfirmDialog.type === 'remove' ||
                  showConfirmDialog.type === 'leave'
                    ? 'btn-error'
                    : showConfirmDialog.type === 'demote'
                    ? 'btn-warning'
                    : 'btn-success'
                }`}
                onClick={() => {
                  if (showConfirmDialog.type === 'remove' && showConfirmDialog.targetUserId) {
                    handleRemoveParticipant(showConfirmDialog.targetUserId)
                  } else if (
                    showConfirmDialog.type === 'promote' &&
                    showConfirmDialog.targetUserId
                  ) {
                    handlePromoteParticipant(showConfirmDialog.targetUserId)
                  } else if (
                    showConfirmDialog.type === 'demote' &&
                    showConfirmDialog.targetUserId
                  ) {
                    handleDemoteAdmin(showConfirmDialog.targetUserId)
                  } else if (showConfirmDialog.type === 'leave') {
                    handleLeaveGroup()
                  } else if (showConfirmDialog.type === 'delete') {
                    handleDeleteChat()
                  }
                }}
                disabled={isManagingParticipants}
              >
                {isManagingParticipants ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    {showConfirmDialog.type === 'remove' && 'Remove'}
                    {showConfirmDialog.type === 'promote' && 'Promote'}
                    {showConfirmDialog.type === 'demote' && 'Demote'}
                    {showConfirmDialog.type === 'leave' && 'Leave'}
                    {showConfirmDialog.type === 'delete' && 'Delete'}
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowConfirmDialog(null)}></div>
        </div>
      )}

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
              alt="Chat Avatar Preview"
              className="w-full h-auto rounded"
            />
          </div>
        </div>
      )}
    </>
  )
}
