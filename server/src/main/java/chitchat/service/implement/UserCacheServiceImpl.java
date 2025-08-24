package chitchat.service.implement;

import chitchat.constant.CacheConstant;
import chitchat.dto.response.user.UserOverviewResponse;
import chitchat.mapper.UserMapper;
import chitchat.model.User;
import chitchat.service.interfaces.UserCacheService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class UserCacheServiceImpl implements UserCacheService {

    private final UserMapper userMapper;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    @Async
    @Override
    public void cacheUserOverview(User user) {
        cacheUserOverviews(List.of(user));
    }

    @Override
    public UserOverviewResponse getCachedUserOverview(String userId) {
        String cachedKey = CacheConstant.PROFILE_KEY_PREFIX + userId;
        Object value = redisTemplate.opsForValue().get(cachedKey);
        return value != null
                ? objectMapper.convertValue(value, UserOverviewResponse.class)
                : null;
    }

    @Async
    @Override
    public void cacheUserOverviews(List<User> users) {
        users.forEach(user -> {
            String key = CacheConstant.PROFILE_KEY_PREFIX + user.getId();
            UserOverviewResponse overview = userMapper.toUserOverviewResponse(user);
            // Add jitter to prevent cache stampede
            var ttlWithJitter = CacheConstant.PROFILE_CACHE_TTL
                    .plusSeconds(ThreadLocalRandom.current().nextInt(300));
            redisTemplate.opsForValue().set(key, overview, ttlWithJitter);
        });
    }

    @Override
    public Map<String, UserOverviewResponse> getCachedUserOverviews(List<String> userIds) {
        List<Object> cached = redisTemplate.opsForValue()
                .multiGet(userIds.stream()
                        .map(id -> CacheConstant.PROFILE_KEY_PREFIX + id)
                        .toList());

        Map<String, UserOverviewResponse> results = new HashMap<>();
        for (int i = 0; i < userIds.size(); i++) {
            if (cached != null && cached.get(i) != null) {
                UserOverviewResponse profile = objectMapper.convertValue(cached.get(i), UserOverviewResponse.class);
                results.put(userIds.get(i), profile);
            }
        }
        return results;
    }
}
