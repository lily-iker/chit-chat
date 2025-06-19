package chitchat.controller;

import chitchat.dto.response.ApiResponse;
import chitchat.service.interfaces.UserNodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/user-nodes")
public class UserNodeController {

    private final UserNodeService userNodeService;

    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers(@RequestParam(defaultValue = "1") int pageNumber,
                                         @RequestParam(defaultValue = "10") int pageSize) {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Users retrieved successfully",
                        userNodeService.getAllUsers(pageNumber, pageSize)
                )
        );
    }

    @GetMapping("/friends")
    public ResponseEntity<?> getFriends(@RequestParam(defaultValue = "1") int pageNumber,
                                        @RequestParam(defaultValue = "10") int pageSize) {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Friends retrieved successfully",
                        userNodeService.getFriends(pageNumber, pageSize)
                )
        );
    }

    @GetMapping("/blocked")
    public ResponseEntity<?> getBlockedUsers(@RequestParam(defaultValue = "1") int pageNumber,
                                             @RequestParam(defaultValue = "10") int pageSize) {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Blocked users retrieved successfully",
                        userNodeService.getBlockedUsers(pageNumber, pageSize)
                )
        );
    }

    @GetMapping("/friend-requests/incoming")
    public ResponseEntity<?> getIncomingFriendRequests(@RequestParam(defaultValue = "1") int pageNumber,
                                                       @RequestParam(defaultValue = "10") int pageSize) {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Incoming friend requests retrieved successfully",
                        userNodeService.getIncomingFriendRequests(pageNumber, pageSize)
                )
        );
    }

    @GetMapping("/friend-requests/sent")
    public ResponseEntity<?> getSentFriendRequests(@RequestParam(defaultValue = "1") int pageNumber,
                                                   @RequestParam(defaultValue = "10") int pageSize) {
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Sent friend requests retrieved successfully",
                        userNodeService.getSentFriendRequests(pageNumber, pageSize)
                )
        );
    }

    @PostMapping("/friend-request/send/{targetUserId}")
    public ResponseEntity<?> sendFriendRequest(@PathVariable String targetUserId) {
        userNodeService.sendFriendRequest(targetUserId);
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Friend request sent successfully"
                )
        );
    }

    @PostMapping("/friend-request/cancel/{targetUserId}")
    public ResponseEntity<?> cancelFriendRequest(@PathVariable String targetUserId) {
        userNodeService.cancelFriendRequest(targetUserId);
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Friend request canceled successfully"
                )
        );
    }

    @PostMapping("/friend-request/accept/{targetUserId}")
    public ResponseEntity<?> acceptFriendRequest(@PathVariable String targetUserId) {
        userNodeService.acceptFriendRequest(targetUserId);
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Friend request accepted successfully"
                )
        );
    }

    @PostMapping("/friend-request/reject/{targetUserId}")
    public ResponseEntity<?> rejectFriendRequest(@PathVariable String targetUserId) {
        userNodeService.rejectFriendRequest(targetUserId);
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Friend request rejected successfully"
                )
        );
    }

    @DeleteMapping("/friends/{targetUserId}")
    public ResponseEntity<?> removeFriend(@PathVariable String targetUserId) {
        userNodeService.removeFriend(targetUserId);
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "Friend removed successfully"
                )
        );
    }

    @PostMapping("/block/{targetUserId}")
    public ResponseEntity<?> blockUser(@PathVariable String targetUserId) {
        userNodeService.blockUser(targetUserId);
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "User blocked successfully"
                )
        );
    }

    @PostMapping("/unblock/{targetUserId}")
    public ResponseEntity<?> unblockUser(@PathVariable String targetUserId) {
        userNodeService.unblockUser(targetUserId);
        return ResponseEntity.ok(
                new ApiResponse<>(200,
                        "User unblocked successfully"
                )
        );
    }
}
