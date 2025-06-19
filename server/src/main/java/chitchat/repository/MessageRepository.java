package chitchat.repository;

import chitchat.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByChatId(String chatId);
    void deleteByChatId(String chatId);
    Page<Message> findByChatId(String chatId, Pageable pageable);

    @Query("{ 'chatId' : ?0, 'createdAt' : { $lt: ?1 } }")
    Page<Message> findByChatIdAndCreatedAtBefore(String chatId, Instant createdAt, Pageable pageable);

    @Query(value = "{ 'chatId': ?0, 'senderId': { $ne: ?1 } }", count = true)
    long countByChatIdExcludingUserId(String chatId, String userId);

    @Query(
            value = "{ 'chatId' : ?0, 'createdAt' : { $gt: ?1 }, 'senderId': { $ne: ?2 } }",
            count = true
    )
    long countUnreadMessages(String chatId, Instant lastReadAt, String userId);
}
