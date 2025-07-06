package chitchat.service.interfaces;

import chitchat.dto.request.chat.CreateChatRequest;
import chitchat.dto.request.chat.UpdateChatRequest;
import chitchat.dto.request.event.TypingEventRequest;
import chitchat.dto.response.PageResponse;
import chitchat.dto.response.chat.ChatResponse;
import chitchat.model.Chat;
import chitchat.model.Message;
import chitchat.model.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ChatService {
    ChatResponse createChat(CreateChatRequest createChatRequest, MultipartFile chatImageFile) throws Exception;
    ChatResponse getChat(String chatId);
    ChatResponse updateChat(String chatId, UpdateChatRequest updateChatRequest, MultipartFile chatImageFile);
    void deleteChat(String chatId);
    void addParticipantsToChat(String chatId, List<String> userIds);
    void removeParticipantFromChat(String chatId, String targetUserId);
    void promoteParticipantToAdmin(String chatId, String targetUserId);
    void demoteAdminToParticipant(String chatId, String targetUserId);
    PageResponse<?> getMyChats(int pageNumber, int pageSize, String sortBy, String sortDirection, String beforeChatId);
    PageResponse<?> getChatMessages(String chatId, int pageNumber, int pageSize, String sortBy, String sortDirection, String beforeMessageId);
    void markLastMessageAsSeen(String chatId);
    void handleTypingEvent(TypingEventRequest typingEventRequest);

    void updateChatLastMessage(Chat chat, Message lastMessage, User sender);
}
