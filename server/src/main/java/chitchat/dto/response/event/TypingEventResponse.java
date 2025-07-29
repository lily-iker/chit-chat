package chitchat.dto.response.event;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TypingEventResponse {
    private String userId;
    private String chatId;
}
