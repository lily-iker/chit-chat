package chitchat.controller;

import chitchat.dto.request.message.SendMessageRequest;
import chitchat.dto.response.ApiResponse;
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
                                         @RequestPart(value = "mediaFile", required = false) MultipartFile mediaFile) {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Message sent successfully",
                        messageService.sendMessage(sendMessageRequest, mediaFile)
                )
        );
    }
}
