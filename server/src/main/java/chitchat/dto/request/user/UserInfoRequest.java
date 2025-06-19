package chitchat.dto.request.user;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserInfoRequest {
    private String fullName;
    private String bio;
}
