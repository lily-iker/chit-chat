package chitchat.repository;

import chitchat.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    @Query("{ '$or': [ { 'username': ?0 }, { 'email': ?0 } ] }")
    Optional<User> findByUsernameOrEmail(String identifier);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    @Query("""
        {
            'fullName': {
                $regex: ?0,
                $options: 'i'
            },
            '_id': {
                $nin: ?1
            }
        }
    """)
    Page<User> searchByFullNameExcludingUsers(String searchTerm, Set<String> excludedUserIds, Pageable pageable);

    @Query(value = """
        {
            'fullName': {
                $regex: ?0,
                $options: 'i'
            },
            '_id': {
                $nin: ?1
            }
        }
    """,
    count = true)
    long countByFullNameExcludingUsers(String searchTerm, List<String> excludedUserIds);

    @Query("{ '_id': { $in: ?1 }, 'fullName': { $regex: ?0, $options: 'i' } }")
    List<User> searchByFullNameIn(String query, List<String> userIds);

}
