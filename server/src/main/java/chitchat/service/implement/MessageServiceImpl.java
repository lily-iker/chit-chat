package chitchat.service.implement;

import chitchat.constant.WebSocketDestination;
import chitchat.dto.request.message.SendMessageRequest;
import chitchat.dto.request.message.UpdateMessageRequest;
import chitchat.dto.response.message.MessageResponse;
import chitchat.dto.response.websocket.WebSocketResponse;
import chitchat.exception.NoPermissionException;
import chitchat.exception.ResourceNotFoundException;
import chitchat.mapper.MessageMapper;
import chitchat.model.Chat;
import chitchat.model.Message;
import chitchat.model.enumeration.ChatEvent;
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
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;

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
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        CustomUserDetails currentUser = userService.getCurrentUser();
        String currentUserId = currentUser.getUser().getId();

        if (!chat.getParticipants().contains(currentUserId)) {
            throw new NoPermissionException("You are not a participant of this chat");
        }

        Message replyToMessage = null;
        if (sendMessageRequest.getReplyToMessageId() != null) {
            replyToMessage = messageRepository.findById(sendMessageRequest.getReplyToMessageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Replied message not found"));

            if (!replyToMessage.getChatId().equals(sendMessageRequest.getChatId())) {
                throw new IllegalArgumentException("Replied message is not from this chat");
            }
        }

        Message message = Message.builder()
                .chatId(sendMessageRequest.getChatId())
                .senderId(currentUserId)
                .content(sendMessageRequest.getContent())
                .replyToMessageId(sendMessageRequest.getReplyToMessageId())
                .replyToMessageContent(replyToMessage != null ? replyToMessage.getContent() : null)
                .replyToMessageSenderId(replyToMessage != null ? replyToMessage.getSenderId() : null)
                .isReplyMessageDeleted(replyToMessage != null ? false : null)
                .isReplyMessageDeleted(replyToMessage != null ? false : null)
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

        WebSocketResponse<MessageResponse> webSocketResponse =
                new WebSocketResponse<>(ChatEvent.NEW_MESSAGE, messageResponse);

        messagingTemplate.convertAndSend(
                WebSocketDestination.CHAT_TOPIC_PREFIX + sendMessageRequest.getChatId(),
                webSocketResponse
        );

        chatService.updateChatLastMessage(chat, message, currentUser.getUser());

        // Send notification to all participants
        for (String participantId : chat.getParticipants()) {
            if (!participantId.equals(currentUserId)) {
                notificationService.sendNotification(
                        WebSocketDestination.USER_NOTIFICATION_PREFIX + participantId,
                        webSocketResponse
                );
            }
        }

        return messageResponse;
    }

    // Only allow update text messages
    @Override
    @Transactional
    public MessageResponse updateMessage(String messageId, UpdateMessageRequest updateMessageRequest) throws Exception {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        Chat chat = chatRepository.findById(message.getChatId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        CustomUserDetails currentUser = userService.getCurrentUser();
        String currentUserId = currentUser.getUser().getId();

        if (!chat.getParticipants().contains(currentUserId)) {
            throw new NoPermissionException("You are not a participant of this chat");
        }
        if (message.getMessageType() != MessageType.TEXT) {
            throw new IllegalArgumentException("Only text messages can be updated");
        }
        if (!message.getSenderId().equals(currentUserId)) {
            throw new NoPermissionException("You can only update your own messages");
        }
        if (message.getIsDeleted()) {
            throw new IllegalArgumentException("Cannot update a deleted message");
        }

        String newContent = updateMessageRequest.getNewContent();
        if (newContent != null && !newContent.isBlank()) {
            message.setContent(newContent);
            message.setIsEdited(true);
            messageRepository.save(message);
        }

        MessageResponse messageResponse = messageMapper.toMessageResponse(message);

        WebSocketResponse<MessageResponse> webSocketResponse =
                new WebSocketResponse<>(ChatEvent.MESSAGE_EDITED, messageResponse);

        // Update the last message in chat and send notification if this is the last message
        if (message.getId().equals(chat.getLastMessageId())) {
            chat.setLastMessageContent(message.getContent());
            chat.setLastMessageTime(Instant.now());
            chatRepository.save(chat);

            for (String participantId : chat.getParticipants()) {
                if (!participantId.equals(currentUserId)) {
                    notificationService.sendNotification(
                            WebSocketDestination.USER_NOTIFICATION_PREFIX + participantId,
                            webSocketResponse
                    );
                }
            }
        }

        messagingTemplate.convertAndSend(
                WebSocketDestination.CHAT_TOPIC_PREFIX + chat.getId(),
                webSocketResponse
        );

        return messageResponse;
    }

    @Override
    @Transactional
    public void deleteMessage(String messageId) throws Exception {

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        CustomUserDetails currentUser = userService.getCurrentUser();
        String currentUserId = currentUser.getUser().getId();

        if (!message.getSenderId().equals(currentUserId)) {
            throw new NoPermissionException("You can only delete your own messages");
        }
        if (message.getIsDeleted()) {
            throw new IllegalArgumentException("Message is already deleted");
        }

        message.setIsDeleted(true);
        messageRepository.save(message);

        markReplyMessagesAsDeleted(message.getId());

        MessageResponse messageResponse = messageMapper.toMessageResponse(message);

        WebSocketResponse<MessageResponse> webSocketResponse =
                new WebSocketResponse<>(ChatEvent.MESSAGE_DELETED, messageResponse);

        messagingTemplate.convertAndSend(
                WebSocketDestination.CHAT_TOPIC_PREFIX + message.getChatId(),
                webSocketResponse
        );

        Chat chat = chatRepository.findById(message.getChatId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        // Update the last message in chat and send notification if this is the last message
        if (message.getId().equals(chat.getLastMessageId())) {
            chat.setIsLastMessageDeleted(true);
            chat.setLastMessageTime(Instant.now());
            chatRepository.save(chat);

            for (String participantId : chat.getParticipants()) {
                if (!participantId.equals(currentUserId)) {
                    notificationService.sendNotification(
                            WebSocketDestination.USER_NOTIFICATION_PREFIX + participantId,
                            webSocketResponse
                    );
                }
            }
        }
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

    // TODO: update also like markReplyMessagesAsDeleted

    @Async
    // Mark all messages that reference the given message ID as deleted
    public void markReplyMessagesAsDeleted(String messageId) {
        List<Message> referencingMessages = messageRepository.findByReplyToMessageId(messageId);
        for (Message message : referencingMessages) {
            message.setIsReplyMessageDeleted(true);
        }
        messageRepository.saveAll(referencingMessages);
    }
}
