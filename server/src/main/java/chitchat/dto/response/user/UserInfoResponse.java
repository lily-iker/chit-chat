package chitchat.dto.response.user;

import chitchat.model.enumeration.RoleName;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserInfoResponse {
    private String id;
    private String fullName;
    private String profileImageUrl;
    private String bio;
    private String email;
    private String username;
    private Boolean emailVerified;
    private Boolean profileCompleted;
    private RoleName role;
}
