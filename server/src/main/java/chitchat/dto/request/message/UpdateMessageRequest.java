package chitchat.dto.request.message;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UpdateMessageRequest {
    private String newContent;
}
