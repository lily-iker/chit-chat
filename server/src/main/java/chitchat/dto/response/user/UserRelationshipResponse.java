package chitchat.dto.response.user;

import lombok.Builder;
import lombok.Getter;

import java.io.Serializable;
import java.util.Set;

@Getter
@Builder
public class UserRelationshipResponse implements Serializable {
    private Set<String> friends;
    private Set<String> sentRequests;
    private Set<String> receivedRequests;
    private Set<String> blocked;
    private Set<String> blockedBy;
}