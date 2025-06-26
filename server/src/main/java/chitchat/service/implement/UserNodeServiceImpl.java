package chitchat.service.implement;

import chitchat.dto.response.PageResponse;
import chitchat.dto.response.user.UserSearchResponse;
import chitchat.model.UserNode;
import chitchat.repository.UserNodeRepository;
import chitchat.service.interfaces.RelationshipService;
import chitchat.service.interfaces.UserNodeService;
import chitchat.service.interfaces.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserNodeServiceImpl implements UserNodeService {

    private static final String SEARCH_CACHE_PREFIX = "search:";
    private static final Duration SEARCH_CACHE_TTL = Duration.ofMinutes(10);

    private final UserNodeRepository userNodeRepository;
    private final UserService userService;
    private final RelationshipService relationshipService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void sendFriendRequest(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        if (targetUserId.equals(currentUserId)) {
            throw new IllegalArgumentException("Cannot send friend request to yourself");
        }
        userNodeRepository.sendFriendRequest(currentUserId, targetUserId);
        
        invalidateSearchCache(currentUserId);
        invalidateSearchCache(targetUserId);
    }

    /**
    Cancel a previously sent friend request from the current user to the target user
    **/
    @Override
    public void cancelFriendRequest(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        userNodeRepository.cancelFriendRequest(currentUserId, targetUserId);

        invalidateSearchCache(currentUserId);
        invalidateSearchCache(targetUserId);
    }

    @Override
    public void acceptFriendRequest(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        userNodeRepository.acceptFriendRequest(currentUserId, targetUserId);

        invalidateSearchCache(currentUserId);
        invalidateSearchCache(targetUserId);
    }

    /**
    Reject a friend request from the target user
    **/
    @Override
    public void rejectFriendRequest(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        userNodeRepository.rejectFriendRequest(currentUserId, targetUserId);

        invalidateSearchCache(currentUserId);
        invalidateSearchCache(targetUserId);
    }

    @Override
    public void removeFriend(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        userNodeRepository.removeFriend(currentUserId, targetUserId);

        invalidateSearchCache(currentUserId);
        invalidateSearchCache(targetUserId);
    }

    @Override
    public void blockUser(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        if (targetUserId.equals(currentUserId)) {
            throw new IllegalArgumentException("Cannot block yourself");
        }
        userNodeRepository.blockUser(currentUserId, targetUserId);

        invalidateSearchCache(currentUserId);
        invalidateSearchCache(targetUserId);
    }

    @Override
    public void unblockUser(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        userNodeRepository.unblockUser(currentUserId, targetUserId);

        invalidateSearchCache(currentUserId);
        invalidateSearchCache(targetUserId);
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
        int skip = toSkip(pageNumber, pageSize);
        List<UserNode> friends = userNodeRepository.findFriendsPaginated(userId, skip, pageSize);
        long total = userNodeRepository.countFriends(userId);
        int totalPages = (int) Math.ceil((double) total / pageSize);

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
        String userId = userService.getCurrentUser().getUser().getId();
        int skip = toSkip(pageNumber, pageSize);
        List<UserNode> blockedUsers = userNodeRepository.findBlockedUsersPaginated(userId, skip, pageSize);
        long total = userNodeRepository.countBlockedUsers(userId);
        int totalPages = (int) Math.ceil((double) total / pageSize);

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
        String userId = userService.getCurrentUser().getUser().getId();
        int skip = toSkip(pageNumber, pageSize);
        List<UserNode> incoming = userNodeRepository.getIncomingFriendRequestsPaginated(userId, skip, pageSize);
        long total = userNodeRepository.countIncomingFriendRequests(userId);
        int totalPages = (int) Math.ceil((double) total / pageSize);

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
        String userId = userService.getCurrentUser().getUser().getId();
        int skip = toSkip(pageNumber, pageSize);
        List<UserNode> sent = userNodeRepository.getSentFriendRequestsPaginated(userId, skip, pageSize);
        long total = userNodeRepository.countSentFriendRequests(userId);
        int totalPages = (int) Math.ceil((double) total / pageSize);

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .content(sent)
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

        String currentUserId = userService.getCurrentUser().getUser().getId();

        String cacheKey = generateSearchCacheKey(currentUserId, query, pageNumber, pageSize);

        Object cachedObject = redisTemplate.opsForValue().get(cacheKey);
        var cachedResponse = objectMapper.convertValue(cachedObject, PageResponse.class);

        if (cachedResponse != null) {
            System.out.println("Returning cached search results for query: " + query);
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

        List<UserSearchResponse> userResponses;
        long totalElements;

        // Try full-text search first
        if (userNodeRepository.fullTextIndexExists()) {
            userResponses = userNodeRepository.searchUsersWithRelationshipsFullText(currentUserId, query, skip, pageSize);
            totalElements = userNodeRepository.countSearchResultsFullText(currentUserId, query);
        }
        // Fallback to regex search
        else {
            userResponses = userNodeRepository.searchUsersWithRelationshipsRegex(currentUserId, query, skip, pageSize);
            totalElements = userNodeRepository.countSearchResultsRegex(currentUserId, query);
        }

        int totalPages = (int) Math.ceil((double) totalElements / pageSize);

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .content(userResponses)
                .build();
    }

    private int toSkip(int pageNumber, int pageSize) {
        return (pageNumber - 1) * pageSize;
    }

    private String generateSearchCacheKey(String userId, String query, int pageNumber, int pageSize) {
        return SEARCH_CACHE_PREFIX + userId + ":" + query.toLowerCase().trim() + ":" + pageNumber + ":" + pageSize;
    }

    public void invalidateSearchCache(String userId) {
        Set<String> keys = redisTemplate.keys(SEARCH_CACHE_PREFIX + userId + ":*");
        if (!keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
