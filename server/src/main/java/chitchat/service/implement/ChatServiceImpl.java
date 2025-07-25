package chitchat.service.implement;

import chitchat.constant.WebSocketDestination;
import chitchat.dto.request.chat.CreateChatRequest;
import chitchat.dto.request.chat.UpdateChatRequest;
import chitchat.dto.request.event.TypingEventRequest;
import chitchat.dto.response.PageResponse;
import chitchat.dto.response.chat.ChatResponse;
import chitchat.dto.response.message.MessageReadInfoResponse;
import chitchat.dto.response.message.MessageResponse;
import chitchat.exception.InvalidDataException;
import chitchat.exception.NoPermissionException;
import chitchat.exception.ResourceNotFoundException;
import chitchat.mapper.ChatMapper;
import chitchat.mapper.MessageMapper;
import chitchat.model.*;
import chitchat.model.enumeration.MessageType;
import chitchat.model.security.CustomUserDetails;
import chitchat.repository.*;
import chitchat.service.MinioService;
import chitchat.service.interfaces.ChatService;
import chitchat.service.interfaces.NotificationService;
import chitchat.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private static final int PRIVATE_CHAT_PARTICIPANTS = 2;
    private static final int MIN_GROUP_CHAT_PARTICIPANTS = 3;
    private static final int MAX_GROUP_CHAT_PARTICIPANTS = 100;
    private static final int MIN_GROUP_CHAT_ADMINS = 1;

    private final ChatRepository chatRepository;
    private final ChatMapper chatMapper;
    private final UserRepository userRepository;
    private final UserService userService;
    private final MessageRepository messageRepository;
    private final ChatJoinInfoRepository chatJoinInfoRepository;
    private final MessageReadInfoRepository messageReadInfoRepository;
    private final MessageMapper messageMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final MinioService minioService;

    @Override
    @Transactional
    public ChatResponse createChat(CreateChatRequest createChatRequest, MultipartFile chatImageFile) throws Exception {

        if (createChatRequest.getParticipants().size() < PRIVATE_CHAT_PARTICIPANTS) {
            throw new InvalidDataException("A chat must have at least " + PRIVATE_CHAT_PARTICIPANTS + " participants");
        }

        if (createChatRequest.getParticipants().size() > MAX_GROUP_CHAT_PARTICIPANTS) {
            throw new InvalidDataException("A chat cannot have more than " + MAX_GROUP_CHAT_PARTICIPANTS + " participants");
        }

        CustomUserDetails currentUser = userService.getCurrentUser();

        // Ensure the current user is in the participants list
        if (!createChatRequest.getParticipants().contains(currentUser.getUser().getId())) {
            throw new InvalidDataException("You must be a participant of the chat");
        }

        // Ensure the participants list does not contain duplicates
        Set<String> uniqueParticipants = new HashSet<>(createChatRequest.getParticipants());
        if (uniqueParticipants.size() != createChatRequest.getParticipants().size()) {
            throw new InvalidDataException("Participants list contains duplicates");
        }

        // Check if the chat is a private chat
        // If there are only 2 participants, we can consider it a private chat
        if (createChatRequest.getParticipants().size() == 2) {
            Optional<Chat> existingPrivateChatOpt = chatRepository.findPrivateChatByParticipants(createChatRequest.getParticipants());

            if (existingPrivateChatOpt.isPresent()) {
                return chatMapper.toChatResponse(currentUser, existingPrivateChatOpt.get());
            }
            else {
                Chat newPrivateChat = Chat.builder()
                        .participants(createChatRequest.getParticipants())
                        .isGroupChat(false)
                        .build();
                newPrivateChat.setCreatedBy(currentUser.getUser().getId());
                chatRepository.save(newPrivateChat);

                Message initMessage = Message.builder()
                        .chatId(newPrivateChat.getId())
                        .messageType(MessageType.SYSTEM)
                        .content("You can now chat with each other")
                        .build();
                messageRepository.save(initMessage);

                updateChatLastMessage(newPrivateChat, initMessage, null);

                // Save chat join info for all participants
                saveChatJoinInfo(newPrivateChat, currentUser, createChatRequest.getParticipants());

                return chatMapper.toChatResponse(currentUser, newPrivateChat);
            }
        }

        // Group chat
        Chat newGroupChat = Chat.builder()
                .name(createChatRequest.getName())
                .participants(createChatRequest.getParticipants())
                .admins(createChatRequest.getAdmins())
                .isGroupChat(true)
                .build();
        newGroupChat.setCreatedBy(currentUser.getUser().getId());

        if (chatImageFile != null) {
            String chatImageUrl = minioService.uploadFileToPublicBucket(chatImageFile);
            newGroupChat.setChatImageUrl(chatImageUrl);
        }

        chatRepository.save(newGroupChat);

        Message initMessage = Message.builder()
                .chatId(newGroupChat.getId())
                .messageType(MessageType.SYSTEM)
                .content("New group chat created by " + currentUser.getUser().getFullName())
                .build();
        messageRepository.save(initMessage);

        updateChatLastMessage(newGroupChat, initMessage, null);

        // Save chat join info for all participants
        saveChatJoinInfo(newGroupChat, currentUser, createChatRequest.getParticipants());

        return chatMapper.toChatResponse(currentUser, newGroupChat);
    }

    @Override
    public ChatResponse getChat(String chatId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        CustomUserDetails currentUser = userService.getCurrentUser();

        return chatMapper.toChatResponse(currentUser, chat);
    }

    @Override
    @Transactional
    public ChatResponse updateChat(String chatId, UpdateChatRequest updateChatRequest, MultipartFile chatImageFile) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        CustomUserDetails currentUser = userService.getCurrentUser();

        // Check if the chat is a private chat
        if (!chat.getIsGroupChat()) {
            throw new InvalidDataException("You cannot update a private chat directly");
        }

        // Check if the chat is a group chat
        if (!chat.getParticipants().contains(currentUser.getUser().getId())) {
            throw new NoPermissionException("You do not have permission to update this chat.");
        }

        Message latestMessage = null;

        if (!updateChatRequest.getName().isEmpty()) {
            chat.setName(updateChatRequest.getName());

            // Create and save the system message for name update
            Message updateNameMessage = Message.builder()
                    .chatId(chat.getId())
                    .messageType(MessageType.SYSTEM)
                    .content(currentUser.getUser().getFullName() + " updated chat name to " + updateChatRequest.getName())
                    .build();
            latestMessage = messageRepository.save(updateNameMessage);
        }

        if (chatImageFile != null) {
            // TODO: upload image and set the URL
            String chatImageUrl = "new_image_url";
            chat.setChatImageUrl(chatImageUrl);

            // Create and save the system message for image update
            Message updateImageMessage = Message.builder()
                    .chatId(chat.getId())
                    .messageType(MessageType.SYSTEM)
                    .content(currentUser.getUser().getFullName() + " updated the chat image")
                    .build();
            latestMessage = messageRepository.save(updateImageMessage);
        }

        if (latestMessage != null) {
            chat.setLastMessageId(latestMessage.getId());
            chat.setLastMessageContent(latestMessage.getContent());
            chat.setLastMessageSenderId(currentUser.getUser().getId());
            chat.setLastMessageSenderName(currentUser.getUser().getFullName());
            chat.setLastMessageType(latestMessage.getMessageType());
            chat.setLastMessageTime(latestMessage.getCreatedAt());
        }

        chatRepository.save(chat);
        return chatMapper.toChatResponse(currentUser, chat);
    }

    @Override
    @Transactional
    // TODO: enhance this : async
    public void deleteChat(String chatId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        CustomUserDetails currentUser = userService.getCurrentUser();

        // Check if the chat is a private chat
        if (!chat.getIsGroupChat()) {
            if (chat.getParticipants().isEmpty()) {
                throw new InvalidDataException("Chat participants cannot be empty");
            }
            if (!chat.getParticipants().contains(currentUser.getUser().getId())) {
                throw new NoPermissionException("You do not have permission to delete this private chat");
            }
        }

        // Check if the chat is a group chat
        if (chat.getIsGroupChat()) {
            if (chat.getAdmins().isEmpty()) {
                throw new InvalidDataException("Chat admins cannot be empty");
            }
            if (!chat.getAdmins().contains(currentUser.getUser().getId())){
                throw new NoPermissionException("You are not an admin of this group chat");
            }
        }

        // Softly delete the chat
        chat.setIsDeleted(true);
        chat.setDeletedBy(currentUser.getUser().getId());
        chatRepository.save(chat);

        // Softly delete all messages in the chat
        List<Message> messages = messageRepository.findByChatId(chatId);
        messages.forEach(message -> message.setIsDeleted(true));
        messageRepository.saveAll(messages);
    }

    @Override
    @Transactional
    public void addParticipantsToChat(String chatId, List<String> userIds) {

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        CustomUserDetails currentUser = userService.getCurrentUser();

        // Check if the chat is a private chat
        if (!chat.getIsGroupChat()) {
            throw new InvalidDataException("You cannot add participants to a private chat");
        }

        // Check if the chat is a group chat
        if (!chat.getParticipants().contains(currentUser.getUser().getId())) {
            throw new NoPermissionException("You do not have permission to add participants to this group chat");
        }

        // Remove already existing participants from userIds
        List<String> existingParticipants = chat.getParticipants();
        List<String> newParticipants = userIds.stream()
                .filter(userId -> !existingParticipants.contains(userId))
                .toList();

        if (newParticipants.isEmpty()) {
            throw new InvalidDataException("All specified users are already participants in the chat");
        }

        // Check if adding the new participants exceeds the limit
        int totalAfterAddition = existingParticipants.size() + newParticipants.size();
        if (totalAfterAddition > MAX_GROUP_CHAT_PARTICIPANTS) {
            throw new InvalidDataException("Cannot add participants: Group chat cannot exceed " + MAX_GROUP_CHAT_PARTICIPANTS + " participants");
        }

        chat.getParticipants().addAll(newParticipants);
//        or
//        List<String> updatedParticipants = new ArrayList<>(chat.getParticipants());
//        updatedParticipants.addAll(newParticipants);
//        chat.setParticipants(updatedParticipants);

        List<User> users = userRepository.findAllById(newParticipants);

        String newParticipantNames = users.stream()
                .map(User::getFullName)
                .filter(fullName -> !fullName.trim().isEmpty())
                .collect(Collectors.joining(", "));

        // Create and save the system message for adding participants
        Message addParticipantsMessage = Message.builder()
                .chatId(chat.getId())
                .messageType(MessageType.SYSTEM)
                .content(currentUser.getUser().getFullName()
                        + " added " + newParticipants.size()
                        + " new participants: " + newParticipantNames
                )
                .build();
        messageRepository.save(addParticipantsMessage);

        chat.setLastMessageId(addParticipantsMessage.getId());
        chat.setLastMessageContent(addParticipantsMessage.getContent());
        chat.setLastMessageSenderId(currentUser.getUser().getId());
        chat.setLastMessageSenderName(currentUser.getUser().getFullName());
        chat.setLastMessageType(addParticipantsMessage.getMessageType());
        chat.setLastMessageTime(addParticipantsMessage.getCreatedAt());

        chatRepository.save(chat);

        // Save chat join info for all new participants
        saveChatJoinInfo(chat, currentUser, newParticipants);
    }

    @Override
    @Transactional
    public void removeParticipantFromChat(String chatId, String targetUserId) {

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        CustomUserDetails currentUser = userService.getCurrentUser();
        String currentUserId = currentUser.getUser().getId();

        // Check if the chat is a private chat
        if (!chat.getIsGroupChat()) {
            throw new InvalidDataException("You cannot remove participants from a private chat");
        }

        // Ensure the chat has enough participants
        if (chat.getParticipants().size() == MIN_GROUP_CHAT_PARTICIPANTS) {
            throw new InvalidDataException("Cannot remove participant: Group chat must have at least " + MIN_GROUP_CHAT_PARTICIPANTS + " participants");
        }

        // Check if the current user is a participant in the chat
        if (!chat.getParticipants().contains(currentUserId)) {
            throw new NoPermissionException("You do not have permission to remove participants from this group chat.");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if the target user is in the chat
        if (!chat.getParticipants().contains(targetUserId)) {
            throw new InvalidDataException("User " + targetUser.getFullName() + " is not a participant of this chat");
        }

        // Don't allow removing yourself
        // if (userId.equals(currentUserId)) {
        //    throw new InvalidDataException("You cannot remove yourself from the chat");
        // }

        boolean targetIsAdmin = chat.getAdmins().contains(targetUserId);

        // Ensure the chat has enough admins
        if (targetIsAdmin && chat.getAdmins().size() == MIN_GROUP_CHAT_ADMINS) {
            throw new InvalidDataException("Cannot remove participant: Group chat must have at least " + MIN_GROUP_CHAT_ADMINS + " admin");
        }

        boolean isAdmin = chat.getAdmins().contains(currentUserId);
        boolean isAdder = chatJoinInfoRepository
                .findByChatIdAndAddedUserId(chatId, targetUserId)
                .map(info -> currentUserId.equals(info.getAddedBy()))
                .orElse(false);

        boolean canRemove = false;

        // Admins can remove anyone
        if (isAdmin) {
            canRemove = true;
        }
        // Non-admins can only remove users they added, if that user is not an admin
        else if (isAdder && !targetIsAdmin) {
            canRemove = true;
        }

        if (!canRemove) {
            throw new NoPermissionException("You do not have permission to remove user: " + targetUser.getFullName());
        }

        chat.getParticipants().remove(targetUserId);
        if (targetIsAdmin) chat.getAdmins().remove(targetUserId);

        Message removeParticipantMessage = Message.builder()
                .chatId(chat.getId())
                .messageType(MessageType.SYSTEM)
                .content(currentUser.getUser().getFullName() + " removed " + targetUser.getFullName())
                .build();
        messageRepository.save(removeParticipantMessage);

        chat.setLastMessageId(removeParticipantMessage.getId());
        chat.setLastMessageContent(removeParticipantMessage.getContent());
        chat.setLastMessageSenderId(currentUser.getUser().getId());
        chat.setLastMessageSenderName(currentUser.getUser().getFullName());
        chat.setLastMessageType(removeParticipantMessage.getMessageType());
        chat.setLastMessageTime(removeParticipantMessage.getCreatedAt());

        chatRepository.save(chat);

        deleteChatJoinInfo(chat, targetUserId);
    }

    @Override
    @Transactional
    public void promoteParticipantToAdmin(String chatId, String targetUserId) {

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        CustomUserDetails currentUser = userService.getCurrentUser();

        // Check if the chat is a private chat
        if (!chat.getIsGroupChat()) {
            throw new InvalidDataException("You cannot promote participants to admin in a private chat");
        }

        // Check if the chat is a group chat
        if (!chat.getAdmins().contains(currentUser.getUser().getId())) {
            throw new NoPermissionException("You do not have permission to promote participants to admin in this group chat");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if the target user is a participant
        if (!chat.getParticipants().contains(targetUserId)) {
            throw new InvalidDataException("User " + targetUser.getFullName() + " is not a participant of this chat");
        }

        // Check if the target user is already an admin
        if (chat.getAdmins().contains(targetUserId)) {
            throw new InvalidDataException("User " + targetUser.getFullName() + " is already an admin");
        }

        chat.getAdmins().add(targetUserId);

        Message promoteParticipantMessage = Message.builder()
                .chatId(chat.getId())
                .messageType(MessageType.SYSTEM)
                .content(currentUser.getUser().getFullName() + " promoted " + targetUser.getFullName() + " to admin")
                .build();
        messageRepository.save(promoteParticipantMessage);

        chat.setLastMessageId(promoteParticipantMessage.getId());
        chat.setLastMessageContent(promoteParticipantMessage.getContent());
        chat.setLastMessageSenderId(currentUser.getUser().getId());
        chat.setLastMessageSenderName(currentUser.getUser().getFullName());
        chat.setLastMessageType(promoteParticipantMessage.getMessageType());
        chat.setLastMessageTime(promoteParticipantMessage.getCreatedAt());

        chatRepository.save(chat);
    }

    @Override
    @Transactional
    public void demoteAdminToParticipant(String chatId, String targetUserId) {

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        CustomUserDetails currentUser = userService.getCurrentUser();

        // Check if the chat is a private chat
        if (!chat.getIsGroupChat()) {
            throw new InvalidDataException("You cannot demote admins to participants in a private chat");
        }

        // Check if the chat is a group chat
        if (!chat.getAdmins().contains(currentUser.getUser().getId())) {
            throw new NoPermissionException("You do not have permission to demote admins to participants in this group chat.");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if the target user is a participant
        if (!chat.getParticipants().contains(targetUserId)) {
            throw new InvalidDataException("User " + targetUser.getFullName() + " is not a participant of this chat");
        }

        // Check if the target user is not an admin
        if (!chat.getAdmins().contains(targetUserId)) {
            throw new InvalidDataException("User " + targetUser.getFullName() + " is not an admin");
        }

        chat.getAdmins().remove(targetUserId);

        Message demoteAdminMessage = Message.builder()
                .chatId(chat.getId())
                .messageType(MessageType.SYSTEM)
                .content(currentUser.getUser().getFullName() + " demoted " + targetUser.getFullName() + " to participant")
                .build();
        messageRepository.save(demoteAdminMessage);

        chat.setLastMessageId(demoteAdminMessage.getId());
        chat.setLastMessageContent(demoteAdminMessage.getContent());
        chat.setLastMessageSenderId(currentUser.getUser().getId());
        chat.setLastMessageSenderName(currentUser.getUser().getFullName());
        chat.setLastMessageType(demoteAdminMessage.getMessageType());
        chat.setLastMessageTime(demoteAdminMessage.getCreatedAt());

        chatRepository.save(chat);
    }

    @Override
    public PageResponse<?> getMyChats(int pageNumber,
                                      int pageSize,
                                      String sortBy,
                                      String sortDirection,
                                      String beforeChatId) {
        CustomUserDetails currentUser = userService.getCurrentUser();
        String currentUserId = currentUser.getUser().getId();

        if (pageNumber < 1) {
            throw new IllegalArgumentException("Page number must be greater than or equal to 1");
        }

        sortDirection = sortDirection == null || sortDirection.isEmpty() ? "DESC" : sortDirection.toUpperCase();
        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy != null ? sortBy : "updatedAt");

        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize, sort);

        Page<Chat> chatPage;

        if (beforeChatId != null && !beforeChatId.isEmpty()) {
            // Get the timestamp of the reference chat
            Chat referenceChat = chatRepository.findById(beforeChatId)
                    .orElseThrow(() -> new ResourceNotFoundException("Reference message not found"));

            // Find chats updated before the reference chat
            chatPage = chatRepository.findByParticipantIdAndUpdatedAtBefore(
                    currentUserId, referenceChat.getUpdatedAt(), pageable);
        } else {
            // First page load
            chatPage = chatRepository.findByParticipantId(currentUserId, pageable);
        }

        List<ChatResponse> chatResponses = chatPage.getContent().stream()
                .map(chat -> chatMapper.toOverviewChatResponse(currentUser, chat))
                .toList();

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(chatPage.getTotalElements())
                .totalPages(chatPage.getTotalPages())
                .content(chatResponses)
                .build();
    }

    @Override
    // TODO: enhance this
    public PageResponse<?> getChatMessages(String chatId,
                                           int pageNumber,
                                           int pageSize,
                                           String sortBy,
                                           String sortDirection,
                                           String beforeMessageId) {

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        CustomUserDetails currentUser = userService.getCurrentUser();

        if (!chat.getParticipants().contains(currentUser.getUser().getId())) {
            throw new NoPermissionException("You do not have permission to view messages in this chat");
        }

        if (pageNumber < 1) {
            throw new IllegalArgumentException("Page number must be greater than or equal to 1");
        }

        sortDirection = sortDirection == null || sortDirection.isEmpty() ? "DESC" : sortDirection.toUpperCase();
        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy != null ? sortBy : "createdAt");

        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize, sort);

        Page<Message> messagePage;

        if (beforeMessageId != null && !beforeMessageId.isEmpty()) {
            // Get the timestamp of the reference message
            Message referenceMessage = messageRepository.findById(beforeMessageId)
                    .orElseThrow(() -> new ResourceNotFoundException("Reference message not found"));

            // Find messages older than the reference message
            messagePage = messageRepository.findByChatIdAndCreatedAtBefore(
                    chatId, referenceMessage.getCreatedAt(), pageable);
        } else {
            // First page load
            messagePage = messageRepository.findByChatId(chatId, pageable);
        }

        List<MessageResponse> messageResponses = messageMapper.toMessageResponseList(messagePage.getContent().reversed());

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(messagePage.getTotalElements())
                .totalPages(messagePage.getTotalPages())
                .content(messageResponses)
                .build();
    }

    @Override
    @Transactional
    public void markLastMessageAsSeen(String chatId) {

        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        CustomUserDetails currentUser = userService.getCurrentUser();
        String senderId = currentUser.getUser().getId();

        if (messageReadInfoRepository.existsByMessageIdAndUserId(chat.getLastMessageId(), senderId)) {
            return;
        }

        MessageReadInfo info = MessageReadInfo.builder()
                .messageId(chat.getLastMessageId())
                .chatId(chatId)
                .userId(senderId)
                .readAt(Instant.now())
                .build();
        messageReadInfoRepository.save(info);

        MessageReadInfoResponse readInfoResponse = MessageReadInfoResponse.builder()
                .userId(info.getUserId())
                .readAt(info.getReadAt())
                .build();

        messagingTemplate.convertAndSend(WebSocketDestination.CHAT_TOPIC_PREFIX + chatId, readInfoResponse);
    }

    @Async
    @Override
    public void handleTypingEvent(TypingEventRequest typingEventRequest) {
        messagingTemplate.convertAndSend(WebSocketDestination.CHAT_TOPIC_PREFIX + typingEventRequest.getChatId(), typingEventRequest);

        Chat chat = chatRepository.findById(typingEventRequest.getChatId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        // Notify all other participants (excluding sender)
        for (String participantId : chat.getParticipants()) {
            if (!participantId.equals(typingEventRequest.getUserId())) {
                notificationService.sendNotification(
                        WebSocketDestination.USER_NOTIFICATION_PREFIX + participantId,
                        typingEventRequest
                );
            }
        }
    }

    @Async
    @Override
    public void updateChatLastMessage(Chat chat, Message lastMessage, User sender) {
        chat.setLastMessageId(lastMessage.getId());
        chat.setLastMessageContent(lastMessage.getContent());
        chat.setLastMessageType(lastMessage.getMessageType());
        chat.setLastMessageTime(lastMessage.getCreatedAt());
        if (sender != null) {
            chat.setLastMessageSenderId(sender.getId());
            chat.setLastMessageSenderName(sender.getFullName());
        }

        chatRepository.save(chat);
    }

    private void saveChatJoinInfo(Chat chat, CustomUserDetails currentUser, List<String> participantIds) {
        List<ChatJoinInfo> chatJoinInfos = new ArrayList<>();

        for (String participantId : participantIds) {
            if (!participantId.equals(currentUser.getUser().getId())) {
                ChatJoinInfo chatJoinInfo = ChatJoinInfo.builder()
                        .chatId(chat.getId())
                        .addedBy(currentUser.getUser().getId())
                        .addedUserId(participantId)
                        .build();
                chatJoinInfos.add(chatJoinInfo);
            }
        }

        if (!chatJoinInfos.isEmpty()) {
            chatJoinInfoRepository.saveAll(chatJoinInfos);
        }
    }

    private void deleteChatJoinInfo(Chat chat, String targetUserId) {
        Optional<ChatJoinInfo> chatJoinInfo =
                chatJoinInfoRepository.findByChatIdAndAddedUserId(chat.getId(), targetUserId);

        chatJoinInfo.ifPresent(chatJoinInfoRepository::delete);
    }
}
