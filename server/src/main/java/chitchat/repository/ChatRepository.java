package chitchat.repository;

import chitchat.model.Chat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

}
