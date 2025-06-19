package chitchat.service.implement;

import chitchat.dto.response.PageResponse;
import chitchat.model.UserNode;
import chitchat.repository.UserNodeRepository;
import chitchat.service.interfaces.UserNodeService;
import chitchat.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserNodeServiceImpl implements UserNodeService {

    private final UserNodeRepository userNodeRepository;
    private final UserService userService;

    @Override
    public void sendFriendRequest(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        if (targetUserId.equals(currentUserId)) {
            throw new IllegalArgumentException("Cannot send friend request to yourself");
        }
        userNodeRepository.sendFriendRequest(currentUserId, targetUserId);
    }

    @Override
    public void cancelFriendRequest(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        userNodeRepository.cancelFriendRequest(currentUserId, targetUserId);
    }

    @Override
    public void acceptFriendRequest(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        userNodeRepository.acceptFriendRequest(currentUserId, targetUserId);
    }

    @Override
    public void rejectFriendRequest(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        userNodeRepository.rejectFriendRequest(currentUserId, targetUserId);
    }

    @Override
    public void removeFriend(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        userNodeRepository.removeFriend(currentUserId, targetUserId);
    }

    @Override
    public void blockUser(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        if (targetUserId.equals(currentUserId)) {
            throw new IllegalArgumentException("Cannot block yourself");
        }
        userNodeRepository.blockUser(currentUserId, targetUserId);
    }

    @Override
    public void unblockUser(String targetUserId) {
        String currentUserId = userService.getCurrentUser().getUser().getId();
        userNodeRepository.unblockUser(currentUserId, targetUserId);
    }

    @Override
    public PageResponse<?> getAllUsers(int pageNumber, int pageSize) {
        int skip = toSkip(pageNumber, pageSize);
        List<UserNode> users = userNodeRepository.findAllUsersPaginated(skip, pageSize);
        long total = userNodeRepository.countAllUsers();
        int totalPages = (int) Math.ceil((double) total / pageSize);

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .content(users)
                .build();
    }

    @Override
    public PageResponse<?> getFriends(int pageNumber, int pageSize) {
        String userId = userService.getCurrentUser().getUser().getId();
        int skip = toSkip(pageNumber, pageSize);
        List<UserNode> friends = userNodeRepository.findFriendsPaginated(userId, skip, pageSize);
        long total = userNodeRepository.countFriends(userId);
        int totalPages = (int) Math.ceil((double) total / pageSize);

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .content(friends)
                .build();
    }

    @Override
    public PageResponse<?> getBlockedUsers(int pageNumber, int pageSize) {
        String userId = userService.getCurrentUser().getUser().getId();
        int skip = toSkip(pageNumber, pageSize);
        List<UserNode> blockedUsers = userNodeRepository.findBlockedUsersPaginated(userId, skip, pageSize);
        long total = userNodeRepository.countBlockedUsers(userId);
        int totalPages = (int) Math.ceil((double) total / pageSize);

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .content(blockedUsers)
                .build();
    }

    @Override
    public PageResponse<?> getIncomingFriendRequests(int pageNumber, int pageSize) {
        String userId = userService.getCurrentUser().getUser().getId();
        int skip = toSkip(pageNumber, pageSize);
        List<UserNode> incoming = userNodeRepository.getIncomingFriendRequestsPaginated(userId, skip, pageSize);
        long total = userNodeRepository.countIncomingFriendRequests(userId);
        int totalPages = (int) Math.ceil((double) total / pageSize);

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .content(incoming)
                .build();
    }

    @Override
    public PageResponse<?> getSentFriendRequests(int pageNumber, int pageSize) {
        String userId = userService.getCurrentUser().getUser().getId();
        int skip = toSkip(pageNumber, pageSize);
        List<UserNode> sent = userNodeRepository.getSentFriendRequestsPaginated(userId, skip, pageSize);
        long total = userNodeRepository.countSentFriendRequests(userId);
        int totalPages = (int) Math.ceil((double) total / pageSize);

        return PageResponse.builder()
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(total)
                .totalPages(totalPages)
                .content(sent)
                .build();
    }

    private int toSkip(int pageNumber, int pageSize) {
        return (pageNumber - 1) * pageSize;
    }
}
