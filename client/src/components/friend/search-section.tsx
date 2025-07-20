import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import UserList from './user-list'
import { useRelationshipStore } from '@/store/useRelationshipStore'

const SearchSection = () => {
  const [query, setQuery] = useState('')
  const { searchResults, searchCount, searchLoading, searchHasMore, searchQuery, searchUsers } =
    useRelationshipStore()

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim() !== searchQuery) {
        searchUsers(query.trim(), true)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [query, searchQuery, searchUsers])

  const handleClearSearch = () => {
    setQuery('')
    searchUsers('', true)
  }

  const handleLoadMore = () => {
    if (query.trim()) {
      searchUsers(query.trim(), false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative border-1 rounded-lg">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/50" />
        <input
          type="text"
          placeholder="Search users by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-12 py-3 bg-base-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {query && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-base-300 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search results */}
      {query.trim() && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Search Results {searchCount > 0 && `(${searchCount})`}
          </h3>
          <UserList
            users={searchResults}
            loading={searchLoading}
            hasMore={searchHasMore}
            onLoadMore={handleLoadMore}
            emptyMessage="No users found"
            emptyIcon={<Search className="w-16 h-16 text-base-content/30" />}
          />
        </div>
      )}

      {/* Search prompt */}
      {!query.trim() && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="w-16 h-16 text-base-content/30 mb-4" />
          <h3 className="text-lg font-medium text-base-content/70 mb-2">Search for Users</h3>
          <p className="text-base-content/50">Enter a name to find and connect with other users</p>
        </div>
      )}
    </div>
  )
}

export default SearchSection
