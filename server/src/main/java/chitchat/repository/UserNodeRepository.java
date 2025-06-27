package chitchat.repository;

import chitchat.dto.response.user.UserRelationshipResponse;
import chitchat.dto.response.user.UserSearchResponse;
import chitchat.model.UserNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface UserNodeRepository extends Neo4jRepository<UserNode, String> {

    @Query("MATCH (u:User) WHERE u.userId = $userId RETURN u")
    Optional<UserNode> findByUserId(@Param("userId") String userId);

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
        MATCH (u:User {userId: $userId})-[:FRIEND]-(friend:User)
        RETURN friend
        SKIP $skip
        LIMIT $limit
    """)
    List<UserNode> findFriendsPaginated(@Param("userId") String userId,
                                        @Param("skip") int skip,
                                        @Param("limit") int limit);

    @Query("MATCH (u:User {userId: $userId})-[:FRIEND]-(friend:User) RETURN count(friend)")
    long countFriends(@Param("userId") String userId);

    @Query("""
        MATCH (u:User {userId: $userId})-[:BLOCKED]->(blocked:User)
        RETURN blocked
        SKIP $skip
        LIMIT $limit
    """)
    List<UserNode> findBlockedUsersPaginated(@Param("userId") String userId,
                                             @Param("skip") int skip,
                                             @Param("limit") int limit);

    @Query("MATCH (u:User {userId: $userId})-[:BLOCKED]->(blocked:User) RETURN count(blocked)")
    long countBlockedUsers(@Param("userId") String userId);

    // Send a friend request
    @Query("""
        MATCH (a:User {userId: $currentUserId})
        MATCH (b:User {userId: $targetUserId})
        WHERE NOT (a)-[:FRIEND|BLOCKED]-(b)
          AND NOT (a)-[:PENDING_REQUEST]->(b)
          AND NOT (b)-[:PENDING_REQUEST]->(a)
        MERGE (a)-[:PENDING_REQUEST]->(b)
    """)
    void sendFriendRequest(@Param("currentUserId") String currentUserId,
                           @Param("targetUserId") String targetUserId);

    // Cancel a sent friend request
    @Query("""
        MATCH (a:User {userId: $currentUserId})-[r:PENDING_REQUEST]->(b:User {userId: $targetUserId})
        DELETE r
    """)
    void cancelFriendRequest(@Param("currentUserId") String currentUserId,
                             @Param("targetUserId") String targetUserId);

    // Accept a friend request
    @Query("""
        MATCH (a:User {userId: $targetUserId})-[r:PENDING_REQUEST]->(b:User {userId: $currentUserId})
        DELETE r
        MERGE (a)-[:FRIEND]-(b)
    """)
    void acceptFriendRequest(@Param("currentUserId") String currentUserId,
                             @Param("targetUserId") String targetUserId);

    // Reject a friend request
    @Query("""
        MATCH (a:User {userId: $targetUserId})-[r:PENDING_REQUEST]->(b:User {userId: $currentUserId})
        DELETE r
    """)
    void rejectFriendRequest(@Param("currentUserId") String currentUserId,
                             @Param("targetUserId") String targetUserId);

    // Incoming friend requests with pagination
    @Query("""
        MATCH (a:User)-[:PENDING_REQUEST]->(b:User {userId: $userId})
        RETURN a
        SKIP $skip
        LIMIT $limit
    """)
    List<UserNode> getIncomingFriendRequestsPaginated(@Param("userId") String userId,
                                                      @Param("skip") int skip,
                                                      @Param("limit") int limit);


    @Query("MATCH (a:User)-[:PENDING_REQUEST]->(b:User {userId: $userId}) RETURN count(a)")
    long countIncomingFriendRequests(@Param("userId") String userId);

    // Outgoing friend requests with pagination
    @Query("""
        MATCH (a:User {userId: $userId})-[:PENDING_REQUEST]->(b:User)
        RETURN b
        SKIP $skip
        LIMIT $limit
    """)
    List<UserNode> getSentFriendRequestsPaginated(@Param("userId") String userId,
                                                  @Param("skip") int skip,
                                                  @Param("limit") int limit);


    @Query("MATCH (a:User {userId: $userId})-[:PENDING_REQUEST]->(b:User) RETURN count(b)")
    long countSentFriendRequests(@Param("userId") String userId);

    @Query("""
        MATCH (a:User {userId: $currentUserId})-[r:FRIEND]-(b:User {userId: $targetUserId})
        DELETE r
    """)
    void removeFriend(@Param("currentUserId") String currentUserId,
                      @Param("targetUserId") String targetUserId);

    @Query("""
        MATCH (a:User {userId: $currentUserId})
        MATCH (b:User {userId: $targetUserId})
        OPTIONAL MATCH (a)-[f:FRIEND]-(b)
        OPTIONAL MATCH (a)-[p1:PENDING_REQUEST]->(b)
        OPTIONAL MATCH (b)-[p2:PENDING_REQUEST]->(a)
        DELETE f, p1, p2
        MERGE (a)-[:BLOCKED]->(b)
    """)
    void blockUser(@Param("currentUserId") String currentUserId,
                   @Param("targetUserId") String targetUserId);

    @Query("""
        MATCH (a:User {userId: $currentUserId})-[r:BLOCKED]->(b:User {userId: $targetUserId})
        DELETE r
    """)
    void unblockUser(@Param("currentUserId") String currentUserId,
                     @Param("targetUserId") String targetUserId);

    @Query("""
        MATCH (u:User {userId: $userId})-[:BLOCKED]->(blocked:User)
        WITH collect(blocked.userId) AS blockedByMe, u
        OPTIONAL MATCH (u)<-[:BLOCKED]-(blocked:User)
        WITH blockedByMe, collect(blocked.userId) AS blockedMe
        RETURN blockedByMe + blockedMe AS allBlocked
    """)
    Set<String> getAllBlockedUserIds(String userId);

    @Query("""
        MATCH (u:User {userId: $userId})-[:BLOCKED]->(blocked:User)
        RETURN collect(blocked.userId) AS blockedByMe
    """)
    Set<String> getBlockedByMe(String userId);

    @Query("""
        MATCH (u:User {userId: $userId})<-[:BLOCKED]-(blocked:User)
        RETURN collect(blocked.userId) AS blockedByOthers
    """)
    Set<String> getBlockedByOthers(String userId);

    @Query("""
        MATCH (a:User {userId: $currentUserId})-[:FRIEND]-(b:User)
        WHERE b.userId IN $targetUserIds
        RETURN b.userId
    """)
    Set<String> getFriendIdsIn(@Param("currentUserId") String currentUserId,
                               @Param("targetUserIds") List<String> targetUserIds);

    @Query("""
        MATCH (a:User {userId: $currentUserId})-[:PENDING_REQUEST]->(b:User)
        WHERE b.userId IN $targetUserIds
        RETURN b.userId
    """)
    Set<String> getSentFriendRequestIdsIn(@Param("currentUserId") String currentUserId,
                                           @Param("targetUserIds") List<String> targetUserIds);

    @Query("""
        MATCH (b:User {userId: $currentUserId})<-[:PENDING_REQUEST]-(a:User)
        WHERE a.userId IN $targetUserIds
        RETURN a.userId
    """)
    Set<String> getIncomingFriendRequestIdsIn(@Param("currentUserId") String currentUserId,
                                              @Param("targetUserIds") List<String> targetUserIds);

    @Query("CREATE FULLTEXT INDEX user_search_index IF NOT EXISTS FOR (u:User) ON EACH [u.fullName]")
    void createFullTextIndex();

    @Query("""
        CALL db.index.fulltext.queryNodes('user_search_index', $searchTerm + '*') YIELD node as searchUser
        WITH searchUser
        MATCH (currentUser:User {userId: $currentUserId})
        WHERE searchUser.userId <> $currentUserId
          AND NOT (currentUser)-[:BLOCKED]-(searchUser)
          AND NOT (searchUser)-[:BLOCKED]->(currentUser)
    
        OPTIONAL MATCH (currentUser)-[friendRel:FRIEND]-(searchUser)
        OPTIONAL MATCH (currentUser)-[sentReq:PENDING_REQUEST]->(searchUser)
        OPTIONAL MATCH (currentUser)<-[receivedReq:PENDING_REQUEST]-(searchUser)
    
        RETURN searchUser.userId as id,
               searchUser.fullName as fullName,
               searchUser.profileImageUrl as profileImageUrl,
               CASE
                 WHEN friendRel IS NOT NULL THEN 'FRIEND'
                 WHEN sentReq IS NOT NULL THEN 'FRIEND_REQUEST_SENT'
                 WHEN receivedReq IS NOT NULL THEN 'FRIEND_REQUEST_RECEIVED'
                 ELSE 'NONE'
               END as relationshipStatus
        ORDER BY searchUser.fullName
        SKIP $skip
        LIMIT $limit
    """)
    List<UserSearchResponse> searchUsersWithRelationshipsFullText(
            @Param("currentUserId") String currentUserId,
            @Param("searchTerm") String searchTerm,
            @Param("skip") int skip,
            @Param("limit") int limit
    );

    // Count search results for pagination
    @Query("""
        CALL db.index.fulltext.queryNodes('user_search_index', $searchTerm + '*') YIELD node as searchUser
        WITH searchUser
        MATCH (currentUser:User {userId: $currentUserId})
        WHERE searchUser.userId <> $currentUserId
          AND NOT (currentUser)-[:BLOCKED]-(searchUser)
          AND NOT (searchUser)-[:BLOCKED]->(currentUser)
        RETURN count(searchUser)
    """)
    long countSearchResultsFullText(
            @Param("currentUserId") String currentUserId,
            @Param("searchTerm") String searchTerm
    );

    @Query("SHOW INDEXES YIELD name WHERE name = 'user_search_index' RETURN count(*) > 0 as exists")
    boolean fullTextIndexExists();

    // Fallback regex search for when full-text search is not available
    @Query("""
        MATCH (currentUser:User {userId: $currentUserId})
        MATCH (searchUser:User)
        WHERE searchUser.fullName =~ ('(?i).*' + $searchTerm + '.*')
          AND searchUser.userId <> $currentUserId
          AND NOT (currentUser)-[:BLOCKED]-(searchUser)
          AND NOT (searchUser)-[:BLOCKED]->(currentUser)
    
        OPTIONAL MATCH (currentUser)-[friendRel:FRIEND]-(searchUser)
        OPTIONAL MATCH (currentUser)-[sentReq:PENDING_REQUEST]->(searchUser)
        OPTIONAL MATCH (currentUser)<-[receivedReq:PENDING_REQUEST]-(searchUser)
    
        RETURN searchUser.userId as userId,
               searchUser.fullName as fullName,
               searchUser.profileImageUrl as profileImageUrl,
               CASE
                 WHEN friendRel IS NOT NULL THEN 'FRIEND'
                 WHEN sentReq IS NOT NULL THEN 'FRIEND_REQUEST_SENT'
                 WHEN receivedReq IS NOT NULL THEN 'FRIEND_REQUEST_RECEIVED'
                 ELSE 'NONE'
               END as relationshipStatus
        ORDER BY searchUser.fullName
        SKIP $skip
        LIMIT $limit
    """)
    List<UserSearchResponse> searchUsersWithRelationshipsRegex(
            @Param("currentUserId") String currentUserId,
            @Param("searchTerm") String searchTerm,
            @Param("skip") int skip,
            @Param("limit") int limit
    );

    @Query("""
        MATCH (currentUser:User {userId: $currentUserId})
        MATCH (searchUser:User)
        WHERE searchUser.fullName =~ ('(?i).*' + $searchTerm + '.*')
          AND searchUser.userId <> $currentUserId
          AND NOT (currentUser)-[:BLOCKED]-(searchUser)
          AND NOT (searchUser)-[:BLOCKED]->(currentUser)
        RETURN count(searchUser)
    """)
    long countSearchResultsRegex(
            @Param("currentUserId") String currentUserId,
            @Param("searchTerm") String searchTerm
    );

    @Query("""
        MATCH (u:User {userId: $userId})
        OPTIONAL MATCH (u)-[:FRIEND]-(friends:User)
        OPTIONAL MATCH (u)-[:PENDING_REQUEST]->(sentRequests:User)
        OPTIONAL MATCH (u)<-[:PENDING_REQUEST]-(receivedRequests:User)
        OPTIONAL MATCH (u)-[:BLOCKED]->(blocked:User)
        OPTIONAL MATCH (u)<-[:BLOCKED]-(blockedBy:User)

        RETURN collect(DISTINCT friends.userId) as friends,
               collect(DISTINCT sentRequests.userId) as sentRequests,
               collect(DISTINCT receivedRequests.userId) as receivedRequests,
               collect(DISTINCT blocked.userId) as blocked,
               collect(DISTINCT blockedBy.userId) as blockedBy
    """)
    UserRelationshipResponse getUserRelationshipResponse(@Param("userId") String userId);
}
