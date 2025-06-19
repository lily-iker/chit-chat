package chitchat.dto.response.message;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class MessageReadInfoResponse {
    private String userId;
    private Instant readAt;
}
