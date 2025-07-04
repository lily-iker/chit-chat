package chitchat.dto.response.chat;

import chitchat.model.enumeration.MessageType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
//@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatResponse {
    private String id;
    private String name;
    private String chatImageUrl;
    private Boolean isGroupChat;
    private String lastMessageContent;
    private String lastMessageSenderId;
    private String lastMessageSenderName;
    private MessageType lastMessageType;
    private String lastMessageMediaUrl;
    private Instant lastMessageTime;
    private List<String> admins;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private List<ChatParticipantInfoResponse> participantsInfo;
    private Integer unreadMessageCount;
}
