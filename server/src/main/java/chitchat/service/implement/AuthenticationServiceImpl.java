package chitchat.service.implement;

import chitchat.dto.request.auth.LoginRequest;
import chitchat.dto.request.auth.RegisterRequest;
import chitchat.dto.response.token.TokenResponse;
import chitchat.exception.DataInUseException;
import chitchat.model.User;
import chitchat.model.UserNode;
import chitchat.model.enumeration.RoleName;
import chitchat.model.enumeration.TokenType;
import chitchat.model.security.CustomUserDetails;
import chitchat.repository.UserNodeRepository;
import chitchat.repository.UserRepository;
import chitchat.service.JwtService;
import chitchat.service.interfaces.AuthenticationService;
import chitchat.utils.CookieUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements AuthenticationService {

    private static final String ACCESS_TOKEN_COOKIE_NAME = "accessToken";
    private static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
    private static final int ACCESS_TOKEN_COOKIE_EXPIRATION = 60 * 10; // 10-minute expiration
    private static final int REFRESH_TOKEN_COOKIE_EXPIRATION = 60 * 60 * 24 * 14; // 14-day expiration
    private static final String RESET_PASSWORD_PREFIX = "reset-password-";

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final CookieUtils cookieUtils;
    private final UserNodeRepository userNodeRepository;

    @Override
    public TokenResponse login(LoginRequest loginRequest, HttpServletResponse response) {
        // Call the custom UserDetailsService.loadUserByUsername(String input) method
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                loginRequest.getIdentifier(),
                loginRequest.getPassword()));

        User user = userRepository.findByUsernameOrEmail(loginRequest.getIdentifier())
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with username or email: " + loginRequest.getIdentifier()));

        CustomUserDetails userDetails = new CustomUserDetails(user);

        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        Cookie accessTokenCookie = cookieUtils.createCookie(
                ACCESS_TOKEN_COOKIE_NAME, accessToken, ACCESS_TOKEN_COOKIE_EXPIRATION, true, true, "/", "Strict");
        Cookie refreshTokenCookie = cookieUtils.createCookie(
                REFRESH_TOKEN_COOKIE_NAME, refreshToken, REFRESH_TOKEN_COOKIE_EXPIRATION, true, true, "/", "Strict");

        // Add the cookies to the response
        response.addCookie(accessTokenCookie);
        response.addCookie(refreshTokenCookie);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .build();
    }

    @Override
    @Transactional
    public TokenResponse register(RegisterRequest registerRequest, HttpServletResponse response) {

        if (userRepository.findByUsername(registerRequest.getUsername()).isPresent()) {
            throw new DataInUseException("Username is already in use");
        }

        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new DataInUseException("Email is already in use");
        }

        User user = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(RoleName.USER)
                .build();

        userRepository.save(user);

        UserNode userNode = UserNode.builder()
                .id(user.getId())
                .build();

        userNodeRepository.save(userNode);

        CustomUserDetails userDetails = new CustomUserDetails(user);

        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        Cookie accessTokenCookie = cookieUtils.createCookie(
                ACCESS_TOKEN_COOKIE_NAME, accessToken, ACCESS_TOKEN_COOKIE_EXPIRATION, true, true, "/", "Strict");
        Cookie refreshTokenCookie = cookieUtils.createCookie(
                REFRESH_TOKEN_COOKIE_NAME, refreshToken, REFRESH_TOKEN_COOKIE_EXPIRATION, true, true, "/", "Strict");

        response.addCookie(accessTokenCookie);
        response.addCookie(refreshTokenCookie);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .build();
    }

    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        Cookie accessTokenCookie = cookieUtils.createCookie(
                ACCESS_TOKEN_COOKIE_NAME, null, 0, true, true, "/", "Strict");
        Cookie refreshTokenCookie = cookieUtils.createCookie(
                REFRESH_TOKEN_COOKIE_NAME, null, 0, true, true, "/", "Strict");

        // TODO: Invalidate the tokens in the database if necessary

        response.addCookie(accessTokenCookie);
        response.addCookie(refreshTokenCookie);

        SecurityContextHolder.clearContext();
    }

    @Override
    public TokenResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = cookieUtils.getCookieValue(request.getCookies(), REFRESH_TOKEN_COOKIE_NAME);
        if (refreshToken == null || refreshToken.isEmpty()) {
            throw new IllegalArgumentException("Token can not be null or empty");
        }

        final String username = jwtService.extractUsername(refreshToken, TokenType.REFRESH_TOKEN);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Username not found"));

        CustomUserDetails userDetails = new CustomUserDetails(user);

        if (!jwtService.isValidToken(refreshToken, TokenType.REFRESH_TOKEN, userDetails)) {
            throw new IllegalArgumentException("Invalid Token");
        }

        String accessToken = jwtService.generateAccessToken(userDetails);
        Cookie accessTokenCookie = cookieUtils.createCookie(
                ACCESS_TOKEN_COOKIE_NAME, accessToken, ACCESS_TOKEN_COOKIE_EXPIRATION, true, true, "/", "Strict");

        response.addCookie(accessTokenCookie);

        SecurityContextHolder.clearContext();

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .build();
    }


//    @Value("${spring.security.oauth2.client.registration.google.client-id}")
//    private String googleClientId;
//    public TokenResponse processGoogleLogin(String idTokenString, HttpServletResponse response) throws GeneralSecurityException, IOException {
//        // Verify Google ID token
//        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
//                .setAudience(Collections.singletonList(googleClientId))
//                .build();
//
//        GoogleIdToken idToken = verifier.verify(idTokenString);
//        if (idToken == null) {
//            throw new IllegalArgumentException("Invalid Google ID token");
//        }
//
//        GoogleIdToken.Payload payload = idToken.getPayload();
//        String googleId = payload.getSubject();
//        String email = payload.getEmail();
//        String fullName = (String) payload.get("name");
//        String avatarUrl = (String) payload.get("picture");
//
//        // Find or create user
//        User user = userRepository.findByGoogleId(googleId)
//                .orElseGet(() -> {
//                    if (userRepository.findByEmail(email).isPresent()) {
//                        throw new DataInUseException("Email is already in use");
//                    }
//
//                    User newUser = User.builder()
//                            .google                            .googleId(googleId)
//                            .email(email)
//                            .fullName(fullName)
//                            .avatarUrl(avatarUrl)
//                            .username(email.split("@")[0]) // Generate username from email
//                            .role(RoleName.USER)
//                            .isGoogleUser(true)
//                            .emailVerified(true) // Google verifies email
//                            .build();
//                    return userRepository.save(newUser);
//                });
//
//        // Generate tokens
//        CustomUserDetails userDetails = new CustomUserDetails(user);
//        String accessToken = jwtService.generateAccessToken(userDetails);
//        String refreshToken = jwtService.generateRefreshToken(userDetails);
//
//        // Set cookies
//        Cookie accessTokenCookie = cookieUtils.createCookie(
//                "accessToken", accessToken, ACCESS_TOKEN_COOKIE_EXPIRATION, true, true, "/", "Strict");
//        Cookie refreshTokenCookie = cookieUtils.createCookie(
//                "refreshToken", refreshToken, REFRESH_TOKEN_COOKIE_EXPIRATION, true, true, "/", "Strict");
//
//        response.addCookie(accessTokenCookie);
//        response.addCookie(refreshTokenCookie);
//
//        return TokenResponse.builder()
//                .accessToken(accessToken)
//                .refreshToken(refreshToken)
//                .userId(user.getId())
//                .build();
//    }

}
