package chitchat.service.implement;

import chitchat.dto.request.user.UserInfoRequest;
import chitchat.dto.response.PageResponse;
import chitchat.dto.response.user.UserInfoResponse;
import chitchat.dto.response.user.UserSearchResponse;
import chitchat.exception.AuthenticationException;
import chitchat.mapper.UserMapper;
import chitchat.model.User;
import chitchat.model.enumeration.RelationshipStatus;
import chitchat.model.security.CustomUserDetails;
import chitchat.repository.UserNodeRepository;
import chitchat.repository.UserRepository;
import chitchat.service.MinioService;
import chitchat.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserNodeRepository userNodeRepository;
    private final UserMapper userMapper;
    private final MinioService minioService;

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

        user.setFullName(userInfoRequest.getFullName());
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

        return userMapper.toUserInfoResponse(user);
    }

    @Override
    public UserInfoResponse getMyInfo() {
        CustomUserDetails userDetails = getCurrentUser();
        return userMapper.toUserInfoResponse(userDetails.getUser());
    }

    @Override
    // TODO: add redis caching for this method
    public PageResponse<?> searchUsers(String query,
                                       int pageNumber,
                                       int pageSize,
                                       String sortBy,
                                       String sortDirection) {
        if (pageNumber < 1) {
            throw new IllegalArgumentException("Page number must be greater than or equal to 1");
        }

        String currentUserId = getCurrentUser().getUser().getId();

        List<String> blockedUserIds = userNodeRepository.getAllBlockedUserIds(currentUserId);
        blockedUserIds.add(currentUserId);

        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize);
        Page<User> userPage = userRepository.searchByFullNameExcludingUsers(query, blockedUserIds, pageable);

        List<String> pageUserIds = userPage.getContent().stream()
                .map(User::getId)
                .toList();

        List<String> friendIds = userNodeRepository.getFriendIdsIn(currentUserId, pageUserIds);
        List<String> sentRequestIds = userNodeRepository.getSentFriendRequestIdsIn(currentUserId, pageUserIds);
        List<String> receivedRequestIds = userNodeRepository.getIncomingFriendRequestIdsIn(currentUserId, pageUserIds);

        List<UserSearchResponse> userResponses = userPage.getContent().stream()
                .map(user -> {
                    RelationshipStatus status = determineRelationshipStatus(
                            user.getId(), friendIds, sentRequestIds, receivedRequestIds);

                    return UserSearchResponse.builder()
                                .id(user.getId())
                                .fullName(user.getFullName())
                                .profileImageUrl(user.getProfileImageUrl())
                                .relationshipStatus(status)
                            .build();
                })
                .toList();

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .content(userResponses)
                .build();
    }

    private RelationshipStatus determineRelationshipStatus(String userId,
                                                           List<String> friendIds,
                                                           List<String> sentRequestIds,
                                                           List<String> receivedRequestIds) {

        if (friendIds.contains(userId)) {
            return RelationshipStatus.FRIEND;
        } else if (sentRequestIds.contains(userId)) {
            return RelationshipStatus.FRIEND_REQUEST_SENT;
        } else if (receivedRequestIds.contains(userId)) {
            return RelationshipStatus.FRIEND_REQUEST_RECEIVED;
        } else {
            return RelationshipStatus.NONE;
        }
    }


}
