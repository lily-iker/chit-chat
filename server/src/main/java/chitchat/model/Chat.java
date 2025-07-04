package chitchat.model;

import chitchat.model.auditing.AbstractAuditingDocument;
import chitchat.model.enumeration.MessageType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "chats")
public class Chat extends AbstractAuditingDocument {

    @Id
    private String id;

    private String name;

    private String chatImageUrl;

    private Boolean isGroupChat;

    private String lastMessageId;

    private String lastMessageContent;

    private String lastMessageSenderId;

    private String lastMessageSenderName;

    private MessageType lastMessageType;

    private String lastMessageMediaUrl;

    private Instant lastMessageTime;

    private List<String> participants;

    private List<String> admins;

    private Boolean isDeleted;

    private String deletedBy;
}
