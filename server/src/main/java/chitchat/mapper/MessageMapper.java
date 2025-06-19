package chitchat.mapper;

import chitchat.dto.response.message.MessageReadInfoResponse;
import chitchat.dto.response.message.MessageResponse;
import chitchat.model.Message;
import chitchat.model.MessageReadInfo;
import chitchat.repository.MessageReadInfoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class MessageMapper {

    private final MessageReadInfoRepository messageReadInfoRepository;

    public MessageResponse toMessageResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .chatId(message.getChatId())
                .content(message.getContent())
                .senderId(message.getSenderId())
                .messageType(message.getMessageType())
                .mediaType(message.getMediaType())
                .mediaUrl(message.getMediaUrl())
                .replyToMessageId(message.getReplyToMessageId())
                .replyToMessageContent(message.getReplyToMessageContent())
                .replyToMessageSenderId(message.getReplyToMessageSenderId())
                .replyToMessageSenderName(message.getReplyToMessageSenderName())
                .isEdited(message.getIsEdited())
                .isDeleted(message.getIsDeleted())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .build();
    }

    public List<MessageResponse> toMessageResponseList(List<Message> messages) {
        List<String> messageIds = messages.stream()
                .map(Message::getId)
                .toList();

        List<MessageReadInfo> allReadInfos = messageReadInfoRepository.findByMessageIdIn(messageIds);

        Map<String, List<MessageReadInfoResponse>> readInfoMap = allReadInfos.stream()
                .collect(Collectors.groupingBy(MessageReadInfo::getMessageId,
                        Collectors.mapping(readInfo -> MessageReadInfoResponse.builder()
                                .userId(readInfo.getUserId())
                                .readAt(readInfo.getReadAt())
                                .build(), Collectors.toList())));

        return messages.stream()
                .map(message -> MessageResponse.builder()
                        .id(message.getId())
                        .chatId(message.getChatId())
                        .content(message.getContent())
                        .senderId(message.getSenderId())
                        .messageType(message.getMessageType())
                        .mediaType(message.getMediaType())
                        .mediaUrl(message.getMediaUrl())
                        .replyToMessageId(message.getReplyToMessageId())
                        .replyToMessageContent(message.getReplyToMessageContent())
                        .replyToMessageSenderId(message.getReplyToMessageSenderId())
                        .replyToMessageSenderName(message.getReplyToMessageSenderName())
                        .isEdited(message.getIsEdited())
                        .isDeleted(message.getIsDeleted())
                        .createdAt(message.getCreatedAt())
                        .updatedAt(message.getUpdatedAt())
                        .readInfo(readInfoMap.getOrDefault(message.getId(), List.of()))
                        .build())
                .toList();
    }
}
