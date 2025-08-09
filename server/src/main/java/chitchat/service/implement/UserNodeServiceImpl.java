package chitchat.service.implement;

import chitchat.constant.CacheConstant;
import chitchat.dto.response.PageResponse;
import chitchat.dto.response.user.UserSearchResponse;
import chitchat.mapper.UserMapper;
import chitchat.model.User;
import chitchat.model.UserNode;
import chitchat.model.enumeration.RelationshipStatus;
import chitchat.repository.UserNodeRepository;
import chitchat.repository.UserRepository;
import chitchat.security.service.CurrentUserService;
import chitchat.service.interfaces.UserNodeService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserNodeServiceImpl implements UserNodeService {

    private final UserNodeRepository userNodeRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final UserMapper userMapper;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

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

        String cacheKey = generateRelationshipCacheKey(userId, CacheConstant.FRIENDS_CACHE_PREFIX);
        Set<Object> allFriendIdsObject = redisTemplate.opsForSet().members(cacheKey);
        Set<String> allFriendIds = objectMapper.convertValue(allFriendIdsObject, new TypeReference<>() {});

        if (allFriendIds == null || allFriendIds.isEmpty()) {
            // Cache miss - load from DB
            allFriendIds = new HashSet<>(userNodeRepository.findFriendIds(userId));

            // Only cache if we have a reasonable number of friends
            if (!allFriendIds.isEmpty() && allFriendIds.size() <= CacheConstant.MAX_FRIENDS_TO_CACHE) {
                redisTemplate.opsForSet().add(cacheKey, allFriendIds.toArray(new String[0]));
                redisTemplate.expire(cacheKey, CacheConstant.FRIENDS_CACHE_TTL);
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

        String cacheKey = generateRelationshipCacheKey(userId, CacheConstant.BLOCKED_CACHE_PREFIX);
        Set<Object> allBlockedIdsObject = redisTemplate.opsForSet().members(cacheKey);
        Set<String> allBlockedIds = objectMapper.convertValue(allBlockedIdsObject, new TypeReference<>() {});

        if (allBlockedIds == null || allBlockedIds.isEmpty()) {
            allBlockedIds = new HashSet<>(userNodeRepository.findBlockedUserIds(userId));

            if (!allBlockedIds.isEmpty() && allBlockedIds.size() <= CacheConstant.MAX_BLOCKED_USERS_TO_CACHE) {
                redisTemplate.opsForSet().add(cacheKey, allBlockedIds.toArray(new String[0]));
                redisTemplate.expire(cacheKey, CacheConstant.BLOCKED_CACHE_TTL);
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

        String cacheKey = generateRelationshipCacheKey(userId, CacheConstant.INCOMING_REQUESTS_CACHE_PREFIX);
        Set<Object> allIncomingIdsObject = redisTemplate.opsForSet().members(cacheKey);
        Set<String> allIncomingIds = objectMapper.convertValue(allIncomingIdsObject, new TypeReference<>() {});

        if (allIncomingIds == null || allIncomingIds.isEmpty()) {
            allIncomingIds = new HashSet<>(userNodeRepository.getIncomingFriendRequestIds(userId));

            if (!allIncomingIds.isEmpty() && allIncomingIds.size() <= CacheConstant.MAX_INCOMING_REQUESTS_TO_CACHE) {
                redisTemplate.opsForSet().add(cacheKey, allIncomingIds.toArray(new String[0]));
                redisTemplate.expire(cacheKey, CacheConstant.INCOMING_REQUESTS_CACHE_TTL);
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

        String cacheKey = generateRelationshipCacheKey(userId, CacheConstant.SENT_REQUESTS_CACHE_PREFIX);
        Set<Object> allSentIdsObject = redisTemplate.opsForSet().members(cacheKey);
        Set<String> allSentIds = objectMapper.convertValue(allSentIdsObject, new TypeReference<>() {});

        if (allSentIds == null || allSentIds.isEmpty()) {
            allSentIds = new HashSet<>(userNodeRepository.getSentFriendRequestIds(userId));

            if (!allSentIds.isEmpty() && allSentIds.size() <= CacheConstant.MAX_SENT_REQUESTS_TO_CACHE) {
                redisTemplate.opsForSet().add(cacheKey, allSentIds.toArray(new String[0]));
                redisTemplate.expire(cacheKey, CacheConstant.SENT_REQUESTS_CACHE_TTL);
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
        String cacheKey = generateRelationshipCacheKey(currentUserId, CacheConstant.FRIENDS_CACHE_PREFIX);
        Set<Object> allFriendIdsObject = redisTemplate.opsForSet().members(cacheKey);
        Set<String> allFriendIds = objectMapper.convertValue(allFriendIdsObject, new TypeReference<>() {});

        if (allFriendIds == null || allFriendIds.isEmpty()) {
            // Cache miss - load from DB
            allFriendIds = new HashSet<>(userNodeRepository.findFriendIds(currentUserId));
            // Cache the result
            if (!allFriendIds.isEmpty() && allFriendIds.size() <= CacheConstant.MAX_FRIENDS_TO_CACHE) {
                redisTemplate.opsForSet().add(cacheKey, allFriendIds.toArray(new String[0]));
                redisTemplate.expire(cacheKey, CacheConstant.FRIENDS_CACHE_TTL);
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
        redisTemplate.opsForValue().set(cacheKey, result, CacheConstant.SEARCH_CACHE_TTL);

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
        // Try cache first
        List<Object> cached = redisTemplate.opsForValue()
                .multiGet(userIds.stream()
                        .map(id -> CacheConstant.PROFILE_KEY_PREFIX + id)
                        .toList()
                );

        if (cached == null) {
            cached = new ArrayList<>();
        }

        // Find missing users
        Map<String, UserSearchResponse> results = new HashMap<>();
        List<String> missingIds = new ArrayList<>();

        for (int i = 0; i < userIds.size(); i++) {
            if (cached.get(i) != null) {
                UserSearchResponse profile = objectMapper.convertValue(cached.get(i), UserSearchResponse.class);
                results.put(userIds.get(i), profile);
            } else {
                missingIds.add(userIds.get(i));
            }
        }

        // Load missing users from DB
        if (!missingIds.isEmpty()) {
            List<User> dbUsers = userRepository.findAllById(missingIds);
            Map<String, UserSearchResponse> dbProfiles = dbUsers.stream()
                    .map(userMapper::toUserSearchResponse)
                    .collect(Collectors.toMap(UserSearchResponse::getId, profile -> profile));

            // Cache new profiles (with jitter)
            dbProfiles.forEach((id, profile) ->
                    redisTemplate.opsForValue().set(
                            CacheConstant.PROFILE_KEY_PREFIX + id,
                            profile,
                            CacheConstant.PROFILE_CACHE_TTL.plusSeconds(ThreadLocalRandom.current().nextInt(300))
                    )
            );

            results.putAll(dbProfiles);
        }

        // Maintain original order
        return userIds.stream()
                .map(results::get)
                .filter(Objects::nonNull)
                .map(user -> UserSearchResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .profileImageUrl(user.getProfileImageUrl())
                        .relationshipStatus(status)
                        .build()
                )
                .toList();
    }

    private int toSkip(int pageNumber, int pageSize) {
        return (pageNumber - 1) * pageSize;
    }

    @Async
    private void onRelationshipChange(String currentUserId, String targetUserId) {
        invalidateSearchCache(currentUserId);
        invalidateSearchCache(targetUserId);
        invalidateRelationshipCaches(currentUserId);
        invalidateRelationshipCaches(targetUserId);
    }

    private String generateRelationshipCacheKey(String userId, String relationship) {
        return relationship + userId;
    }

    private String generateSearchCacheKey(String userId, String query, int pageNumber, int pageSize) {
        return CacheConstant.SEARCH_CACHE_PREFIX + userId + ":" + query.toLowerCase().trim() + ":" + pageNumber + ":" + pageSize;
    }

    private void invalidateRelationshipCaches(String userId) {
        Set<String> friendKeys = redisTemplate.keys(CacheConstant.FRIENDS_CACHE_PREFIX + userId + "*");
        if (!friendKeys.isEmpty()) {
            redisTemplate.delete(friendKeys);
        }

        Set<String> blockedKeys = redisTemplate.keys(CacheConstant.BLOCKED_CACHE_PREFIX + userId + "*");
        if (!blockedKeys.isEmpty()) {
            redisTemplate.delete(blockedKeys);
        }

        Set<String> incomingKeys = redisTemplate.keys(CacheConstant.INCOMING_REQUESTS_CACHE_PREFIX + userId + "*");
        if (!incomingKeys.isEmpty()) {
            redisTemplate.delete(incomingKeys);
        }

        Set<String> sentKeys = redisTemplate.keys(CacheConstant.SENT_REQUESTS_CACHE_PREFIX + userId + "*");
        if (!sentKeys.isEmpty()) {
            redisTemplate.delete(sentKeys);
        }
    }

    private void invalidateSearchCache(String userId) {
        Set<String> keys = redisTemplate.keys(CacheConstant.SEARCH_CACHE_PREFIX + userId + ":*");
        if (!keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
