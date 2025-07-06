package chitchat.dto.request.chat;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CreateChatRequest {
    @NotNull(message = "Chat name must not be null")
    @Size(min = 1, max = 100, message = "Chat name must be between 1 and 100 characters")
    private String name;

    @NotEmpty(message = "Participants cannot be empty")
    @Size(min = 2, max = 100, message = "Participants must be between 2 and 100")
    private List<String> participants;

    @NotEmpty(message = "Admins cannot be empty")
    @Size(min = 1, max = 100, message = "Admins must be between 1 and 100")
    private List<String> admins;
}
