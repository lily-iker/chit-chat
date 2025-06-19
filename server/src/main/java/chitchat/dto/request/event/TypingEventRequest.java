package chitchat.dto.request.event;

import chitchat.dto.request.event.enumeration.TypingEvent;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TypingEventRequest {
    private TypingEvent type;
    private String userId;
    private String chatId;
}
