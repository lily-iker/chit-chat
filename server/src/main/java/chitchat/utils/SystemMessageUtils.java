package chitchat.utils;

import chitchat.model.message.SystemMessage;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;


@Component
@RequiredArgsConstructor
public class SystemMessageUtils {
    private final ObjectMapper objectMapper;

    public String convertToJson(SystemMessage msg) {
        try {
            return objectMapper.writeValueAsString(msg);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize system message", e);
        }
    }
}
