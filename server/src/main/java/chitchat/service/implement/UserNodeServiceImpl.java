package chitchat.service.implement;

import chitchat.constant.CacheConstant;
import chitchat.dto.response.PageResponse;
import chitchat.dto.response.user.UserOverviewResponse;
import chitchat.dto.response.user.UserSearchResponse;
import chitchat.mapper.UserMapper;
import chitchat.model.User;
import chitchat.model.UserNode;
import chitchat.model.enumeration.RelationshipStatus;
import chitchat.repository.UserNodeRepository;
import chitchat.repository.UserRepository;
import chitchat.security.service.CurrentUserService;
import chitchat.service.interfaces.UserCacheService;
import chitchat.service.interfaces.UserNodeCacheService;
import chitchat.service.interfaces.UserNodeService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserNodeServiceImpl implements UserNodeService {

    private final UserNodeRepository userNodeRepository;
    private final UserRepository userRepository;
    private final UserCacheService userCacheService;
    private final UserNodeCacheService userNodeCacheService;
    private final CurrentUserService currentUserService;
    private final UserMapper userMapper;

    @PostConstruct
    public void createIndexes() {
        userNodeRepository.createFullTextIndex();
    }

    @Override
    public void sendFriendRequest(String targetUserId) {
        String currentUserId = currentUserService.getCurrentUser().getUser().getId();
        if (targetUserId.equals(currentUserId)) {
            throw new IllegalArgumentException("Cannot send friend request to yourself");
        }
        userNodeRepository.sendFriendRequest(currentUserId, targetUserId);
        onRelationshipChange(currentUserId, targetUserId);
    }

    /**
    Cancel a previously sent friend request from the current user to the target user
    **/
    @Override
    public void cancelFriendRequest(String targetUserId) {
        String currentUserId = currentUserService.getCurrentUser().getUser().getId();
        userNodeRepository.cancelFriendRequest(currentUserId, targetUserId);
        onRelationshipChange(currentUserId, targetUserId);
    }

    @Override
    public void acceptFriendRequest(String targetUserId) {
        String currentUserId = currentUserService.getCurrentUser().getUser().getId();
        userNodeRepository.acceptFriendRequest(currentUserId, targetUserId);
        onRelationshipChange(currentUserId, targetUserId);
    }

    /**
    Reject a friend request from the target user
    **/
    @Override
    public void rejectFriendRequest(String targetUserId) {
        String currentUserId = currentUserService.getCurrentUser().getUser().getId();
        userNodeRepository.rejectFriendRequest(currentUserId, targetUserId);
        onRelationshipChange(currentUserId, targetUserId);
    }

    @Override
    public void removeFriend(String targetUserId) {
        String currentUserId = currentUserService.getCurrentUser().getUser().getId();
        userNodeRepository.removeFriend(currentUserId, targetUserId);
        onRelationshipChange(currentUserId, targetUserId);
    }

    @Override
    public void blockUser(String targetUserId) {
        String currentUserId = currentUserService.getCurrentUser().getUser().getId();
        if (targetUserId.equals(currentUserId)) {
            throw new IllegalArgumentException("Cannot block yourself");
        }
        userNodeRepository.blockUser(currentUserId, targetUserId);
        onRelationshipChange(currentUserId, targetUserId);
    }

    @Override
    public void unblockUser(String targetUserId) {
        String currentUserId = currentUserService.getCurrentUser().getUser().getId();
        userNodeRepository.unblockUser(currentUserId, targetUserId);
        onRelationshipChange(currentUserId, targetUserId);
    }

    @Override
    public PageResponse<?> getAllUsers(int pageNumber, int pageSize) {
        int skip = toSkip(pageNumber, pageSize);
        List<UserNode> users = userNodeRepository.findAllUsersPaginated(skip, pageSize);
        long total = userNodeRepository.countAllUsers();
        int totalPages = (int) Math.ceil((double) total / pageSize);

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .content(users)
                .build();
    }

    @Override
    // Should use cursor-based pagination and SSCAN in Redis for better performance
    public PageResponse<?> getFriends(int pageNumber, int pageSize) {
        String userId = currentUserService.getCurrentUser().getUser().getId();

        String cacheKey = userNodeCacheService.generateRelationshipCacheKey(userId, CacheConstant.FRIENDS_CACHE_PREFIX);
        Set<String> allFriendIds = userNodeCacheService.getRelationshipIds(cacheKey);

        if (allFriendIds == null || allFriendIds.isEmpty()) {
            // Cache miss - load from DB
            allFriendIds = new HashSet<>(userNodeRepository.findFriendIds(userId));

            // Only cache if we have a reasonable number of friends
            if (!allFriendIds.isEmpty() && allFriendIds.size() <= CacheConstant.MAX_FRIENDS_TO_CACHE) {
                userNodeCacheService.cacheRelationshipIds(cacheKey, allFriendIds, CacheConstant.FRIENDS_CACHE_TTL);
            }
        }

        // Manual pagination (convert Set to List for ordering)
        List<String> orderedIds = new ArrayList<>(allFriendIds);
        int total = orderedIds.size();
        int totalPages = (int) Math.ceil((double) total / pageSize);

        int fromIndex = Math.min((pageNumber - 1) * pageSize, total);
        int toIndex = Math.min(fromIndex + pageSize, total);
        List<String> pageIds = orderedIds.subList(fromIndex, toIndex);

        // Batch load profiles
        List<UserSearchResponse> friends = getProfilesWithCache(pageIds, RelationshipStatus.FRIEND);

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .content(friends)
                .build();
    }

    @Override
    public PageResponse<?> getBlockedUsers(int pageNumber, int pageSize) {
        String userId = currentUserService.getCurrentUser().getUser().getId();

        String cacheKey = userNodeCacheService.generateRelationshipCacheKey(userId, CacheConstant.BLOCKED_CACHE_PREFIX);
        Set<String> allBlockedIds = userNodeCacheService.getRelationshipIds(cacheKey);

        if (allBlockedIds == null || allBlockedIds.isEmpty()) {
            allBlockedIds = new HashSet<>(userNodeRepository.findBlockedUserIds(userId));

            if (!allBlockedIds.isEmpty() && allBlockedIds.size() <= CacheConstant.MAX_BLOCKED_USERS_TO_CACHE) {
                userNodeCacheService.cacheRelationshipIds(cacheKey, allBlockedIds, CacheConstant.BLOCKED_CACHE_TTL);
            }
        }

        List<String> orderedIds = new ArrayList<>(allBlockedIds);
        int total = orderedIds.size();
        int totalPages = (int) Math.ceil((double) total / pageSize);

        int fromIndex = Math.min((pageNumber - 1) * pageSize, total);
        int toIndex = Math.min(fromIndex + pageSize, total);
        List<String> pageIds = orderedIds.subList(fromIndex, toIndex);

        List<UserSearchResponse> blockedUsers = getProfilesWithCache(pageIds, RelationshipStatus.BLOCKED);

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .content(blockedUsers)
                .build();
    }

    @Override
    public PageResponse<?> getIncomingFriendRequests(int pageNumber, int pageSize) {
        String userId = currentUserService.getCurrentUser().getUser().getId();

        String cacheKey = userNodeCacheService.generateRelationshipCacheKey(userId, CacheConstant.INCOMING_REQUESTS_CACHE_PREFIX);
        Set<String> allIncomingIds = userNodeCacheService.getRelationshipIds(cacheKey);

        if (allIncomingIds == null || allIncomingIds.isEmpty()) {
            allIncomingIds = new HashSet<>(userNodeRepository.getIncomingFriendRequestIds(userId));

            if (!allIncomingIds.isEmpty() && allIncomingIds.size() <= CacheConstant.MAX_INCOMING_REQUESTS_TO_CACHE) {
                userNodeCacheService.cacheRelationshipIds(cacheKey, allIncomingIds, CacheConstant.INCOMING_REQUESTS_CACHE_TTL);
            }
        }

        List<String> orderedIds = new ArrayList<>(allIncomingIds);
        int total = orderedIds.size();
        int totalPages = (int) Math.ceil((double) total / pageSize);

        int fromIndex = Math.min((pageNumber - 1) * pageSize, total);
        int toIndex = Math.min(fromIndex + pageSize, total);
        List<String> pageIds = orderedIds.subList(fromIndex, toIndex);

        List<UserSearchResponse> incoming = getProfilesWithCache(pageIds, RelationshipStatus.FRIEND_REQUEST_RECEIVED);

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .content(incoming)
                .build();
    }

    @Override
    public PageResponse<?> getSentFriendRequests(int pageNumber, int pageSize) {
        String userId = currentUserService.getCurrentUser().getUser().getId();

        String cacheKey = userNodeCacheService.generateRelationshipCacheKey(userId, CacheConstant.SENT_REQUESTS_CACHE_PREFIX);
        Set<String> allSentIds = userNodeCacheService.getRelationshipIds(cacheKey);

        if (allSentIds == null || allSentIds.isEmpty()) {
            allSentIds = new HashSet<>(userNodeRepository.getSentFriendRequestIds(userId));

            if (!allSentIds.isEmpty() && allSentIds.size() <= CacheConstant.MAX_SENT_REQUESTS_TO_CACHE) {
                userNodeCacheService.cacheRelationshipIds(cacheKey, allSentIds, CacheConstant.SENT_REQUESTS_CACHE_TTL);
            }
        }

        List<String> orderedIds = new ArrayList<>(allSentIds);
        int total = orderedIds.size();
        int totalPages = (int) Math.ceil((double) total / pageSize);

        int fromIndex = Math.min((pageNumber - 1) * pageSize, total);
        int toIndex = Math.min(fromIndex + pageSize, total);
        List<String> pageIds = orderedIds.subList(fromIndex, toIndex);

        List<UserSearchResponse> sent = getProfilesWithCache(pageIds, RelationshipStatus.FRIEND_REQUEST_SENT);

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .content(sent)
                .build();
    }

    @Override
    public PageResponse<?> searchFriends(String query, int pageNumber, int pageSize, String sortBy, String sortDirection) {
        String currentUserId = currentUserService.getCurrentUser().getUser().getId();

        // Get friend IDs from cache or database
        String cacheKey = userNodeCacheService.generateRelationshipCacheKey(currentUserId, CacheConstant.FRIENDS_CACHE_PREFIX);
        Set<String> allFriendIds = userNodeCacheService.getRelationshipIds(cacheKey);

        if (allFriendIds == null || allFriendIds.isEmpty()) {
            // Cache miss - load from DB
            allFriendIds = new HashSet<>(userNodeRepository.findFriendIds(currentUserId));
            // Cache the result
            if (!allFriendIds.isEmpty() && allFriendIds.size() <= CacheConstant.MAX_FRIENDS_TO_CACHE) {
                userNodeCacheService.cacheRelationshipIds(cacheKey, allFriendIds, CacheConstant.FRIENDS_CACHE_TTL);
            }
        }

        if (allFriendIds.isEmpty()) {
            return PageResponse.builder()
                    .pageNumber(pageNumber)
                    .pageSize(pageSize)
                    .totalElements(0)
                    .totalPages(0)
                    .content(new ArrayList<>())
                    .build();
        }

        // Search friends by query using MongoDB full-text search
        List<UserSearchResponse> searchResults = userRepository.searchByFullNameIn(
                        query.toLowerCase(),
                        new ArrayList<>(allFriendIds)
                ).stream()
                .map(user -> userMapper.toUserSearchResponse(user, RelationshipStatus.FRIEND))
                .collect(Collectors.toList());

        // Apply sorting
        if ("fullName".equals(sortBy)) {
            if ("desc".equals(sortDirection)) {
                searchResults.sort((a, b) -> b.getFullName().compareToIgnoreCase(a.getFullName()));
            } else {
                searchResults.sort((a, b) -> a.getFullName().compareToIgnoreCase(b.getFullName()));
            }
        }

        // Manual pagination
        int total = searchResults.size();
        int totalPages = (int) Math.ceil((double) total / pageSize);
        int fromIndex = Math.min((pageNumber - 1) * pageSize, total);
        int toIndex = Math.min(fromIndex + pageSize, total);

        List<UserSearchResponse> pageContent = searchResults.subList(fromIndex, toIndex);

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .content(pageContent)
                .build();
    }

    @Override
    public PageResponse<?> searchUsers(String query,
                                       int pageNumber,
                                       int pageSize,
                                       String sortBy,
                                       String sortDirection) {
        if (pageNumber < 1) {
            throw new IllegalArgumentException("Page number must be greater than or equal to 1");
        }
        if (pageSize < 1 || pageSize > 100) {
            throw new IllegalArgumentException("Page size must be between 1 and 100");
        }
        if (query == null || query.isBlank()) {
            throw new IllegalArgumentException("Search query cannot be null or empty");
        }

        String currentUserId = currentUserService.getCurrentUser().getUser().getId();

        String cacheKey = userNodeCacheService.generateSearchCacheKey(currentUserId, query, pageNumber, pageSize);
        PageResponse<?> cached = userNodeCacheService.getCachedSearchResult(cacheKey, PageResponse.class);

        if (cached != null) {
            return cached;
        }

        @SuppressWarnings("unchecked")
        PageResponse<UserSearchResponse> result = (PageResponse<UserSearchResponse>) performSearch(
                currentUserId, query, pageNumber, pageSize);

        // Cache the result
        userNodeCacheService.cacheSearchResult(cacheKey, result, CacheConstant.SEARCH_CACHE_TTL);

        return result;
    }

    @Override
    public void updateUserNode(User user) {
        userNodeRepository.findByUserId(user.getId()).ifPresent(userNode -> {
            userNode.setFullName(user.getFullName());
            userNode.setProfileImageUrl(user.getProfileImageUrl());
            userNode.setBio(user.getBio());
            userNodeRepository.save(userNode);
        });
    }

    @Override
    public RelationshipStatus getRelationshipBetween(String currentUserId, String targetUserId) {
        return userNodeRepository.getRelationshipBetween(currentUserId, targetUserId);
    }

    private PageResponse<?> performSearch(String currentUserId,
                                          String query,
                                          int pageNumber,
                                          int pageSize) {

        int skip = toSkip(pageNumber, pageSize);

        List<UserSearchResponse> response;
        long totalElements;

        // Try full-text search first
        if (userNodeRepository.fullTextIndexExists()) {
            response = userNodeRepository.searchUsersWithRelationshipsFullText(currentUserId, query, skip, pageSize);
            totalElements = userNodeRepository.countSearchResultsFullText(currentUserId, query);
        }
        // Fallback to regex search
        else {
            response = userNodeRepository.searchUsersWithRelationshipsRegex(currentUserId, query, skip, pageSize);
            totalElements = userNodeRepository.countSearchResultsRegex(currentUserId, query);
        }

        response = userMapper.resolveProfileImageUrls(response);

        int totalPages = (int) Math.ceil((double) totalElements / pageSize);

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .content(response)
                .build();
    }

    private List<UserSearchResponse> getProfilesWithCache(List<String> userIds, RelationshipStatus status) {

        // Try to get cached profiles first
        Map<String, UserOverviewResponse> cached = userCacheService.getCachedUserOverviews(userIds);

        // Find missing users
        List<String> missingIds = userIds.stream()
                .filter(id -> !cached.containsKey(id))
                .toList();

        if (!missingIds.isEmpty()) {
            // Load missing users from DB
            List<User> dbUsers = userRepository.findAllById(missingIds);

            // Cache new profiles
            userCacheService.cacheUserOverviews(dbUsers);

            // Add newly loaded DB users to the cache map so they can be included in the result
            dbUsers.forEach(user -> cached.put(
                    user.getId(),
                    userMapper.toUserOverviewResponse(user)
                    )
            );
        }

        // Maintain original order
        return userIds.stream()
                .map(cached::get)
                .filter(Objects::nonNull)
                .map(user -> UserSearchResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .profileImageUrl(user.getProfileImageUrl())
                        .relationshipStatus(status)
                        .build())
                .toList();
    }

    private int toSkip(int pageNumber, int pageSize) {
        return (pageNumber - 1) * pageSize;
    }

    private void onRelationshipChange(String currentUserId, String targetUserId) {
        userNodeCacheService.invalidateRelationshipCaches(currentUserId);
        userNodeCacheService.invalidateRelationshipCaches(targetUserId);
        userNodeCacheService.invalidateSearchCache(currentUserId);
        userNodeCacheService.invalidateSearchCache(targetUserId);
    }
}
