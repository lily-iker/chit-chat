package chitchat.service.implement;

import chitchat.constant.WebSocketDestination;
import chitchat.dto.request.message.SendMessageRequest;
import chitchat.dto.response.message.MessageResponse;
import chitchat.exception.NoPermissionException;
import chitchat.mapper.MessageMapper;
import chitchat.model.Chat;
import chitchat.model.Message;
import chitchat.model.security.CustomUserDetails;
import chitchat.repository.ChatRepository;
import chitchat.repository.MessageRepository;
import chitchat.service.interfaces.ChatService;
import chitchat.service.interfaces.MessageService;
import chitchat.service.interfaces.NotificationService;
import chitchat.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final ChatService chatService;
    private final UserService userService;
    private final MessageMapper messageMapper;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public MessageResponse sendMessage(SendMessageRequest sendMessageRequest, MultipartFile mediaFile) {

        Chat chat = chatRepository.findById(sendMessageRequest.getChatId())
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        CustomUserDetails currentUser = userService.getCurrentUser();
        String senderId = currentUser.getUser().getId();

        if (!chat.getParticipants().contains(senderId)) {
            throw new NoPermissionException("You are not a participant of this chat");
        }

        Message message = Message.builder()
                .chatId(sendMessageRequest.getChatId())
                .senderId(senderId)
                .content(sendMessageRequest.getContent())
                .build();

        if (mediaFile != null) {
            // TODO: upload the media file and get the URL
            String mediaUrl = "hehe";
            message.setMediaUrl(mediaUrl);
        }

        // TODO: handle message type and media type

        messageRepository.save(message);

        MessageResponse messageResponse = messageMapper.toMessageResponse(message);
        messageResponse.setSenderName(currentUser.getUser().getFullName());

        messagingTemplate.convertAndSend(WebSocketDestination.CHAT_TOPIC_PREFIX + sendMessageRequest.getChatId(), messageResponse);

        chatService.updateChatLastMessage(chat, message, currentUser.getUser());

        // Send notification to all participants
        for (String participantId : chat.getParticipants()) {
            if (!participantId.equals(senderId)) {
                notificationService.sendNotification(WebSocketDestination.USER_NOTIFICATION_PREFIX + participantId, messageResponse);
            }
        }

        return messageResponse;
    }
}
