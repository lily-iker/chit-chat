package chitchat.repository;

import chitchat.model.UserNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserNodeRepository extends Neo4jRepository<UserNode, String> {

    @Query("""
        MATCH (u:User)
        RETURN u
        SKIP $skip
        LIMIT $limit
    """)
    List<UserNode> findAllUsersPaginated(@Param("skip") int skip,
                                         @Param("limit") int limit);

    @Query("MATCH (u:User) RETURN count(u)")
    long countAllUsers();

    @Query("""
        MATCH (u:User {id: $userId})-[:FRIEND]-(friend:User)
        RETURN friend
        SKIP $skip
        LIMIT $limit
    """)
    List<UserNode> findFriendsPaginated(@Param("userId") String userId,
                                        @Param("skip") int skip,
                                        @Param("limit") int limit);

    @Query("MATCH (u:User {id: $userId})-[:FRIEND]-(friend:User) RETURN count(friend)")
    long countFriends(@Param("userId") String userId);

    @Query("""
        MATCH (u:User {id: $userId})-[:BLOCKED]->(blocked:User)
        RETURN blocked
        SKIP $skip
        LIMIT $limit
    """)
    List<UserNode> findBlockedUsersPaginated(@Param("userId") String userId,
                                             @Param("skip") int skip,
                                             @Param("limit") int limit);

    @Query("MATCH (u:User {id: $userId})-[:BLOCKED]->(blocked:User) RETURN count(blocked)")
    long countBlockedUsers(@Param("userId") String userId);

    // Send a friend request
    @Query("""
        MATCH (a:User {id: $currentUserId})
        MATCH (b:User {id: $targetUserId})
        WHERE NOT (a)-[:FRIEND|BLOCKED]-(b)
          AND NOT (a)-[:PENDING_REQUEST]->(b)
          AND NOT (b)-[:PENDING_REQUEST]->(a)
        MERGE (a)-[:PENDING_REQUEST]->(b)
    """)
    void sendFriendRequest(@Param("currentUserId") String currentUserId,
                           @Param("targetUserId") String targetUserId);

    // Cancel a sent friend request
    @Query("""
        MATCH (a:User {id: $currentUserId})-[r:PENDING_REQUEST]->(b:User {id: $targetUserId})
        DELETE r
    """)
    void cancelFriendRequest(@Param("currentUserId") String currentUserId,
                             @Param("targetUserId") String targetUserId);

    // Accept a friend request
    @Query("""
        MATCH (a:User {id: $targetUserId})-[r:PENDING_REQUEST]->(b:User {id: $currentUserId})
        DELETE r
        MERGE (a)-[:FRIEND]-(b)
    """)
    void acceptFriendRequest(@Param("currentUserId") String currentUserId,
                             @Param("targetUserId") String targetUserId);

    // Reject a friend request
    @Query("""
        MATCH (a:User {id: $targetUserId})-[r:PENDING_REQUEST]->(b:User {id: $currentUserId})
        DELETE r
    """)
    void rejectFriendRequest(@Param("currentUserId") String currentUserId,
                             @Param("targetUserId") String targetUserId);

    // Incoming friend requests with pagination
    @Query("""
        MATCH (a:User)-[:PENDING_REQUEST]->(b:User {id: $userId})
        RETURN a
        SKIP $skip
        LIMIT $limit
    """)
    List<UserNode> getIncomingFriendRequestsPaginated(@Param("userId") String userId,
                                                      @Param("skip") int skip,
                                                      @Param("limit") int limit);


    @Query("MATCH (a:User)-[:PENDING_REQUEST]->(b:User {id: $userId}) RETURN count(a)")
    long countIncomingFriendRequests(@Param("userId") String userId);

    // Outgoing friend requests with pagination
    @Query("""
        MATCH (a:User {id: $userId})-[:PENDING_REQUEST]->(b:User)
        RETURN b
        SKIP $skip
        LIMIT $limit
    """)
    List<UserNode> getSentFriendRequestsPaginated(@Param("userId") String userId,
                                                  @Param("skip") int skip,
                                                  @Param("limit") int limit);


    @Query("MATCH (a:User {id: $userId})-[:PENDING_REQUEST]->(b:User) RETURN count(b)")
    long countSentFriendRequests(@Param("userId") String userId);

    @Query("""
        MATCH (a:User {id: $currentUserId})-[r:FRIEND]-(b:User {id: $targetUserId})
        DELETE r
    """)
    void removeFriend(@Param("currentUserId") String currentUserId,
                      @Param("targetUserId") String targetUserId);

    @Query("""
        MATCH (a:User {id: $currentUserId})
        MATCH (b:User {id: $targetUserId})
        OPTIONAL MATCH (a)-[f:FRIEND]-(b)
        OPTIONAL MATCH (a)-[p1:PENDING_REQUEST]->(b)
        OPTIONAL MATCH (b)-[p2:PENDING_REQUEST]->(a)
        DELETE f, p1, p2
        MERGE (a)-[:BLOCKED]->(b)
    """)
    void blockUser(@Param("currentUserId") String currentUserId,
                   @Param("targetUserId") String targetUserId);

    @Query("""
        MATCH (a:User {id: $currentUserId})-[r:BLOCKED]->(b:User {id: $targetUserId})
        DELETE r
    """)
    void unblockUser(@Param("currentUserId") String currentUserId,
                     @Param("targetUserId") String targetUserId);

    @Query("""
        MATCH (u:User {id: $userId})-[:BLOCKED]->(blocked:User)
        WITH collect(blocked.id) AS blockedByMe, u
        OPTIONAL MATCH (u)<-[:BLOCKED]-(blocked:User)
        WITH blockedByMe, collect(blocked.id) AS blockedMe
        RETURN blockedByMe + blockedMe AS allBlocked
    """)
    List<String> getAllBlockedUserIds(String userId);

    @Query("""
        MATCH (a:User {id: $currentUserId})-[:FRIEND]-(b:User)
        WHERE b.id IN $targetUserIds
        RETURN b.id
    """)
    List<String> getFriendIdsIn(@Param("currentUserId") String currentUserId, 
                                @Param("targetUserIds") List<String> targetUserIds);

    @Query("""
        MATCH (a:User {id: $currentUserId})-[:PENDING_REQUEST]->(b:User)
        WHERE b.id IN $targetUserIds
        RETURN b.id
    """)
    List<String> getSentFriendRequestIdsIn(@Param("currentUserId") String currentUserId, 
                                           @Param("targetUserIds") List<String> targetUserIds);

    @Query("""
        MATCH (b:User {id: $currentUserId})<-[:PENDING_REQUEST]-(a:User)
        WHERE a.id IN $targetUserIds
        RETURN a.id
    """)
    List<String> getIncomingFriendRequestIdsIn(@Param("currentUserId") String currentUserId, 
                                               @Param("targetUserIds") List<String> targetUserIds);

}
