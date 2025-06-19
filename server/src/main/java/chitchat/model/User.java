package chitchat.model;

import chitchat.model.auditing.AbstractAuditingDocument;
import chitchat.model.enumeration.RoleName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "users")
public class User extends AbstractAuditingDocument {

    @Id
    private String id;

    private String fullName;

    private String profileImageUrl;

    private String bio;

    @Indexed(unique = true)
    private String email;

    @Indexed(unique = true)
    private String username;

    @JsonIgnore
    private String password;

    @Builder.Default
    private Boolean emailVerified = false;

    @Builder.Default
    private Boolean profileCompleted = false;

    private RoleName role;

}
