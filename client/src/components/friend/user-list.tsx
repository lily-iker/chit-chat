import { useEffect, useRef } from 'react'
import { Users } from 'lucide-react'
import UserCard from './user-card'
import UserCardSkeleton from './skeleton/user-card-skeleton'
import type { UserSearchResponse } from '@/types/response/UserSearchResponse'

interface UserListProps {
  users: UserSearchResponse[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  emptyMessage: string
  emptyIcon?: React.ReactNode
}

const UserList = ({
  users,
  loading,
  hasMore,
  onLoadMore,
  emptyMessage,
  emptyIcon = <Users className="w-16 h-16 text-base-content/30" />,
}: UserListProps) => {
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, onLoadMore])

  if (!loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {emptyIcon}
        <h3 className="text-lg font-medium text-base-content/70 mt-4 mb-2">{emptyMessage}</h3>
      </div>
    )
  }

  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}

      {/* Loading indicator */}
      {loading && <UserCardSkeleton />}

      {/* Intersection observer target */}
      <div ref={observerRef} className="h-4" />

      {/* End of list indicator */}
      {!hasMore && users.length > 20 && (
        <div className="col-span-full text-center py-4">
          <span className="text-sm text-base-content/60">You've reached the end</span>
        </div>
      )}
    </div>
  )
}

export default UserList
