package chitchat.dto.response.user;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserProfileResponse {
    private String id;
    private String fullName;
    private String profileImageUrl;
}
