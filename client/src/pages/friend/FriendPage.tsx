import { useEffect, useState } from 'react'
import { Users, UserPlus, UserCheck, Shield, Search, X } from 'lucide-react'
import UserList from '@/components/friend/user-list'
import SearchSection from '@/components/friend/search-section'
import { useRelationshipStore } from '@/store/useRelationshipStore'
import { RelationshipStatus } from '@/types/enum/RelationshipStatus'

type TabType = 'friends' | 'incoming' | 'sent' | 'blocked' | 'search'

const FriendsPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('friends')
  const [localFriendSearchQuery, setLocalFriendSearchQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const {
    counts,
    countsLoading,
    getRelationshipCounts,
    friends,
    friendsLoading,
    friendsHasMore,
    getFriends,
    incomingRequests,
    incomingLoading,
    incomingHasMore,
    getIncomingRequests,
    sentRequests,
    sentLoading,
    sentHasMore,
    getSentRequests,
    blockedUsers,
    blockedLoading,
    blockedHasMore,
    getBlockedUsers,
    friendSearchResults,
    friendCount,
    friendSearchLoading,
    friendSearchHasMore,
    friendSearchQuery,
    searchFriends,
  } = useRelationshipStore()

  // Load counts on component mount
  useEffect(() => {
    getRelationshipCounts()
  }, [getRelationshipCounts])

  // Load initial data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case 'friends':
        getFriends(true)
        break
      case 'incoming':
        getIncomingRequests(true)
        break
      case 'sent':
        getSentRequests(true)
        break
      case 'blocked':
        getBlockedUsers(true)
        break
    }
  }, [activeTab])

  // Clear results immediately when query changes (before debounce)
  useEffect(() => {
    if (
      localFriendSearchQuery.trim() !== friendSearchQuery &&
      friendSearchQuery !== '' &&
      activeTab === 'friends'
    ) {
      searchFriends('', true)
      setIsTyping(true)
    } else if (localFriendSearchQuery.trim() && activeTab === 'friends') {
      setIsTyping(true)
    }
  }, [localFriendSearchQuery, activeTab])

  // Debounced search
  useEffect(() => {
    if (localFriendSearchQuery.trim() && activeTab === 'friends') {
      setIsTyping(true)
    }

    const timer = setTimeout(async () => {
      if (localFriendSearchQuery.trim() !== friendSearchQuery && activeTab === 'friends') {
        // Only set isTyping to false when we actually start the search
        if (localFriendSearchQuery.trim()) {
          // Keep isTyping true until search starts
          await searchFriends(localFriendSearchQuery.trim(), true)
        }
      }
      // Set isTyping to false after search is triggered or if query is empty
      setIsTyping(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [localFriendSearchQuery, activeTab, friendSearchQuery, searchFriends])

  // Reset isTyping when friendSearchLoading becomes true
  useEffect(() => {
    if (friendSearchLoading) {
      setIsTyping(false)
    }
  }, [friendSearchLoading])

  const handleClearFriendSearch = () => {
    setLocalFriendSearchQuery('')
    setIsTyping(false)
    searchFriends('', true)
  }

  const handleLoadMoreFriendSearch = () => {
    if (localFriendSearchQuery.trim()) {
      searchFriends(localFriendSearchQuery.trim(), false)
    }
  }

  // Show loading when either typing or search is in progress
  const isFriendSearchLoading = isTyping || friendSearchLoading

  const mappedSearchResults = friendSearchResults.map((user) => {
    const relationshipStatus: RelationshipStatus = RelationshipStatus.FRIEND
    return {
      ...user,
      relationshipStatus,
    }
  })

  const tabs = [
    {
      id: 'friends' as TabType,
      label: 'Friends',
      icon: <Users className="w-4 h-4" />,
      count: counts.friendsCount,
    },
    {
      id: 'incoming' as TabType,
      label: 'Requests',
      icon: <UserPlus className="w-4 h-4" />,
      count: counts.incomingRequestsCount,
    },
    {
      id: 'sent' as TabType,
      label: 'Sent',
      icon: <UserCheck className="w-4 h-4" />,
      count: counts.sentRequestsCount,
    },
    {
      id: 'blocked' as TabType,
      label: 'Blocked',
      icon: <Shield className="w-4 h-4" />,
      count: counts.blockedUsersCount,
    },
    {
      id: 'search' as TabType,
      label: 'Search',
      icon: <Search className="w-4 h-4" />,
      count: null,
    },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':
        return (
          <div className="space-y-4">
            {/* Friend Search */}
            <div className="relative border-1 rounded-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/50" />
              <input
                type="text"
                placeholder="Search your friends..."
                value={localFriendSearchQuery}
                onChange={(e) => setLocalFriendSearchQuery(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-base-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {localFriendSearchQuery && (
                <button
                  onClick={handleClearFriendSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-base-300 rounded-full transition-colors"
                >
                  {isFriendSearchLoading && localFriendSearchQuery.trim() ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            {/* Friend Search Results or Regular Friends List */}
            {localFriendSearchQuery.trim() ? (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Search Results {friendCount > 0 && `(${friendCount})`}
                </h3>
                <UserList
                  users={mappedSearchResults}
                  loading={isFriendSearchLoading}
                  hasMore={friendSearchHasMore}
                  onLoadMore={handleLoadMoreFriendSearch}
                  emptyMessage="No friends found"
                  emptyIcon={<Search className="w-16 h-16 text-base-content/30" />}
                />
              </div>
            ) : (
              <UserList
                users={friends}
                loading={friendsLoading}
                hasMore={friendsHasMore}
                onLoadMore={() => getFriends(false)}
                emptyMessage="No friends yet"
                emptyIcon={<Users className="w-16 h-16 text-base-content/30" />}
              />
            )}
          </div>
        )

      case 'incoming':
        return (
          <UserList
            users={incomingRequests}
            loading={incomingLoading}
            hasMore={incomingHasMore}
            onLoadMore={() => getIncomingRequests(false)}
            emptyMessage="No incoming friend requests"
            emptyIcon={<UserPlus className="w-16 h-16 text-base-content/30" />}
          />
        )

      case 'sent':
        return (
          <UserList
            users={sentRequests}
            loading={sentLoading}
            hasMore={sentHasMore}
            onLoadMore={() => getSentRequests(false)}
            emptyMessage="No sent friend requests"
            emptyIcon={<UserCheck className="w-16 h-16 text-base-content/30" />}
          />
        )

      case 'blocked':
        return (
          <UserList
            users={blockedUsers}
            loading={blockedLoading}
            hasMore={blockedHasMore}
            onLoadMore={() => getBlockedUsers(false)}
            emptyMessage="No blocked users"
            emptyIcon={<Shield className="w-16 h-16 text-base-content/30" />}
          />
        )

      case 'search':
        return <SearchSection />

      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col bg-base-200">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300 p-4">
        <div className="container mx-auto">
          {/* Tabs */}
          <div className="tabs tabs-boxed justify-center rounded-2xl bg-base-200 p-1 lg:max-w-2xl mx-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab gap-1 md:gap-2 ${activeTab === tab.id ? 'tab-active' : ''}`}
                disabled={countsLoading}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== null && (
                  <div className="badge badge-primary badge-sm">
                    {countsLoading ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      tab.count
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 max-w-4xl">{renderTabContent()}</div>
      </div>
    </div>
  )
}

export default FriendsPage
