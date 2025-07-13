package chitchat.controller;

import chitchat.dto.response.ApiResponse;
import chitchat.service.StreamService;
import io.getstream.exceptions.StreamException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/stream")
@RequiredArgsConstructor
public class StreamController {

    private final StreamService streamService;

    @GetMapping("/token")
    public ResponseEntity<?> createStreamToken() throws StreamException {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Get stream token successfully",
                        streamService.createStreamToken()
                )
        );
    }
}
