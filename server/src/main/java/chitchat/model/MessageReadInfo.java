package chitchat.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "message_read_info")
public class MessageReadInfo {

    @Id
    private String id;

    private String messageId;

    private String chatId;

    private String userId;

    private Instant readAt;
}
