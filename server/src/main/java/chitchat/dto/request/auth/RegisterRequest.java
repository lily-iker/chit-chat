package chitchat.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RegisterRequest {

    @Size(min = 8, message = "Username must be at least 8 characters")
    private String username;

    @Email(message = "Must be a valid email")
    private String email;

    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @Size(min = 8, message = "Retype password must be at least 8 characters")
    private String confirmPassword;
}
