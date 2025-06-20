package chitchat.controller;

import chitchat.dto.request.user.UserInfoRequest;
import chitchat.dto.response.ApiResponse;
import chitchat.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    @PostMapping("/setup-basic-info")
    public ResponseEntity<?> setUpMyBasicInfo(
            @RequestPart UserInfoRequest userInfoRequest,
            @RequestPart(value = "profileImageFile", required = false) MultipartFile profileImageFile)
            throws Exception {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "User info updated successfully",
                        userService.setUpMyBasicInfo(userInfoRequest, profileImageFile)
                )
        );
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyInfo() {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "User info retrieved successfully",
                        userService.getMyInfo()
                )
        );
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam String query,
                                         @RequestParam(defaultValue = "1") int pageNumber,
                                         @RequestParam(defaultValue = "10") int pageSize,
                                         @RequestParam(defaultValue = "fullName") String sortBy,
                                         @RequestParam(defaultValue = "asc") String sortDirection) {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Users searched successfully",
                        userService.searchUsers(query, pageNumber, pageSize, sortBy, sortDirection)
                )
        );
    }
}
