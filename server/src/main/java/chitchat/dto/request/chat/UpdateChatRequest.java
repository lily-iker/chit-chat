package chitchat.dto.request.chat;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UpdateChatRequest {
    private String name;
}
