package chitchat.mapper;

import chitchat.dto.response.user.UserInfoResponse;
import chitchat.dto.response.user.UserProfileResponse;
import chitchat.model.User;
import chitchat.utils.MediaUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

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
}
