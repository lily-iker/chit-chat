package chitchat.mapper;

import chitchat.dto.response.user.UserInfoResponse;
import chitchat.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserInfoResponse toUserInfoResponse(User user) {
        return UserInfoResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .profileImageUrl(user.getProfileImageUrl())
                .bio(user.getBio())
                .email(user.getEmail())
                .username(user.getUsername())
                .emailVerified(user.getEmailVerified())
                .profileCompleted(user.getProfileCompleted())
                .role(user.getRole())
                .build();
    }
}
