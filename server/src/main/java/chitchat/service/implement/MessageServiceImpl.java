package chitchat.service.implement;

import chitchat.constant.WebSocketDestination;
import chitchat.dto.request.message.SendMessageRequest;
import chitchat.dto.response.message.MessageResponse;
import chitchat.exception.NoPermissionException;
import chitchat.mapper.MessageMapper;
import chitchat.model.Chat;
import chitchat.model.Message;
import chitchat.model.enumeration.MessageType;
import chitchat.model.security.CustomUserDetails;
import chitchat.repository.ChatRepository;
import chitchat.repository.MessageRepository;
import chitchat.service.MinioService;
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
    private final MinioService minioService;

    @Override
    @Transactional
    public MessageResponse sendMessage(SendMessageRequest sendMessageRequest, MultipartFile mediaFile) throws Exception {

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
            String mediaUrl = minioService.uploadFileToPrivateBucket(mediaFile);
            message.setMediaUrl(mediaUrl);
            message.setMessageType(getMessageTypeFromFile(mediaFile));
        }
        else if (sendMessageRequest.getMediaUrl() != null && !sendMessageRequest.getMediaUrl().isEmpty()) {
            message.setMediaUrl(sendMessageRequest.getMediaUrl());
            message.setMessageType(MessageType.GIF);
        }
        else {
            message.setMessageType(MessageType.TEXT);
        }
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

    private MessageType getMessageTypeFromFile(MultipartFile mediaFile) {
        String mediaType = mediaFile.getContentType();
        MessageType messageType = MessageType.TEXT;

        if (mediaType != null) {
            if (mediaType.startsWith("image")) {
                if (mediaType.equalsIgnoreCase("image/gif")) {
                    messageType = MessageType.GIF;
                }
                else {
                    messageType = MessageType.IMAGE;
                }
            }
            else if (mediaType.startsWith("video")) {
                messageType = MessageType.VIDEO;
            }
            else if (mediaType.startsWith("audio")) {
                messageType = MessageType.AUDIO;
            }
            else {
                throw new RuntimeException("Unsupported media type: " + mediaType);
            }
        }

        return messageType;
    }
}
