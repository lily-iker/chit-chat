package chitchat.controller;

import chitchat.dto.request.chat.CreateChatRequest;
import chitchat.dto.request.chat.UpdateChatRequest;
import chitchat.dto.request.event.TypingEventRequest;
import chitchat.dto.response.ApiResponse;
import chitchat.service.interfaces.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/chats")
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<?> createChat(@RequestPart @Valid CreateChatRequest createChatRequest,
                                        @RequestPart(value = "chatImageFile", required = false) MultipartFile chatImageFile) throws Exception {
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

    @GetMapping("/{chatId}/overview")
    public ResponseEntity<?> getChatOverview(@PathVariable String chatId) {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Chat overview retrieved successfully",
                        chatService.getChatOverview(chatId)
                )
        );
    }

    @PutMapping("/{chatId}")
    public ResponseEntity<?> updateChat(@PathVariable String chatId,
                                        @RequestPart @Valid UpdateChatRequest updateChatRequest,
                                        @RequestPart(value = "chatImageFile", required = false) MultipartFile chatImageFile) throws Exception {
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

    @GetMapping("search-my-chats")
    public ResponseEntity<?> searchMyChats(@RequestParam String keyword,
                                           @RequestParam(defaultValue = "1") int pageNumber,
                                           @RequestParam(defaultValue = "20") int pageSize,
                                           @RequestParam(defaultValue = "updatedAt") String sortBy,
                                           @RequestParam(defaultValue = "desc") String sortDirection) {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "My chats searched successfully",
                        chatService.searchMyChats(keyword, pageNumber, pageSize, sortBy, sortDirection)
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

}