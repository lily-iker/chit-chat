package chitchat.mapper;

import chitchat.dto.response.user.UserInfoResponse;
import chitchat.dto.response.user.UserProfileResponse;
import chitchat.dto.response.user.UserSearchResponse;
import chitchat.model.User;
import chitchat.utils.MediaUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class UserMapper {

    private final MediaUtils mediaUtils;

    public UserInfoResponse toUserInfoResponse(User user) {
        return UserInfoResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .profileImageUrl(mediaUtils.resolveMediaUrl(user.getProfileImageUrl()))
                .bio(user.getBio())
                .email(user.getEmail())
                .username(user.getUsername())
                .emailVerified(user.getEmailVerified())
                .profileCompleted(user.getProfileCompleted())
                .role(user.getRole())
                .build();
    }

    public UserProfileResponse toUserProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .profileImageUrl(mediaUtils.resolveMediaUrl(user.getProfileImageUrl()))
                .build();
    }

    public List<UserSearchResponse> resolveProfileImageUrls(List<UserSearchResponse> responses) {
        return responses.stream()
                .map(response -> {
                    String profileImageUrl = response.getProfileImageUrl();
                    if (profileImageUrl != null && !profileImageUrl.isEmpty()) {
                        response.setProfileImageUrl(mediaUtils.resolveMediaUrl(profileImageUrl));
                    }
                    return response;
                })
                .toList();
    }
}
