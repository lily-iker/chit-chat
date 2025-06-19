package chitchat.service.implement;

import chitchat.dto.request.user.UserInfoRequest;
import chitchat.dto.response.PageResponse;
import chitchat.dto.response.user.UserInfoResponse;
import chitchat.dto.response.user.UserSearchResponse;
import chitchat.exception.AuthenticationException;
import chitchat.model.User;
import chitchat.model.enumeration.RelationshipStatus;
import chitchat.model.security.CustomUserDetails;
import chitchat.repository.UserNodeRepository;
import chitchat.repository.UserRepository;
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
    public UserInfoResponse setUpMyBasicInfo(UserInfoRequest userInfoRequest, MultipartFile profileImageFile) {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        CustomUserDetails userDetails = (CustomUserDetails) securityContext.getAuthentication().getPrincipal();

        User user = userDetails.getUser();

        user.setFullName(userInfoRequest.getFullName());
        user.setBio(userInfoRequest.getBio());

        // TODO: upload image then set the image URL

        user.setProfileCompleted(true);
        userRepository.save(user);

        // TODO: return the image URL and fullName in user in the response
        return UserInfoResponse.builder()
                .id(userDetails.getUser().getId())
                .fullName(userDetails.getUser().getFullName())
                .profileImageUrl(userDetails.getUser().getProfileImageUrl())
                .bio(userDetails.getUser().getBio())
                .email(userDetails.getUser().getEmail())
                .username(userDetails.getUser().getUsername())
                .emailVerified(userDetails.getUser().getEmailVerified())
                .profileCompleted(userDetails.getUser().getProfileCompleted())
                .role(userDetails.getUser().getRole())
                .build();
    }

    @Override
    public UserInfoResponse getMyInfo() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        CustomUserDetails userDetails = (CustomUserDetails) securityContext.getAuthentication().getPrincipal();

        return UserInfoResponse.builder()
                .id(userDetails.getUser().getId())
                .fullName(userDetails.getUser().getFullName())
                .profileImageUrl(userDetails.getUser().getProfileImageUrl())
                .bio(userDetails.getUser().getBio())
                .email(userDetails.getUser().getEmail())
                .username(userDetails.getUser().getUsername())
                .emailVerified(userDetails.getUser().getEmailVerified())
                .profileCompleted(userDetails.getUser().getProfileCompleted())
                .role(userDetails.getUser().getRole())
                .build();
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
