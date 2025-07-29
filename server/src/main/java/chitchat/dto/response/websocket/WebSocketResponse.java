package chitchat.dto.response.websocket;

import chitchat.model.enumeration.ChatEvent;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WebSocketResponse<T> {
    private ChatEvent event;
    private T data;
}