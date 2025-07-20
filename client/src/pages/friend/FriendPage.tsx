import { useEffect, useState } from 'react'
import { Users, UserPlus, UserCheck, Shield, Search } from 'lucide-react'
import UserList from '@/components/friend/user-list'
import SearchSection from '@/components/friend/search-section'
import { useRelationshipStore } from '@/store/useRelationshipStore'

type TabType = 'friends' | 'incoming' | 'sent' | 'blocked' | 'search'

const FriendsPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('friends')

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
          <UserList
            users={friends}
            loading={friendsLoading}
            hasMore={friendsHasMore}
            onLoadMore={() => getFriends(false)}
            emptyMessage="No friends yet"
            emptyIcon={<Users className="w-16 h-16 text-base-content/30" />}
          />
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
