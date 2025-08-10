import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useRelationshipStore } from '@/store/useRelationshipStore'
import { useAuthStore } from '@/store/useAuthStore'
import { RelationshipStatus } from '@/types/enum/RelationshipStatus'
import Loading from '@/components/ui/loading'

import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Shield,
  ShieldOff,
  LoaderIcon,
  X,
} from 'lucide-react'
import { DEFAULT_PROFILE_IMAGE } from '@/constant/image'

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { authUser } = useAuthStore()
  const {
    userProfile,
    userProfileLoading,
    fetchUserProfile,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
    cleanup,
  } = useRelationshipStore()

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchUserProfile(userId)
    }
    return () => cleanup()
  }, [userId, fetchUserProfile, cleanup])

  // Redirect if trying to view own profile
  useEffect(() => {
    if (authUser && userId === authUser.id) {
      navigate('/profile', { replace: true })
    }
  }, [authUser, userId, navigate])

  const handleAction = async (action: string, actionFn: () => Promise<void>) => {
    if (!userId) return

    setActionLoading(action)
    try {
      await actionFn()
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const renderActionButtons = () => {
    if (!userProfile || !userId) return null

    const { status } = userProfile
    const isActionLoading = actionLoading !== null

    switch (status) {
      case RelationshipStatus.NONE:
        return (
          <div className="flex gap-3">
            <button
              onClick={() => handleAction('send', () => sendFriendRequest(userId))}
              disabled={isActionLoading}
              className="btn btn-primary flex-1 gap-2"
            >
              {actionLoading === 'send' ? (
                <LoaderIcon className="animate-spin w-5 h-5" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              Add Friend
            </button>
            <button
              onClick={() => handleAction('block', () => blockUser(userId))}
              disabled={isActionLoading}
              className="btn btn-outline btn-error gap-2"
            >
              {actionLoading === 'block' ? (
                <LoaderIcon className="animate-spin w-5 h-5" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
              Block
            </button>
          </div>
        )

      case RelationshipStatus.FRIEND_REQUEST_SENT:
        return (
          <div className="flex gap-3">
            <button
              onClick={() => handleAction('cancel', () => cancelFriendRequest(userId))}
              disabled={isActionLoading}
              className="btn btn-outline flex-1 gap-2"
            >
              {actionLoading === 'cancel' ? (
                <LoaderIcon className="animate-spin w-5 h-5" />
              ) : (
                <UserX className="w-5 h-5" />
              )}
              Cancel Request
            </button>
            <button
              onClick={() => handleAction('block', () => blockUser(userId))}
              disabled={isActionLoading}
              className="btn btn-outline btn-error gap-2"
            >
              {actionLoading === 'block' ? (
                <LoaderIcon className="animate-spin w-5 h-5" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
              Block
            </button>
          </div>
        )

      case RelationshipStatus.FRIEND_REQUEST_RECEIVED:
        return (
          <div className="flex gap-3">
            <button
              onClick={() => handleAction('accept', () => acceptFriendRequest(userId))}
              disabled={isActionLoading}
              className="btn btn-primary flex-1 gap-2"
            >
              {actionLoading === 'accept' ? (
                <LoaderIcon className="animate-spin w-5 h-5" />
              ) : (
                <UserCheck className="w-5 h-5" />
              )}
              Accept
            </button>
            <button
              onClick={() => handleAction('reject', () => rejectFriendRequest(userId))}
              disabled={isActionLoading}
              className="btn btn-outline gap-2"
            >
              {actionLoading === 'reject' ? (
                <LoaderIcon className="animate-spin w-5 h-5" />
              ) : (
                <UserX className="w-5 h-5" />
              )}
              Decline
            </button>
          </div>
        )

      case RelationshipStatus.FRIEND:
        return (
          <div className="flex gap-3">
            <button
              onClick={() => handleAction('remove', () => removeFriend(userId))}
              disabled={isActionLoading}
              className="btn btn-outline btn-error flex-1 gap-2"
            >
              {actionLoading === 'remove' ? (
                <LoaderIcon className="animate-spin w-5 h-5" />
              ) : (
                <UserMinus className="w-5 h-5" />
              )}
              Remove Friend
            </button>
            <button
              onClick={() => handleAction('block', () => blockUser(userId))}
              disabled={isActionLoading}
              className="btn btn-outline btn-error gap-2"
            >
              {actionLoading === 'block' ? (
                <LoaderIcon className="animate-spin w-5 h-5" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
              Block
            </button>
          </div>
        )

      case RelationshipStatus.BLOCKED:
        return (
          <button
            onClick={() => handleAction('unblock', () => unblockUser(userId))}
            disabled={isActionLoading}
            className="btn btn-outline w-full gap-2"
          >
            {actionLoading === 'unblock' ? (
              <LoaderIcon className="animate-spin w-5 h-5" />
            ) : (
              <ShieldOff className="w-5 h-5" />
            )}
            Unblock User
          </button>
        )

      default:
        return null
    }
  }

  const getStatusBadge = () => {
    if (!userProfile) return null

    const { status } = userProfile

    switch (status) {
      case RelationshipStatus.FRIEND:
        return (
          <div className="badge badge-success gap-1">
            <UserCheck className="w-3 h-3" />
            Friends
          </div>
        )
      case RelationshipStatus.FRIEND_REQUEST_SENT:
        return (
          <div className="badge badge-warning gap-1">
            <UserPlus className="w-3 h-3" />
            Request Sent
          </div>
        )
      case RelationshipStatus.FRIEND_REQUEST_RECEIVED:
        return (
          <div className="badge badge-info gap-1">
            <UserCheck className="w-3 h-3" />
            Wants to be friends
          </div>
        )
      case RelationshipStatus.BLOCKED:
        return (
          <div className="badge badge-error gap-1">
            <Shield className="w-3 h-3" />
            Blocked
          </div>
        )
      default:
        return null
    }
  }

  if (userProfileLoading) {
    return <Loading />
  }

  if (!userProfile) {
    return (
      <div className="bg-base-100 flex items-center justify-center px-4 py-10 h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p className="text-base-content/70 mb-6">
            {'The user you are looking for does not exist or has been removed.'}
          </p>
          <button onClick={() => navigate(-1)} className="btn btn-primary gap-2">
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-base-100 flex items-center justify-center px-4 py-10 min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-2xl bg-base-200 shadow-xl rounded-2xl p-6 sm:p-10">
        {/* Profile Image & Back Button in same row */}
        <div className="relative flex items-center justify-center">
          {/* Back Button - aligned left */}
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 top-0 btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Profile Image */}
          <div
            onClick={() => setIsImagePreviewOpen(true)}
            className={
              'w-32 h-32 rounded-full overflow-hidden bg-base-300 shadow-md cursor-pointer hover:opacity-80 transition'
            }
          >
            <img
              src={userProfile.profileImageUrl || DEFAULT_PROFILE_IMAGE}
              alt={`${userProfile.fullName}'s profile`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mt-4">{getStatusBadge()}</div>

        {/* Image Preview Modal */}
        {isImagePreviewOpen && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setIsImagePreviewOpen(false)}
          >
            <div
              className="relative bg-base-100 rounded-lg shadow-xl max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsImagePreviewOpen(false)}
                className="absolute top-2 right-2 bg-base-200 hover:bg-error text-base-content hover:text-white p-1.5 rounded-full shadow transition"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={userProfile.profileImageUrl || DEFAULT_PROFILE_IMAGE}
                alt={`${userProfile.fullName}'s profile`}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        )}

        {/* User Info */}
        <div className="space-y-6 mt-8">
          {/* Full Name */}
          <div className="form-control">
            <label className="label font-medium">
              <span className="label-text">Full Name</span>
            </label>
            <div className="input input-bordered w-full bg-base-300">{userProfile.fullName}</div>
          </div>

          {/* Bio */}
          <div className="form-control">
            <label className="label font-medium">
              <span className="label-text">Bio</span>
            </label>
            <div className="textarea textarea-bordered w-full h-28 bg-base-300 resize-none">
              {userProfile.bio || 'No bio available'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4">{renderActionButtons()}</div>
      </div>
    </div>
  )
}

export default UserProfilePage
