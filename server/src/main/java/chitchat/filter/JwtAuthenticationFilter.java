package chitchat.filter;

import chitchat.model.enumeration.TokenType;
import chitchat.service.JwtService;
import chitchat.utils.CookieUtils;
import chitchat.utils.ResponseUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final String ACCESS_TOKEN_COOKIE_NAME = "accessToken";
    private static final String REFRESH_ENDPOINT = "/api/v1/auth/refresh";
    private static final String ME_ENDPOINT = "/api/v1/users/me";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final CookieUtils cookieUtils;
    private final ResponseUtils responseUtils;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        log.info("{} request to {}", request.getRemoteAddr(), request.getRequestURI());

        final String token = cookieUtils.getCookieValue(request.getCookies(), ACCESS_TOKEN_COOKIE_NAME);

        if (token == null && request.getRequestURI().contains(ME_ENDPOINT)) {
            responseUtils.sendUnauthorizedResponse(request, response, "Access token missing or invalid.");
            return;
        }

        if (request.getRequestURI().contains(REFRESH_ENDPOINT)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (token == null || token.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {

            final String username = jwtService.extractUsername(token, TokenType.ACCESS_TOKEN);

            if (!username.isEmpty() && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                if (jwtService.isValidToken(token, TokenType.ACCESS_TOKEN, userDetails)) {
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userDetails,
                            null,
                            userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContext context = SecurityContextHolder.createEmptyContext();
                    context.setAuthentication(authentication);
                    SecurityContextHolder.setContext(context);
                }
            }
            filterChain.doFilter(request, response);

        } catch (Exception e) {
            log.error(e.getMessage());
            responseUtils.sendUnauthorizedResponse(request, response, e.getMessage());
        }
    }
}
