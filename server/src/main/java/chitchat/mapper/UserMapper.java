package chitchat.mapper;

import chitchat.dto.response.user.UserInfoResponse;
import chitchat.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    @Value("${minio.url}")
    private String mediaBaseUrl;

    public UserInfoResponse toUserInfoResponse(User user) {
        String profileImageUrl = user.getProfileImageUrl();
        if (profileImageUrl != null && !profileImageUrl.isEmpty()) {
            profileImageUrl = mediaBaseUrl + "/" + profileImageUrl;
        }

        return UserInfoResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .profileImageUrl(profileImageUrl)
                .bio(user.getBio())
                .email(user.getEmail())
                .username(user.getUsername())
                .emailVerified(user.getEmailVerified())
                .profileCompleted(user.getProfileCompleted())
                .role(user.getRole())
                .build();
    }
}
