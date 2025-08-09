package chitchat.service.implement;

import chitchat.constant.CacheConstant;
import chitchat.dto.request.user.UserInfoRequest;
import chitchat.dto.response.user.UserInfoResponse;
import chitchat.dto.response.user.UserSearchResponse;
import chitchat.mapper.UserMapper;
import chitchat.model.User;
import chitchat.model.security.CustomUserDetails;
import chitchat.repository.UserNodeRepository;
import chitchat.repository.UserRepository;
import chitchat.security.service.CurrentUserService;
import chitchat.service.MinioService;
import chitchat.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserNodeRepository userNodeRepository;
    private final CurrentUserService currentUserService;
    private final UserMapper userMapper;
    private final MinioService minioService;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    @Transactional
    public UserInfoResponse setUpMyBasicInfo(UserInfoRequest userInfoRequest, MultipartFile profileImageFile) throws Exception {
        CustomUserDetails userDetails = currentUserService.getCurrentUser();
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

        updateUserNode(user);

        // Update the cache for the user's profile
        cacheUserProfile(user);

        return userMapper.toUserInfoResponse(user);
    }

    @Override
    public UserInfoResponse getMyInfo() {
        CustomUserDetails userDetails = currentUserService.getCurrentUser();
        return userMapper.toUserInfoResponse(userDetails.getUser());
    }

    private void updateUserNode(User user) {
        userNodeRepository.findByUserId(user.getId()).ifPresent(userNode -> {
            userNode.setFullName(user.getFullName());
            userNode.setProfileImageUrl(user.getProfileImageUrl());
            userNode.setBio(user.getBio());
            userNodeRepository.save(userNode);
        });
    }

    @Async
    private void cacheUserProfile(User user) {
        String cacheKey = CacheConstant.PROFILE_KEY_PREFIX + user.getId();
        UserSearchResponse cacheProfile = userMapper.toUserSearchResponse(user);
        redisTemplate.opsForValue().set(cacheKey, cacheProfile);
    }
}
