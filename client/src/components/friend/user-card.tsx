import React from 'react'
import { UserPlus, UserX, Check, X, Shield, ShieldOff } from 'lucide-react'
import { RelationshipStatus } from '@/types/enum/RelationshipStatus'
import type { UserSearchResponse } from '@/types/response/UserSearchResponse'
import { useRelationshipStore } from '@/store/useRelationshipStore'
import { DEFAULT_PROFILE_IMAGE } from '@/constant/image'

interface UserCardProps {
  user: UserSearchResponse
  showActions?: boolean
}

const UserCard = React.memo(({ user, showActions = true }: UserCardProps) => {
  const {
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
  } = useRelationshipStore()

  const getActionButtons = () => {
    if (!showActions) return null

    switch (user.relationshipStatus) {
      case RelationshipStatus.NONE:
        return (
          <div className="flex gap-2">
            <button
              onClick={() => sendFriendRequest(user.id)}
              className="btn btn-sm btn-primary"
              title="Send friend request"
            >
              <UserPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => blockUser(user.id)}
              className="btn btn-sm btn-ghost text-error"
              title="Block user"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
        )

      case RelationshipStatus.FRIEND_REQUEST_SENT:
        return (
          <div className="flex gap-2">
            <button
              onClick={() => cancelFriendRequest(user.id)}
              className="btn btn-sm btn-ghost"
              title="Cancel friend request"
            >
              <UserX className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )

      case RelationshipStatus.FRIEND_REQUEST_RECEIVED:
        return (
          <div className="flex gap-2">
            <button
              onClick={() => acceptFriendRequest(user.id)}
              className="btn btn-sm btn-success"
              title="Accept friend request"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => rejectFriendRequest(user.id)}
              className="btn btn-sm btn-error"
              title="Reject friend request"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )

      case RelationshipStatus.FRIEND:
        return (
          <div className="flex gap-2">
            <button
              onClick={() => removeFriend(user.id)}
              className="btn btn-sm btn-ghost text-error"
              title="Remove friend"
            >
              <UserX className="w-4 h-4" />
            </button>
            <button
              onClick={() => blockUser(user.id)}
              className="btn btn-sm btn-ghost text-error"
              title="Block user"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
        )

      case RelationshipStatus.BLOCKED:
        return (
          <div className="flex gap-2">
            <button
              onClick={() => unblockUser(user.id)}
              className="btn btn-sm btn-ghost"
              title="Unblock user"
            >
              <ShieldOff className="w-4 h-4" />
              Unblock
            </button>
          </div>
        )

      default:
        return null
    }
  }

  const getStatusBadge = () => {
    switch (user.relationshipStatus) {
      case RelationshipStatus.FRIEND:
        return <div className="badge badge-success badge-sm">Friend</div>
      case RelationshipStatus.FRIEND_REQUEST_SENT:
        return <div className="badge badge-warning badge-sm">Request Sent</div>
      case RelationshipStatus.FRIEND_REQUEST_RECEIVED:
        return <div className="badge badge-info badge-sm">Request Received</div>
      case RelationshipStatus.BLOCKED:
        return <div className="badge badge-error badge-sm">Blocked</div>
      default:
        return null
    }
  }

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="w-12 h-12 rounded-full">
              <img
                src={user.profileImageUrl || DEFAULT_PROFILE_IMAGE}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{user.fullName}</h3>
            {getStatusBadge()}
          </div>

          {/* Actions */}
          {getActionButtons()}
        </div>
      </div>
    </div>
  )
})

export default UserCard
