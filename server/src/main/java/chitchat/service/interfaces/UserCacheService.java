package chitchat.service.interfaces;

import chitchat.dto.response.user.UserOverviewResponse;
import chitchat.model.User;

import java.util.List;
import java.util.Map;

public interface UserCacheService {
    void cacheUserOverview(User user);
    UserOverviewResponse getCachedUserOverview(String userId);
    void cacheUserOverviews(List<User> users);
    Map<String, UserOverviewResponse> getCachedUserOverviews(List<String> userIds);
}
