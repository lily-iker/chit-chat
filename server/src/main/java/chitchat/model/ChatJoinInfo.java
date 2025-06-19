package chitchat.model;

import chitchat.model.auditing.AbstractAuditingDocument;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "chat_join_info")
public class ChatJoinInfo extends AbstractAuditingDocument {

    @Id
    private String id;

    private String chatId;

    private String addedUserId;

    private String addedBy;
}
