package chitchat.service.interfaces;

import chitchat.dto.request.auth.LoginRequest;
import chitchat.dto.request.auth.RegisterRequest;
import chitchat.dto.response.token.TokenResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthenticationService {
    TokenResponse login(LoginRequest loginRequest, HttpServletResponse response);
    TokenResponse register(RegisterRequest registerRequest, HttpServletResponse response);
    void logout(HttpServletRequest request, HttpServletResponse response);
    TokenResponse refresh(HttpServletRequest request, HttpServletResponse response);
}
