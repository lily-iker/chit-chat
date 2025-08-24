package chitchat.dto.response.user;

import chitchat.model.enumeration.RelationshipStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class UserSearchResponse {
    private String id;
    private String fullName;
    private String profileImageUrl;
    private RelationshipStatus relationshipStatus;
}
