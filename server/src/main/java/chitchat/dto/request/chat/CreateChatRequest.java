package chitchat.dto.request.chat;

import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CreateChatRequest {
    @Size(min = 1, max = 100, message = "Chat name must be between 1 and 100 characters")
    private String name;
    @Size(min = 2, max = 100, message = "Participants must be between 2 and 100")
    private List<String> participants;
    private List<String> admins;
}
