package chitchat.repository;

import chitchat.model.MessageReadInfo;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReadInfoRepository extends MongoRepository<MessageReadInfo, String> {
    Boolean existsByMessageIdAndUserId(String messageId, String userId);
    List<MessageReadInfo> findByMessageIdIn(List<String> messageIds);

    @Query(
            value = "{ 'chatId' : ?0, 'userId' : ?1 }",
            sort = "{ 'readAt' : -1 }"
    )
    Optional<MessageReadInfo> findLatestMessageReadInfo(String chatId, String userId);

    Optional<MessageReadInfo> findFirstByChatIdAndUserIdOrderByReadAtDesc(String chatId, String userId);

}
