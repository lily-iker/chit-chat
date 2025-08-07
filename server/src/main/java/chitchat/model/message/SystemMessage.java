package chitchat.model.message;

import chitchat.model.enumeration.SystemMessageAction;
import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemMessage {
    private String actorId;
    private SystemMessageAction action;
    private Map<String, Object> metadata;
}
