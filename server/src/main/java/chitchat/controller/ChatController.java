package chitchat.controller;

import chitchat.dto.request.chat.CreateChatRequest;
import chitchat.dto.request.chat.UpdateChatRequest;
import chitchat.dto.request.event.TypingEventRequest;
import chitchat.dto.request.message.MessageRequest;
import chitchat.dto.response.ApiResponse;
import chitchat.model.enumeration.MediaType;
import chitchat.model.enumeration.MessageType;
import chitchat.service.interfaces.ChatService;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/chats")
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final Cloudinary cloudinary;
    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<?> createChat(@RequestPart @Valid CreateChatRequest createChatRequest,
                                        @RequestPart(value = "chatImageFile", required = false) MultipartFile chatImageFile) {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Chat created successfully",
                        chatService.createChat(createChatRequest, chatImageFile)
                )
        );
    }

    @GetMapping("/{chatId}")
    public ResponseEntity<?> getChat(@PathVariable String chatId) {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Chat retrieved successfully",
                        chatService.getChat(chatId)
                )
        );
    }

    @PutMapping("/{chatId}")
    public ResponseEntity<?> updateChat(@PathVariable String chatId,
                                        @RequestPart @Valid UpdateChatRequest updateChatRequest,
                                        @RequestPart(value = "chatImageFile", required = false) MultipartFile chatImageFile) {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Chat updated successfully",
                        chatService.updateChat(chatId, updateChatRequest, chatImageFile)
                )
        );
    }

    @DeleteMapping("/{chatId}")
    public ResponseEntity<?> deleteChat(@PathVariable String chatId) {
        chatService.deleteChat(chatId);
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Chat deleted successfully")
        );
    }

    @GetMapping("my-chats")
    public ResponseEntity<?> getMyChats(@RequestParam(defaultValue = "1") int pageNumber,
                                        @RequestParam(defaultValue = "20") int pageSize,
                                        @RequestParam(defaultValue = "updatedAt") String sortBy,
                                        @RequestParam(defaultValue = "desc") String sortDirection,
                                        @RequestParam(required = false) String beforeChatId) {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "My chats retrieved successfully",
                        chatService.getMyChats(pageNumber, pageSize, sortBy, sortDirection, beforeChatId)
                )
        );
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<?> getChatMessages(@PathVariable String chatId,
                                             @RequestParam(defaultValue = "1") int pageNumber,
                                             @RequestParam(defaultValue = "20") int pageSize,
                                             @RequestParam(defaultValue = "createdAt") String sortBy,
                                             @RequestParam(defaultValue = "desc") String sortDirection,
                                             @RequestParam(required = false) String beforeMessageId) {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Chat messages retrieved successfully",
                        chatService.getChatMessages(chatId, pageNumber, pageSize, sortBy, sortDirection, beforeMessageId)
                )
        );
    }

    @PutMapping("/mark-as-read/{chatId}")
    public ResponseEntity<?> markLastMessageAsSeen(@PathVariable("chatId") String chatId) {
        chatService.markLastMessageAsSeen(chatId);
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Chat marked as read successfully"
                )
        );
    }

    @MessageMapping("/chat/{chatId}/typing")
    public void handleTypingEvent(@Payload TypingEventRequest typingEventRequest) {
        chatService.handleTypingEvent(typingEventRequest);
    }

    @MessageMapping("/sendMessage")
    public void sendMessage(@Payload MessageRequest message) {
        System.out.println("Received message: " + message.getContent());
        messagingTemplate.convertAndSend("/topic/" + message.getChatId(), message);
    }

    @PostMapping("/sendMessageWithMedia")
    public String sendMessageWithMedia(
            @RequestPart("messageRequest") MessageRequest messageRequest,
            @RequestPart(value = "file", required = false) MultipartFile file) {

        try {
            String mediaUrl = null;

            // Upload file to Cloudinary if present
            if (file != null && !file.isEmpty()) {
                // Determine media type based on file content type
                MediaType mediaType = null;
                String resourceType = "auto"; // Default to auto detection

                if (file.getContentType() != null) {
                    if (file.getContentType().startsWith("image/")) {
                        mediaType = MediaType.IMAGE;
                        resourceType = "image";
                    } else if (file.getContentType().startsWith("video/")) {
                        mediaType = MediaType.VIDEO;
                        resourceType = "video";
                    }
                }

                // Set media type in the message request
                messageRequest.setMediaType(mediaType);

                // Upload to Cloudinary
                Map uploadResult = cloudinary.uploader().upload(
                        file.getBytes(),
                        ObjectUtils.asMap(
                                "resource_type", resourceType,
                                "folder", "chitchat"
                        )
                );

                // Get secure URL from Cloudinary
                mediaUrl = (String) uploadResult.get("secure_url");

                // Update message type based on content
                if (messageRequest.getMessageType() == null) {
                    if (messageRequest.getContent() != null && !messageRequest.getContent().trim().isEmpty()) {
                        messageRequest.setMessageType(MessageType.TEXT_WITH_MEDIA);
                    } else {
                        messageRequest.setMessageType(MessageType.MEDIA);
                    }
                }
            } else {
                // If no file, ensure message type is TEXT
                messageRequest.setMessageType(MessageType.TEXT);
            }

            // Set media URL in the message
            messageRequest.setMediaUrl(mediaUrl);

            // Send message via WebSocket
            messagingTemplate.convertAndSend("/topic/" + messageRequest.getChatId(), messageRequest);

            // Return the media URL
            return mediaUrl != null ? mediaUrl : "";

        } catch (IOException e) {
            e.printStackTrace();
            return "Error uploading file: " + e.getMessage();
        }
    }
}