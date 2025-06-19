package chitchat.dto.request.message;

import chitchat.model.enumeration.MediaType;
import chitchat.model.enumeration.MessageType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class MessageRequest {
    private String content;
    private String senderId;
    private String chatId;
    private MessageType messageType;
    private MediaType mediaType;
    private String mediaUrl; // Will be populated after Cloudinary upload
}
