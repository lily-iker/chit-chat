package chitchat.model;

import chitchat.model.auditing.AbstractAuditingDocument;
import chitchat.model.enumeration.MediaType;
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

    private MediaType lastMessageMediaType; // Type of the last message's media, if any

    private String lastMessageMediaUrl; // URL of the last message's media, if any // not really needed

    private Instant lastMessageTime; // Timestamp of the last message

    private List<String> participants; // List of user IDs who are part of the chat

    private List<String> admins; // List of user IDs who are admins of the chat

    private Boolean isDeleted; // Flag to indicate if the chat is deleted

    private String deletedBy; // ID of the user who deleted the chat
}
