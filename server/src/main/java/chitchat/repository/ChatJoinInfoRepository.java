package chitchat.repository;

import chitchat.model.ChatJoinInfo;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatJoinInfoRepository extends MongoRepository<ChatJoinInfo, String> {
    @Query("""
        {
            'chatId': ?0,
            'addedUserId': ?1
        }
    """)
    Optional<ChatJoinInfo> findByChatIdAndAddedUserId(String chatId, String addedUserId);
}
