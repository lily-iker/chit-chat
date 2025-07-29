package chitchat.dto.response.message;

import chitchat.model.enumeration.MessageType;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
//@JsonInclude(JsonInclude.Include.NON_NULL)
public class MessageResponse {
    private String id;
    private String content;
    private String senderId;
    private String senderName;
    private String chatId;
    private MessageType messageType;
    private String mediaUrl;
    private String replyToMessageId;
    private String replyToMessageContent;
    private MessageType replyToMessageType;
    private String replyToMessageMediaUrl;
    private String replyToMessageSenderId;
    private Boolean isReplyMessageEdited;
    private Boolean isReplyMessageDeleted;
    private Boolean isEdited;
    private Boolean isDeleted;
    private Instant createdAt;
    private Instant updatedAt;
    private List<MessageReadInfoResponse> readInfo;
}
