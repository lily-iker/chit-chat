package chitchat.controller;

import chitchat.dto.request.message.SendMessageRequest;
import chitchat.dto.request.message.UpdateMessageRequest;
import chitchat.dto.response.ApiResponse;
import chitchat.model.enumeration.SystemMessageAction;
import chitchat.service.interfaces.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestPart("sendMessageRequest") SendMessageRequest sendMessageRequest,
                                         @RequestPart(value = "mediaFile", required = false) MultipartFile mediaFile) throws Exception {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Message sent successfully",
                        messageService.sendMessage(sendMessageRequest, mediaFile)
                )
        );
    }

    @PostMapping("/video-call")
    public ResponseEntity<?> sendVideoCallSystemMessage(@RequestBody SendMessageRequest sendMessageRequest,
                                                        @RequestParam SystemMessageAction action) throws Exception {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Video call message sent successfully",
                        messageService.sendVideoCallSystemMessage(sendMessageRequest, action)
                )
        );
    }

    @PutMapping("/{messageId}")
    public ResponseEntity<?> updateMessage(@PathVariable String messageId,
                                           @RequestBody UpdateMessageRequest updateMessageRequest) throws Exception {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Message updated successfully",
                        messageService.updateMessage(messageId, updateMessageRequest)
                )
        );
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<?> deleteMessage(@PathVariable String messageId) throws Exception {
        messageService.deleteMessage(messageId);
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Message deleted successfully"
                )
        );
    }
}
