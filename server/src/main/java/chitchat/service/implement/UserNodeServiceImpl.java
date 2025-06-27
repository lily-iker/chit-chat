package chitchat.service.implement;

import chitchat.dto.response.PageResponse;
import chitchat.dto.response.user.UserSearchResponse;
import chitchat.model.UserNode;
import chitchat.model.enumeration.RelationshipStatus;
import chitchat.repository.UserNodeRepository;
import chitchat.service.interfaces.RelationshipService;
import chitchat.service.interfaces.UserNodeService;
import chitchat.service.interfaces.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserNodeServiceImpl implements UserNodeService {

    private static final String FRIENDS_CACHE_PREFIX = "friends:";
    private static final String SENT_REQUESTS_CACHE_PREFIX = "sent:";
    private static final String INCOMING_REQUESTS_CACHE_PREFIX = "incoming:";
    private static final String BLOCKED_CACHE_PREFIX = "blocked:";
    private static final String SEARCH_CACHE_PREFIX = "search:";
    private static final Duration FRIENDS_CACHE_TTL = Duration.ofHours(12);
    private static final Duration SENT_REQUESTS_CACHE_TTL = Duration.ofHours(1);
    private static final Duration INCOMING_REQUESTS_CACHE_TTL = Duration.ofMinutes(30);
    private static final Duration BLOCKED_CACHE_TTL = Duration.ofDays(3);
    private static final Duration SEARCH_CACHE_TTL = Duration.ofMinutes(10);

    private final UserNodeRepository userNodeRepository;
    private final UserService userService;
    private final RelationshipService relationshipService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    @PostConstruct
    public void createIndexes() {
        userNodeRepository.createFullTextIndex();
    }

    @Override
    public void sendFriendRequest(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
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
        String currentUserId = userService.getCurrentUser().getUser().getId();
        userNodeRepository.cancelFriendRequest(currentUserId, targetUserId);
        onRelationshipChange(currentUserId, targetUserId);
    }

    @Override
    public void acceptFriendRequest(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        userNodeRepository.acceptFriendRequest(currentUserId, targetUserId);
        onRelationshipChange(currentUserId, targetUserId);
    }

    /**
    Reject a friend request from the target user
    **/
    @Override
    public void rejectFriendRequest(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        userNodeRepository.rejectFriendRequest(currentUserId, targetUserId);
        onRelationshipChange(currentUserId, targetUserId);
    }

    @Override
    public void removeFriend(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        userNodeRepository.removeFriend(currentUserId, targetUserId);
        onRelationshipChange(currentUserId, targetUserId);
    }

    @Override
    public void blockUser(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        if (targetUserId.equals(currentUserId)) {
            throw new IllegalArgumentException("Cannot block yourself");
        }
        userNodeRepository.blockUser(currentUserId, targetUserId);
        onRelationshipChange(currentUserId, targetUserId);
    }

    @Override
    public void unblockUser(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
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
    public PageResponse<?> getFriends(int pageNumber, int pageSize) {
        String userId = userService.getCurrentUser().getUser().getId();

        String cacheKey = generateRelationshipCacheKey(userId, FRIENDS_CACHE_PREFIX, pageNumber, pageSize);
        Object cachedObject = redisTemplate.opsForValue().get(cacheKey);
        var cachedResponse = objectMapper.convertValue(cachedObject, PageResponse.class);

        if (cachedResponse != null) {
            return cachedResponse;
        }

        int skip = toSkip(pageNumber, pageSize);
        List<UserNode> friends = userNodeRepository.findFriendsPaginated(userId, skip, pageSize);
        long total = userNodeRepository.countFriends(userId);
        int totalPages = (int) Math.ceil((double) total / pageSize);

        List<UserSearchResponse> response = friends.stream()
                .map(user -> UserSearchResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .profileImageUrl(user.getProfileImageUrl())
                        .relationshipStatus(RelationshipStatus.FRIEND)
                        .build()
                )
                .toList();
        
        PageResponse<Object> pageResponse = PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .content(response)
                .build();
        
        redisTemplate.opsForValue().set(cacheKey, pageResponse, FRIENDS_CACHE_TTL);
        
        return pageResponse;
    }

    @Override
    public PageResponse<?> getBlockedUsers(int pageNumber, int pageSize) {
        String userId = userService.getCurrentUser().getUser().getId();

        String cacheKey = generateRelationshipCacheKey(userId, BLOCKED_CACHE_PREFIX, pageNumber, pageSize);
        Object cachedObject = redisTemplate.opsForValue().get(cacheKey);
        var cachedResponse = objectMapper.convertValue(cachedObject, PageResponse.class);

        if (cachedResponse != null) {
            return cachedResponse;
        }

        int skip = toSkip(pageNumber, pageSize);
        List<UserNode> blockedUsers = userNodeRepository.findBlockedUsersPaginated(userId, skip, pageSize);
        long total = userNodeRepository.countBlockedUsers(userId);
        int totalPages = (int) Math.ceil((double) total / pageSize);

        List<UserSearchResponse> response = blockedUsers.stream()
                .map(user -> UserSearchResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .profileImageUrl(user.getProfileImageUrl())
                        .relationshipStatus(RelationshipStatus.BLOCKED)
                        .build()
                )
                .toList();
        
        PageResponse<Object> pageResponse = PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .content(response)
                .build();
        
        redisTemplate.opsForValue().set(cacheKey, pageResponse, BLOCKED_CACHE_TTL);
        
        return pageResponse;
    }

    @Override
    public PageResponse<?> getIncomingFriendRequests(int pageNumber, int pageSize) {
        String userId = userService.getCurrentUser().getUser().getId();

        String cacheKey = generateRelationshipCacheKey(userId, INCOMING_REQUESTS_CACHE_PREFIX, pageNumber, pageSize);
        Object cachedObject = redisTemplate.opsForValue().get(cacheKey);
        var cachedResponse = objectMapper.convertValue(cachedObject, PageResponse.class);

        if (cachedResponse != null) {
            return cachedResponse;
        }

        int skip = toSkip(pageNumber, pageSize);
        List<UserNode> incoming = userNodeRepository.getIncomingFriendRequestsPaginated(userId, skip, pageSize);
        long total = userNodeRepository.countIncomingFriendRequests(userId);
        int totalPages = (int) Math.ceil((double) total / pageSize);

        List<UserSearchResponse> response = incoming.stream()
                .map(user -> UserSearchResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .profileImageUrl(user.getProfileImageUrl())
                        .relationshipStatus(RelationshipStatus.FRIEND_REQUEST_RECEIVED)
                        .build()
                )
                .toList();
        
        PageResponse<Object> pageResponse = PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .content(response)
                .build();
        
        redisTemplate.opsForValue().set(cacheKey, pageResponse, INCOMING_REQUESTS_CACHE_TTL);
        
        return pageResponse;
    }

    @Override
    public PageResponse<?> getSentFriendRequests(int pageNumber, int pageSize) {
        String userId = userService.getCurrentUser().getUser().getId();

        String cacheKey = generateRelationshipCacheKey(userId, SENT_REQUESTS_CACHE_PREFIX, pageNumber, pageSize);
        Object cachedObject = redisTemplate.opsForValue().get(cacheKey);
        var cachedResponse = objectMapper.convertValue(cachedObject, PageResponse.class);

        if (cachedResponse != null) {
            return cachedResponse;
        }

        int skip = toSkip(pageNumber, pageSize);
        List<UserNode> sent = userNodeRepository.getSentFriendRequestsPaginated(userId, skip, pageSize);
        long total = userNodeRepository.countSentFriendRequests(userId);
        int totalPages = (int) Math.ceil((double) total / pageSize);

        List<UserSearchResponse> response = sent.stream()
                .map(user -> UserSearchResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .profileImageUrl(user.getProfileImageUrl())
                        .relationshipStatus(RelationshipStatus.FRIEND_REQUEST_SENT)
                        .build()
                )
                .toList();

        PageResponse<Object> pageResponse = PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .content(response)
                .build();
        
        redisTemplate.opsForValue().set(cacheKey, pageResponse, SENT_REQUESTS_CACHE_TTL);
        
        return pageResponse;
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

        String currentUserId = userService.getCurrentUser().getUser().getId();

        String cacheKey = generateSearchCacheKey(currentUserId, query, pageNumber, pageSize);
        Object cachedObject = redisTemplate.opsForValue().get(cacheKey);
        var cachedResponse = objectMapper.convertValue(cachedObject, PageResponse.class);

        if (cachedResponse != null) {
            return cachedResponse;
        }

        @SuppressWarnings("unchecked")
        PageResponse<UserSearchResponse> result = (PageResponse<UserSearchResponse>) performSearch(
                currentUserId, query, pageNumber, pageSize);

        // Cache the result
        redisTemplate.opsForValue().set(cacheKey, result, SEARCH_CACHE_TTL);

        return result;
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

        int totalPages = (int) Math.ceil((double) totalElements / pageSize);

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .content(response)
                .build();
    }

    private int toSkip(int pageNumber, int pageSize) {
        return (pageNumber - 1) * pageSize;
    }

    private void onRelationshipChange(String currentUserId, String targetUserId) {
        invalidateSearchCache(currentUserId);
        invalidateSearchCache(targetUserId);
        invalidateRelationshipCaches(currentUserId);
        invalidateRelationshipCaches(targetUserId);
    }

    private String generateRelationshipCacheKey(String userId, String relationship, int pageNumber, int pageSize) {
        return relationship + userId + ":" + pageNumber + ":" + pageSize;
    }

    private String generateSearchCacheKey(String userId, String query, int pageNumber, int pageSize) {
        return SEARCH_CACHE_PREFIX + userId + ":" + query.toLowerCase().trim() + ":" + pageNumber + ":" + pageSize;
    }

    private void invalidateRelationshipCaches(String userId) {
        Set<String> friendKeys = redisTemplate.keys(FRIENDS_CACHE_PREFIX + userId + ":*");
        if (!friendKeys.isEmpty()) {
            redisTemplate.delete(friendKeys);
        }

        Set<String> blockedKeys = redisTemplate.keys(BLOCKED_CACHE_PREFIX + userId + ":*");
        if (!blockedKeys.isEmpty()) {
            redisTemplate.delete(blockedKeys);
        }

        Set<String> incomingKeys = redisTemplate.keys(INCOMING_REQUESTS_CACHE_PREFIX + userId + ":*");
        if (!incomingKeys.isEmpty()) {
            redisTemplate.delete(incomingKeys);
        }

        Set<String> sentKeys = redisTemplate.keys(SENT_REQUESTS_CACHE_PREFIX + userId + ":*");
        if (!sentKeys.isEmpty()) {
            redisTemplate.delete(sentKeys);
        }
    }

    private void invalidateSearchCache(String userId) {
        Set<String> keys = redisTemplate.keys(SEARCH_CACHE_PREFIX + userId + ":*");
        if (!keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
