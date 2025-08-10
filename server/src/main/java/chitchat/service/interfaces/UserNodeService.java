package chitchat.service.interfaces;

import chitchat.dto.response.PageResponse;
import chitchat.model.User;
import chitchat.model.enumeration.RelationshipStatus;

public interface UserNodeService {
    void sendFriendRequest(String targetUserId);
    void cancelFriendRequest(String targetUserId);
    void acceptFriendRequest(String targetUserId);
    void rejectFriendRequest(String targetUserId);
    void removeFriend(String targetUserId);
    void blockUser(String targetUserId);
    void unblockUser(String targetUserId);
    PageResponse<?> getAllUsers(int pageNumber, int pageSize);
    PageResponse<?> getFriends(int pageNumber, int pageSize);
    PageResponse<?> getBlockedUsers(int pageNumber, int pageSize);
    PageResponse<?> getIncomingFriendRequests(int pageNumber, int pageSize);
    PageResponse<?> getSentFriendRequests(int pageNumber, int pageSize);
    PageResponse<?> searchFriends(String query, int pageNumber, int pageSize, String sortBy, String sortDirection);
    PageResponse<?> searchUsers(String query, int pageNumber, int pageSize, String sortBy, String sortDirection);

    void updateUserNode(User user);
    RelationshipStatus getRelationshipBetween(String currentUserId, String targetUserId);
}
