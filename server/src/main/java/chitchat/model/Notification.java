package chitchat.model;

import chitchat.model.auditing.AbstractAuditingDocument;
import chitchat.model.enumeration.NotificationType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "notifications")
public class Notification extends AbstractAuditingDocument {

    @Id
    private String id;

    private String userId;

    private NotificationType type;

    private String message;

    private String chatId;

    private String senderId; // ID of the user who triggered the notification

    private String senderName; // Name of the user who triggered the notification

    private Boolean isRead; // Flag to indicate if the notification has been read
}
