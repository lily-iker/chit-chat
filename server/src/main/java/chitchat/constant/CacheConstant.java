package chitchat.constant;

import java.time.Duration;

public class CacheConstant {
    public static final String PROFILE_KEY_PREFIX = "profile:";
    public static final String FRIENDS_CACHE_PREFIX = "friends:";
    public static final String SENT_REQUESTS_CACHE_PREFIX = "sent:";
    public static final String INCOMING_REQUESTS_CACHE_PREFIX = "incoming:";
    public static final String BLOCKED_CACHE_PREFIX = "blocked:";
    public static final String SEARCH_CACHE_PREFIX = "search:";

    public static final Duration PROFILE_CACHE_TTL = Duration.ofDays(1);
    public static final Duration FRIENDS_CACHE_TTL = Duration.ofHours(12);
    public static final Duration SENT_REQUESTS_CACHE_TTL = Duration.ofHours(1);
    public static final Duration INCOMING_REQUESTS_CACHE_TTL = Duration.ofMinutes(30);
    public static final Duration BLOCKED_CACHE_TTL = Duration.ofDays(1);
    public static final Duration SEARCH_CACHE_TTL = Duration.ofMinutes(5);

    public static final int MAX_FRIENDS_TO_CACHE = 5000;
    public static final int MAX_INCOMING_REQUESTS_TO_CACHE = 5000;
    public static final int MAX_SENT_REQUESTS_TO_CACHE = 3000;
    public static final int MAX_BLOCKED_USERS_TO_CACHE = 1000;
}
