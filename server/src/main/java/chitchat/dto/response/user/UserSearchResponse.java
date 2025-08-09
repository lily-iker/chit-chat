package chitchat.dto.response.user;

import chitchat.model.enumeration.RelationshipStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserSearchResponse {
    private String id;
    private String fullName;
    private String profileImageUrl;
    private RelationshipStatus relationshipStatus;
}
