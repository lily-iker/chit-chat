package chitchat.service.interfaces;

import java.time.Duration;
import java.util.Set;

public interface UserNodeCacheService {
    void invalidateRelationshipCaches(String userId);
    void invalidateSearchCache(String userId);
    String generateRelationshipCacheKey(String userId, String relationship);
    String generateSearchCacheKey(String userId, String query, int pageNumber, int pageSize);
    Set<String> getRelationshipIds(String key);
    void cacheRelationshipIds(String key, Set<String> ids, Duration ttl);
    <T> T getCachedSearchResult(String key, Class<T> type);
    void cacheSearchResult(String key, Object result, Duration ttl);
}
