package chitchat.dto.response.chat;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatParticipantInfoResponse {
    private String id;
    private String fullName;
    private String profileImageUrl;
}
