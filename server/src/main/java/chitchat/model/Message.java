package chitchat.model;

import chitchat.model.auditing.AbstractAuditingDocument;
import chitchat.model.enumeration.MediaType;
import chitchat.model.enumeration.MessageType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "messages")
public class Message extends AbstractAuditingDocument {

    @Id
    private String id;

    private String content;

    private String senderId;

    private String chatId;

    private MessageType messageType;

    private MediaType mediaType;

    private String mediaUrl;

    private String replyToMessageId; // ID of the message being replied to

    private String replyToMessageContent; // Content of the message being replied to

    private String replyToMessageSenderId; // ID of the sender of the message being replied to

    private String replyToMessageSenderName; // Name of the sender of the message being replied to

    private Boolean isEdited; // Flag to indicate if the message is edited

    private Boolean isDeleted; // Flag to indicate if the message is deleted
}
