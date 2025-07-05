package chitchat.dto.request.message;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SendMessageRequest {
    private String chatId;
    private String senderId;
    private String content;
    private String mediaUrl;
}
