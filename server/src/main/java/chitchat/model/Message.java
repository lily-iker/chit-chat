package chitchat.model;

import chitchat.model.auditing.AbstractAuditingDocument;
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

    private String mediaUrl;

    private String replyToMessageId;

    private String replyToMessageContent;

    private MessageType replyToMessageType;

    private String replyToMessageMediaUrl;

    private String replyToMessageSenderId;

    private Boolean isReplyMessageEdited;

    private Boolean isReplyMessageDeleted;

    @Builder.Default
    private Boolean isEdited = false;

    @Builder.Default
    private Boolean isDeleted = false;
}
