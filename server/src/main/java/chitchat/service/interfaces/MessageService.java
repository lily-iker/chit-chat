package chitchat.service.interfaces;

import chitchat.dto.request.message.SendMessageRequest;
import chitchat.dto.request.message.UpdateMessageRequest;
import chitchat.dto.response.message.MessageResponse;
import org.springframework.web.multipart.MultipartFile;

public interface MessageService {
    MessageResponse sendMessage(SendMessageRequest sendMessageRequest, MultipartFile mediaFile) throws Exception;
    MessageResponse updateMessage(String messageId, UpdateMessageRequest updateMessageRequest) throws Exception;
    void deleteMessage(String messageId) throws Exception;
}
