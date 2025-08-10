package chitchat.dto.response.user;

import chitchat.model.enumeration.RelationshipStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserProfileResponse {
    private String id;
    private String fullName;
    private String profileImageUrl;
    private String bio;
    private RelationshipStatus status;
}
