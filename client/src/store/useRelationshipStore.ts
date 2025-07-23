import { create } from 'zustand'
import axios from '@/lib/axios-custom'
import toast from 'react-hot-toast'
import { RelationshipStatus } from '@/types/enum/RelationshipStatus'
import type { UserSearchResponse } from '@/types/response/UserSearchResponse'
import type { PageResponse } from '@/types/response/PageResponse'
import type { UserProfileResponse } from '@/types/response/UserProfileResponse'

interface RelationshipCounts {
  friendsCount: number
  incomingRequestsCount: number
  sentRequestsCount: number
  blockedUsersCount: number
}

interface RelationshipState {
  // Counts
  counts: RelationshipCounts
  countsLoading: boolean

  // Friends
  friends: UserSearchResponse[]
  friendsLoading: boolean
  friendsHasMore: boolean
  friendsPage: number

  // Incoming requests
  incomingRequests: UserSearchResponse[]
  incomingLoading: boolean
  incomingHasMore: boolean
  incomingPage: number

  // Sent requests
  sentRequests: UserSearchResponse[]
  sentLoading: boolean
  sentHasMore: boolean
  sentPage: number

  // Blocked users
  blockedUsers: UserSearchResponse[]
  blockedLoading: boolean
  blockedHasMore: boolean
  blockedPage: number

  // Search
  searchResults: UserSearchResponse[]
  searchCount: number
  searchLoading: boolean
  searchHasMore: boolean
  searchPage: number
  searchQuery: string

  friendSearchResults: UserProfileResponse[]
  friendCount: number
  friendSearchLoading: boolean
  friendSearchHasMore: boolean
  friendSearchPage: number
  friendSearchQuery: string

  // Actions
  getRelationshipCounts: () => Promise<void>
  getFriends: (reset?: boolean) => Promise<void>
  getIncomingRequests: (reset?: boolean) => Promise<void>
  getSentRequests: (reset?: boolean) => Promise<void>
  getBlockedUsers: (reset?: boolean) => Promise<void>
  searchUsers: (query: string, reset?: boolean) => Promise<void>
  searchFriends: (query: string, reset?: boolean) => Promise<void>

  // Friend actions
  sendFriendRequest: (userId: string) => Promise<void>
  cancelFriendRequest: (userId: string) => Promise<void>
  acceptFriendRequest: (userId: string) => Promise<void>
  rejectFriendRequest: (userId: string) => Promise<void>
  removeFriend: (userId: string) => Promise<void>
  blockUser: (userId: string) => Promise<void>
  unblockUser: (userId: string) => Promise<void>

  // Utility
  updateUserStatus: (userId: string, newStatus: RelationshipStatus) => void
  removeUserFromLists: (userId: string) => void
  updateCounts: (
    action:
      | 'sendRequest'
      | 'cancelRequest'
      | 'acceptRequest'
      | 'rejectRequest'
      | 'removeFriend'
      | 'blockUser'
      | 'unblockUser',
    userId: string
  ) => void
  cleanup: () => void
}

export const useRelationshipStore = create<RelationshipState>((set, get) => ({
  // Initial state
  counts: {
    friendsCount: 0,
    incomingRequestsCount: 0,
    sentRequestsCount: 0,
    blockedUsersCount: 0,
  },
  countsLoading: false,

  friends: [],
  friendsLoading: false,
  friendsHasMore: true,
  friendsPage: 1,

  incomingRequests: [],
  incomingLoading: false,
  incomingHasMore: true,
  incomingPage: 1,

  sentRequests: [],
  sentLoading: false,
  sentHasMore: true,
  sentPage: 1,

  blockedUsers: [],
  blockedLoading: false,
  blockedHasMore: true,
  blockedPage: 1,

  searchResults: [],
  searchCount: 0,
  searchLoading: false,
  searchHasMore: true,
  searchPage: 1,
  searchQuery: '',

  friendSearchResults: [],
  friendCount: 0,
  friendSearchLoading: false,
  friendSearchHasMore: true,
  friendSearchPage: 1,
  friendSearchQuery: '',

  // Get friend counts
  getRelationshipCounts: async () => {
    set({ countsLoading: true })
    try {
      const response = await axios.get('/api/v1/user-nodes/counts')
      const counts: RelationshipCounts = response.data.result
      set({ counts, countsLoading: false })
    } catch (error) {
      console.error('Failed to fetch friend counts:', error)
      set({ countsLoading: false })
    }
  },

  // Get friends
  getFriends: async (reset = false) => {
    const { friendsLoading, friendsHasMore, friendsPage } = get()

    if (friendsLoading || (!reset && !friendsHasMore)) return

    set({ friendsLoading: true })

    try {
      const page = reset ? 1 : friendsPage
      const response = await axios.get(`/api/v1/user-nodes/friends?pageNumber=${page}&pageSize=20`)
      const data: PageResponse<UserSearchResponse> = response.data.result

      set((state) => ({
        friends: reset ? data.content : [...state.friends, ...data.content],
        friendsPage: page + 1,
        friendsHasMore: page < data.totalPages,
        friendsLoading: false,
      }))
    } catch (error) {
      console.error('Failed to fetch friends:', error)
      toast.error('Failed to load friends')
      set({ friendsLoading: false })
    }
  },

  // Get incoming requests
  getIncomingRequests: async (reset = false) => {
    const { incomingLoading, incomingHasMore, incomingPage } = get()

    if (incomingLoading || (!reset && !incomingHasMore)) return

    set({ incomingLoading: true })

    try {
      const page = reset ? 1 : incomingPage
      const response = await axios.get(
        `/api/v1/user-nodes/friend-requests/incoming?pageNumber=${page}&pageSize=20`
      )
      const data: PageResponse<UserSearchResponse> = response.data.result

      set((state) => ({
        incomingRequests: reset ? data.content : [...state.incomingRequests, ...data.content],
        incomingPage: page + 1,
        incomingHasMore: page < data.totalPages,
        incomingLoading: false,
      }))
    } catch (error) {
      console.error('Failed to fetch incoming requests:', error)
      toast.error('Failed to load incoming requests')
      set({ incomingLoading: false })
    }
  },

  // Get sent requests
  getSentRequests: async (reset = false) => {
    const { sentLoading, sentHasMore, sentPage } = get()

    if (sentLoading || (!reset && !sentHasMore)) return

    set({ sentLoading: true })

    try {
      const page = reset ? 1 : sentPage
      const response = await axios.get(
        `/api/v1/user-nodes/friend-requests/sent?pageNumber=${page}&pageSize=20`
      )
      const data: PageResponse<UserSearchResponse> = response.data.result

      set((state) => ({
        sentRequests: reset ? data.content : [...state.sentRequests, ...data.content],
        sentPage: page + 1,
        sentHasMore: page < data.totalPages,
        sentLoading: false,
      }))
    } catch (error) {
      console.error('Failed to fetch sent requests:', error)
      toast.error('Failed to load sent requests')
      set({ sentLoading: false })
    }
  },

  // Get blocked users
  getBlockedUsers: async (reset = false) => {
    const { blockedLoading, blockedHasMore, blockedPage } = get()

    if (blockedLoading || (!reset && !blockedHasMore)) return

    set({ blockedLoading: true })

    try {
      const page = reset ? 1 : blockedPage
      const response = await axios.get(`/api/v1/user-nodes/blocked?pageNumber=${page}&pageSize=20`)
      const data: PageResponse<UserSearchResponse> = response.data.result

      set((state) => ({
        blockedUsers: reset ? data.content : [...state.blockedUsers, ...data.content],
        blockedPage: page + 1,
        blockedHasMore: page < data.totalPages,
        blockedLoading: false,
      }))
    } catch (error) {
      console.error('Failed to fetch blocked users:', error)
      toast.error('Failed to load blocked users')
      set({ blockedLoading: false })
    }
  },

  // Search users
  searchUsers: async (query: string, reset = false) => {
    if (!query.trim()) {
      set({
        searchResults: [],
        searchCount: 0,
        searchQuery: '',
        searchPage: 1,
        searchHasMore: true,
      })
      return
    }

    const { searchLoading, searchHasMore, searchPage } = get()

    if (searchLoading || (!reset && !searchHasMore)) return

    set({ searchLoading: true })

    try {
      const page = reset ? 1 : searchPage
      const response = await axios.get(
        `/api/v1/user-nodes/search?query=${encodeURIComponent(
          query
        )}&pageNumber=${page}&pageSize=20`
      )
      const data: PageResponse<UserSearchResponse> = response.data.result

      set((state) => ({
        searchResults: reset ? data.content : [...state.searchResults, ...data.content],
        searchCount: data.totalElements,
        searchQuery: query,
        searchPage: page + 1,
        searchHasMore: page < data.totalPages,
        searchLoading: false,
      }))
    } catch (error) {
      console.error('Failed to search users:', error)
      toast.error('Failed to search users')
      set({ searchLoading: false })
    }
  },

  // Search friends
  searchFriends: async (query: string, reset = false) => {
    if (!query.trim()) {
      set({
        friendSearchResults: [],
        friendCount: 0,
        friendSearchQuery: '',
        friendSearchPage: 1,
        friendSearchHasMore: true,
      })
      return
    }

    const { friendSearchLoading, friendSearchHasMore, friendSearchPage } = get()
    if (friendSearchLoading || (!reset && !friendSearchHasMore)) return

    set({ friendSearchLoading: true })

    try {
      const page = reset ? 1 : friendSearchPage
      const response = await axios.get(
        `/api/v1/user-nodes/search-friends?query=${encodeURIComponent(query)}&pageNumber=${page}`
      )
      const data: PageResponse<UserSearchResponse> = response.data.result

      set((state) => ({
        friendSearchResults: reset ? data.content : [...state.friendSearchResults, ...data.content],
        friendCount: data.totalElements,
        friendSearchQuery: query,
        friendSearchPage: page + 1,
        friendSearchHasMore: page < data.totalPages,
        friendSearchLoading: false,
      }))
    } catch (error) {
      console.error('Failed to search friends:', error)
      toast.error('Failed to search friends')
      set({ friendSearchLoading: false })
    }
  },

  // Friend actions
  sendFriendRequest: async (userId: string) => {
    try {
      await axios.post(`/api/v1/user-nodes/friend-request/send/${userId}`)
      get().updateUserStatus(userId, RelationshipStatus.FRIEND_REQUEST_SENT)
      get().updateCounts('sendRequest', userId)
      toast.success('Friend request sent')
    } catch (error) {
      console.error('Failed to send friend request:', error)
      toast.error('Failed to send friend request')
    }
  },

  cancelFriendRequest: async (userId: string) => {
    try {
      await axios.post(`/api/v1/user-nodes/friend-request/cancel/${userId}`)
      get().updateUserStatus(userId, RelationshipStatus.NONE)
      get().removeUserFromLists(userId)
      get().updateCounts('cancelRequest', userId)
      toast.success('Friend request cancelled')
    } catch (error) {
      console.error('Failed to cancel friend request:', error)
      toast.error('Failed to cancel friend request')
    }
  },

  acceptFriendRequest: async (userId: string) => {
    try {
      await axios.post(`/api/v1/user-nodes/friend-request/accept/${userId}`)
      get().updateUserStatus(userId, RelationshipStatus.FRIEND)
      get().removeUserFromLists(userId)
      get().updateCounts('acceptRequest', userId)
      toast.success('Friend request accepted')
    } catch (error) {
      console.error('Failed to accept friend request:', error)
      toast.error('Failed to accept friend request')
    }
  },

  rejectFriendRequest: async (userId: string) => {
    try {
      await axios.post(`/api/v1/user-nodes/friend-request/reject/${userId}`)
      get().updateUserStatus(userId, RelationshipStatus.NONE)
      get().removeUserFromLists(userId)
      get().updateCounts('rejectRequest', userId)
      toast.success('Friend request rejected')
    } catch (error) {
      console.error('Failed to reject friend request:', error)
      toast.error('Failed to reject friend request')
    }
  },

  removeFriend: async (userId: string) => {
    try {
      await axios.delete(`/api/v1/user-nodes/friends/${userId}`)
      get().updateUserStatus(userId, RelationshipStatus.NONE)
      get().removeUserFromLists(userId)
      get().updateCounts('removeFriend', userId)
      toast.success('Friend removed')
    } catch (error) {
      console.error('Failed to remove friend:', error)
      toast.error('Failed to remove friend')
    }
  },

  blockUser: async (userId: string) => {
    try {
      await axios.post(`/api/v1/user-nodes/block/${userId}`)
      get().updateUserStatus(userId, RelationshipStatus.BLOCKED)
      get().removeUserFromLists(userId)
      get().updateCounts('blockUser', userId)
      toast.success('User blocked')
    } catch (error) {
      console.error('Failed to block user:', error)
      toast.error('Failed to block user')
    }
  },

  unblockUser: async (userId: string) => {
    try {
      await axios.post(`/api/v1/user-nodes/unblock/${userId}`)
      get().updateUserStatus(userId, RelationshipStatus.NONE)
      get().removeUserFromLists(userId)
      get().updateCounts('unblockUser', userId)
      toast.success('User unblocked')
    } catch (error) {
      console.error('Failed to unblock user:', error)
      toast.error('Failed to unblock user')
    }
  },

  // Utility functions
  updateUserStatus: (userId: string, newStatus: RelationshipStatus) => {
    set((state) => ({
      searchResults: state.searchResults.map((user) =>
        user.id === userId ? { ...user, relationshipStatus: newStatus } : user
      ),
    }))
  },

  removeUserFromLists: (userId: string) => {
    set((state) => ({
      friends: state.friends.filter((user) => user.id !== userId),
      incomingRequests: state.incomingRequests.filter((user) => user.id !== userId),
      sentRequests: state.sentRequests.filter((user) => user.id !== userId),
      blockedUsers: state.blockedUsers.filter((user) => user.id !== userId),
    }))
  },

  updateCounts: (
    action:
      | 'sendRequest'
      | 'cancelRequest'
      | 'acceptRequest'
      | 'rejectRequest'
      | 'removeFriend'
      | 'blockUser'
      | 'unblockUser',
    userId: string
  ) => {
    set((state) => {
      const newCounts = { ...state.counts }

      switch (action) {
        case 'sendRequest':
          newCounts.sentRequestsCount += 1
          break
        case 'cancelRequest':
          newCounts.sentRequestsCount = Math.max(0, newCounts.sentRequestsCount - 1)
          break
        case 'acceptRequest':
          newCounts.incomingRequestsCount = Math.max(0, newCounts.incomingRequestsCount - 1)
          newCounts.friendsCount += 1
          break
        case 'rejectRequest':
          newCounts.incomingRequestsCount = Math.max(0, newCounts.incomingRequestsCount - 1)
          break
        case 'removeFriend':
          newCounts.friendsCount = Math.max(0, newCounts.friendsCount - 1)
          break
        case 'blockUser':
          newCounts.blockedUsersCount += 1
          // If blocking a friend, decrease friends count
          if (state.friends.some((f) => f.id === userId)) {
            newCounts.friendsCount = Math.max(0, newCounts.friendsCount - 1)
          }
          // If blocking someone who sent a request, decrease incoming count
          if (state.incomingRequests.some((r) => r.id === userId)) {
            newCounts.incomingRequestsCount = Math.max(0, newCounts.incomingRequestsCount - 1)
          }
          break
        case 'unblockUser':
          newCounts.blockedUsersCount = Math.max(0, newCounts.blockedUsersCount - 1)
          break
      }

      return { counts: newCounts }
    })
  },

  cleanup: () => {
    set({
      counts: {
        friendsCount: 0,
        incomingRequestsCount: 0,
        sentRequestsCount: 0,
        blockedUsersCount: 0,
      },
      countsLoading: false,
      friends: [],
      friendsLoading: false,
      friendsHasMore: true,
      friendsPage: 1,
      incomingRequests: [],
      incomingLoading: false,
      incomingHasMore: true,
      incomingPage: 1,
      sentRequests: [],
      sentLoading: false,
      sentHasMore: true,
      sentPage: 1,
      blockedUsers: [],
      blockedLoading: false,
      blockedHasMore: true,
      blockedPage: 1,
      searchResults: [],
      searchCount: 0,
      searchLoading: false,
      searchHasMore: true,
      searchPage: 1,
      searchQuery: '',
    })
  },
}))
