package chitchat.mapper;

import chitchat.dto.response.chat.ChatParticipantInfoResponse;
import chitchat.dto.response.chat.ChatResponse;
import chitchat.exception.ResourceNotFoundException;
import chitchat.model.Chat;
import chitchat.model.MessageReadInfo;
import chitchat.model.User;
import chitchat.model.security.CustomUserDetails;
import chitchat.repository.MessageReadInfoRepository;
import chitchat.repository.MessageRepository;
import chitchat.repository.UserRepository;
import chitchat.utils.MediaUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ChatMapper {

    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final MessageReadInfoRepository messageReadInfoRepository;
    private final MediaUtils mediaUtils;

    public ChatResponse toChatResponse(CustomUserDetails currentUser, Chat chat) {
        ChatResponse chatResponse = ChatResponse.builder()
                .id(chat.getId())
                .name(chat.getName())
                .chatImageUrl(chat.getChatImageUrl())
                .isGroupChat(chat.getIsGroupChat())
                .lastMessageId(chat.getLastMessageId())
                // Only include content if the last message is not deleted
                .lastMessageContent(
                        Boolean.TRUE.equals(chat.getIsLastMessageDeleted())
                                ? null
                                : chat.getLastMessageContent()
                )
                .lastMessageSenderId(chat.getLastMessageSenderId())
                .lastMessageSenderName(chat.getLastMessageSenderName())
                .lastMessageType(chat.getLastMessageType())
                // Only include media URL if the last message is not deleted
                .lastMessageMediaUrl(
                        Boolean.TRUE.equals(chat.getIsLastMessageDeleted())
                                ? null
                                : chat.getLastMessageMediaUrl()
                )
                .lastMessageTime(chat.getLastMessageTime())
                .isLastMessageDeleted(chat.getIsLastMessageDeleted())
                .admins(chat.getAdmins())
                .createdAt(chat.getCreatedAt())
                .updatedAt(chat.getUpdatedAt())
                .createdBy(chat.getCreatedBy())
                .build();

        // If it's a one-on-one chat, extract other user info
        if (!chat.getIsGroupChat()) {
            String otherUserId = chat.getParticipants().stream()
                    .filter(id -> !id.equals(currentUser.getUser().getId()))
                    .findFirst()
                    .orElse(null);

            if (otherUserId != null) {
                User otherUser = userRepository.findById(otherUserId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + otherUserId));
                chatResponse.setName(otherUser.getFullName());
                chatResponse.setChatImageUrl(mediaUtils.resolveMediaUrl(otherUser.getProfileImageUrl()));

                List<ChatParticipantInfoResponse> participantDetails = List.of(
                        ChatParticipantInfoResponse.builder()
                                .id(currentUser.getUser().getId())
                                .fullName(currentUser.getUser().getFullName())
                                .profileImageUrl(mediaUtils.resolveMediaUrl(currentUser.getUser().getProfileImageUrl()))
                                .build(),
                        ChatParticipantInfoResponse.builder()
                                .id(otherUser.getId())
                                .fullName(otherUser.getFullName())
                                .profileImageUrl(mediaUtils.resolveMediaUrl(otherUser.getProfileImageUrl()))
                                .build()
                );
                chatResponse.setParticipantsInfo(participantDetails);
            }
        }
        // For group chats, fetch all participants
        else {
            List<User> participants = userRepository.findAllById(chat.getParticipants());

            List<ChatParticipantInfoResponse> participantDetails = participants.stream()
                    .map(user ->
                            ChatParticipantInfoResponse.builder()
                                    .id(user.getId())
                                    .fullName(user.getFullName())
                                    .profileImageUrl(mediaUtils.resolveMediaUrl(user.getProfileImageUrl()))
                                    .build())
                    .toList();

            chatResponse.setChatImageUrl(mediaUtils.resolveMediaUrl(chat.getChatImageUrl()));
            chatResponse.setParticipantsInfo(participantDetails);
        }

        return chatResponse;
    }

    public ChatResponse toOverviewChatResponse(CustomUserDetails currentUser, Chat chat) {
        ChatResponse chatResponse = ChatResponse.builder()
                .id(chat.getId())
                .name(chat.getName())
                .isGroupChat(chat.getIsGroupChat())
                .lastMessageId(chat.getLastMessageId())
                .lastMessageContent(
                        Boolean.TRUE.equals(chat.getIsLastMessageDeleted())
                                ? null
                                : chat.getLastMessageContent()
                )
                .lastMessageSenderId(chat.getLastMessageSenderId())
                .lastMessageSenderName(chat.getLastMessageSenderName())
                .lastMessageType(chat.getLastMessageType())
                .lastMessageMediaUrl(
                        Boolean.TRUE.equals(chat.getIsLastMessageDeleted())
                                ? null
                                : chat.getLastMessageMediaUrl()
                )
                .lastMessageTime(chat.getLastMessageTime())
                .isLastMessageDeleted(chat.getIsLastMessageDeleted())
                .createdAt(chat.getCreatedAt())
                .updatedAt(chat.getUpdatedAt())
                .build();

        // If it's a one-on-one chat, extract other user info
        if (!chat.getIsGroupChat()) {
            String otherUserId = chat.getParticipants().stream()
                    .filter(id -> !id.equals(currentUser.getUser().getId()))
                    .findFirst()
                    .orElse(null);

            if (otherUserId != null) {
                User otherUser = userRepository.findById(otherUserId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + otherUserId));
                chatResponse.setName(otherUser.getFullName());
                chatResponse.setChatImageUrl(mediaUtils.resolveMediaUrl(otherUser.getProfileImageUrl()));
            }
        }
        // For group chats, set the chat image URL if available
        else {
            chatResponse.setChatImageUrl(mediaUtils.resolveMediaUrl(chat.getChatImageUrl()));
        }

        MessageReadInfo lastReadInfo = messageReadInfoRepository
                .findFirstByChatIdAndUserIdOrderByReadAtDesc(chat.getId(), currentUser.getUser().getId())
                .orElse(null);

        long unreadCount;

        if (lastReadInfo == null || lastReadInfo.getMessageId() == null || lastReadInfo.getReadAt() == null) {
            unreadCount = messageRepository.countByChatIdExcludingUserId(chat.getId(), currentUser.getUser().getId());
        }
        else {
            unreadCount = messageRepository.countUnreadMessages(chat.getId(), lastReadInfo.getReadAt(), currentUser.getUser().getId());
        }

        chatResponse.setUnreadMessageCount((int) unreadCount);
        return chatResponse;
    }

}