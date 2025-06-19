package chitchat.controller;

import chitchat.dto.request.auth.LoginRequest;
import chitchat.dto.request.auth.RegisterRequest;
import chitchat.dto.response.ApiResponse;
import chitchat.service.interfaces.AuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthenticationController {
    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest,
                                   @NotNull HttpServletResponse response) {
        return ResponseEntity.ok(
                new ApiResponse<>(
                        200,
                        "Login successful",
                        authenticationService.login(loginRequest, response)
                )
        );
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest,
                                      @NotNull HttpServletResponse response) {
        return ResponseEntity.ok(
                new ApiResponse<>(
                        200,
                        "Registration successful",
                        authenticationService.register(registerRequest, response)
                )
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@NotNull HttpServletRequest request,
                                    @NotNull HttpServletResponse response) {
        authenticationService.logout(request, response);
        return ResponseEntity.ok(
                new ApiResponse<>(
                        200,
                        "Logout successful"
                )
        );
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@NotNull HttpServletRequest request,
                                     @NotNull HttpServletResponse response) {
        return ResponseEntity.ok(
                new ApiResponse<>(
                        200,
                        "Token refreshed successfully",
                        authenticationService.refresh(request, response)
                )
        );
    }
}
