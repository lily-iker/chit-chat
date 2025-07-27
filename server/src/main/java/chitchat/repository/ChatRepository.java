package chitchat.repository;

import chitchat.model.Chat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends MongoRepository<Chat, String> {
    @Query(""" 
        {
            'isGroupChat': false,
            'participants': { $all: ?0 },
            $expr: {
                $eq: [
                    { $size: '$participants' }, 2
                ]
            }
        }
    """)
    Optional<Chat> findPrivateChatByParticipants(List<String> participants);

    @Query(value = "{ 'participants': ?0 }")
    Page<Chat> findByParticipantId(String participantId, Pageable pageable);

    @Query(value = "{ 'participants': ?0, 'updatedAt': { $lt: ?1 } }")
    Page<Chat> findByParticipantIdAndUpdatedAtBefore(String participantId, Instant updatedAt, Pageable pageable);

    @Aggregation(pipeline = {
        // Filter chats where the current user is participant and not deleted
        "{ $match: { participants: ?1, isDeleted: { $ne: true } } }",

        // Convert string participant IDs to ObjectIds for lookup
        "{ $addFields: { " +
            "participantObjectIds: { " +
                "$map: { " +
                    "input: '$participants', " +
                    "as: 'pid', " +
                    "in: { $toObjectId: '$$pid' } " +
                "} " +
            "} " +
        "} }",

        // Join with users collection to get participant details
        "{ $lookup: { " +
            "from: 'users', " +
            "localField: 'participantObjectIds', " +
            "foreignField: '_id', " +
            "as: 'participantUsers' " +
        "} }",

        // Apply search filters
        "{ $match: { " +
            "$or: [ " +
                // Match group chat names
                "{ isGroupChat: true, name: { $regex: ?0, $options: 'i' } }, " +

                // Match private chat participant names (excluding self)
                "{ isGroupChat: false, participantUsers: { " +
                    "$elemMatch: { " +
                        "_id: { $ne: { $toObjectId: ?1 } }, " +
                        "fullName: { $regex: ?0, $options: 'i' } " +
                    "} " +
                "} }, " +
                // Match last message content in any chat
                "{ lastMessageContent: { $regex: ?0, $options: 'i' } } " +
            "] " +
        "} }",

        // Sort by most recent activity first
        "{ $sort: { lastMessageTime: -1 } }",

        // Paginate
        "{ $skip: ?2 }",
        "{ $limit: ?3 }"
    })
    List<Chat> searchChats(String query, String userId, int skip, int limit);

    @Aggregation(pipeline = {
        "{ $match: { participants: ?1, isDeleted: { $ne: true } } }",
        "{ $addFields: { " +
            "participantObjectIds: { " +
                "$map: { " +
                    "input: '$participants', " +
                    "as: 'pid', " +
                    "in: { $toObjectId: '$$pid' } " +
                "} " +
            "} " +
        "} }",
        "{ $lookup: { " +
            "from: 'users', " +
            "localField: 'participantObjectIds', " +
            "foreignField: '_id', " +
            "as: 'participantUsers' " +
        "} }",
        "{ $match: { " +
            "$or: [ " +
                "{ isGroupChat: true, name: { $regex: ?0, $options: 'i' } }, " +
                "{ isGroupChat: false, participantUsers: { " +
                    "$elemMatch: { " +
                        "_id: { $ne: { $toObjectId: ?1 } }, " +
                        "fullName: { $regex: ?0, $options: 'i' } " +
                    "} " +
                "} }, " +
                "{ lastMessageContent: { $regex: ?0, $options: 'i' } } " +
            "] " +
        "} }",
        "{ $count: 'total' }"
    })
    Long countSearchChats(String query, String userId);
}
