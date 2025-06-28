package chitchat.service.implement;

import chitchat.constant.CacheConstant;
import chitchat.dto.request.user.UserInfoRequest;
import chitchat.dto.response.user.UserInfoResponse;
import chitchat.dto.response.user.UserProfileResponse;
import chitchat.exception.AuthenticationException;
import chitchat.mapper.UserMapper;
import chitchat.model.User;
import chitchat.model.security.CustomUserDetails;
import chitchat.repository.UserRepository;
import chitchat.service.MinioService;
import chitchat.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final MinioService minioService;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public CustomUserDetails getCurrentUser() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        Object principal = securityContext.getAuthentication().getPrincipal();

        if (!(principal instanceof UserDetails)) {
            throw new AuthenticationException("Unauthenticated");
        }
        return (CustomUserDetails) principal;
    }

    @Override
    @Transactional
    public UserInfoResponse setUpMyBasicInfo(UserInfoRequest userInfoRequest, MultipartFile profileImageFile) throws Exception {
        CustomUserDetails userDetails = getCurrentUser();
        User user = userDetails.getUser();

        user.setFullName(userInfoRequest.getFullName().trim());
        user.setBio(userInfoRequest.getBio());

        if (profileImageFile != null) {
            if (user.getProfileImageUrl() != null && !user.getProfileImageUrl().isEmpty()) {
                minioService.deleteFileFromPublicBucket(user.getProfileImageUrl());
            }

            String profileImageUrl = minioService.uploadFileToPublicBucket(profileImageFile);
            user.setProfileImageUrl(profileImageUrl);
        }

        user.setProfileCompleted(true);
        userRepository.save(user);

        // Clear the cache for the user's profile
        String cacheKey = CacheConstant.PROFILE_KEY_PREFIX + user.getId();
        UserProfileResponse cacheProfile = userMapper.toUserProfileResponse(user);
        redisTemplate.opsForValue().set(cacheKey, cacheProfile);

        return userMapper.toUserInfoResponse(user);
    }

    @Override
    public UserInfoResponse getMyInfo() {
        CustomUserDetails userDetails = getCurrentUser();
        return userMapper.toUserInfoResponse(userDetails.getUser());
    }
}
