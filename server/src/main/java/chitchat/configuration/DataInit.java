package chitchat.configuration;

import chitchat.model.User;
import chitchat.model.UserNode;
import chitchat.model.enumeration.RoleName;
import chitchat.repository.UserNodeRepository;
import chitchat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInit implements CommandLineRunner {

    private final UserRepository userRepository;
    private final UserNodeRepository userNodeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            System.out.println("Users already exist. Skipping data initialization.");
            return;
        }

        List<User> users = new ArrayList<>();
        List<UserNode> userNodes = new ArrayList<>();

        for (int i = 1; i <= 1000; i++) {
            String username = "user" + i;
            String email = "user" + i + "@example.com";

            User user = User.builder()
                    .fullName(username)
                    .bio(username + "biobiobio")
                    .profileCompleted(true)
                    .emailVerified(true)
                    .username(username)
                    .email(email)
                    .password(passwordEncoder.encode("password"))
                    .role(RoleName.USER)
                    .build();

            users.add(user);
        }

        // Save all users to MongoDB first
        userRepository.saveAll(users);

        // After saving, users will have IDs
        users.forEach(savedUser -> {
            UserNode userNode = UserNode.builder()
                    .userId(savedUser.getId())
                    .fullName(savedUser.getFullName())
                    .profileImageUrl(savedUser.getProfileImageUrl())
                    .bio(savedUser.getBio())
                    .build();
            userNodes.add(userNode);
        });

        userNodeRepository.saveAll(userNodes);

        System.out.println("✅ 1000 users initialized successfully.");
    }
}

