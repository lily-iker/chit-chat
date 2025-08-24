package chitchat.service.implement;

import chitchat.constant.CacheConstant;
import chitchat.service.interfaces.UserNodeCacheService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserNodeCacheServiceImpl implements UserNodeCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    @Async
    @Override
    public void invalidateRelationshipCaches(String userId) {
        deleteKeysByPattern(CacheConstant.FRIENDS_CACHE_PREFIX + userId + "*");
        deleteKeysByPattern(CacheConstant.BLOCKED_CACHE_PREFIX + userId + "*");
        deleteKeysByPattern(CacheConstant.INCOMING_REQUESTS_CACHE_PREFIX + userId + "*");
        deleteKeysByPattern(CacheConstant.SENT_REQUESTS_CACHE_PREFIX + userId + "*");
    }

    @Async
    @Override
    public void invalidateSearchCache(String userId) {
        deleteKeysByPattern(CacheConstant.SEARCH_CACHE_PREFIX + userId + ":*");
    }

    @Override
    public String generateRelationshipCacheKey(String userId, String relationship) {
        return relationship + userId;
    }

    @Override
    public String generateSearchCacheKey(String userId, String query, int pageNumber, int pageSize) {
        return CacheConstant.SEARCH_CACHE_PREFIX
                + userId + ":" + query.toLowerCase().trim() + ":" + pageNumber + ":" + pageSize;
    }

    @Override
    public Set<String> getRelationshipIds(String key) {
        Set<Object> ids = redisTemplate.opsForSet().members(key);
        return ids == null
                ? new HashSet<>()
                : objectMapper.convertValue(ids, new TypeReference<>() {});
    }

    @Async
    @Override
    public void cacheRelationshipIds(String key, Set<String> ids, Duration ttl) {
        if (ids != null && !ids.isEmpty()) {
            redisTemplate.opsForSet().add(key, ids.toArray(new String[0]));
            redisTemplate.expire(key, ttl);
        }
    }

    @Override
    public <T> T getCachedSearchResult(String key, Class<T> type) {
        Object cached = redisTemplate.opsForValue().get(key);
        return cached != null
                ? objectMapper.convertValue(cached, type)
                : null;
    }

    @Async
    @Override
    public void cacheSearchResult(String key, Object result, Duration ttl) {
        redisTemplate.opsForValue().set(key, result, ttl);
    }

    private void deleteKeysByPattern(String pattern) {
        Set<String> keys = redisTemplate.keys(pattern);
        if (!keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
