package chitchat.dto.response.user;

import lombok.*;

import java.io.Serializable;
import java.util.Set;

@Getter
@Setter
@Builder
public class UserRelationshipResponse implements Serializable {
    private Set<String> friends;
    private Set<String> sentRequests;
    private Set<String> receivedRequests;
    private Set<String> blocked;
    private Set<String> blockedBy;
}