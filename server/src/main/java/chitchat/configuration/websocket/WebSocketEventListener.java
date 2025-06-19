package chitchat.configuration.websocket;

import chitchat.model.security.CustomUserDetails;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.broker.BrokerAvailabilityEvent;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketEventListener {

    // Concurrent maps to track sessions and subscriptions
    // A thread-safe map to track connected users
    private final ConcurrentHashMap<String, String> activeSessions = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> subscriptions = new ConcurrentHashMap<>();

    @EventListener
    public void handleSessionConnectEvent(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String userName = getUserNameFromHeader(headerAccessor);

        activeSessions.put(sessionId, userName);

        System.out.println("[CONNECT] Session ID = " + sessionId + ", User = " + userName);
    }

    @EventListener
    public void handleSessionConnectedEvent(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String userName = getUserNameFromHeader(headerAccessor);

        System.out.println("[CONNECTED] Session ID = " + sessionId + ", User = " + userName + " is now fully established.");
    }

    @EventListener
    public void handleSessionSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String destination = headerAccessor.getDestination();
        String userName = getUserNameFromHeader(headerAccessor);

        if (destination != null) {
            subscriptions.put(sessionId, destination);
            System.out.println("[SUBSCRIBE] Session ID = " + sessionId + ", User = " + userName + " subscribed to " + destination);
        }
    }

    @EventListener
    public void handleSessionUnsubscribeEvent(SessionUnsubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String userName = getUserNameFromHeader(headerAccessor);

        if (subscriptions.containsKey(sessionId)) {
            String destination = subscriptions.remove(sessionId);
            System.out.println("[UNSUBSCRIBE] Session ID = " + sessionId + ", User = " + userName + " unsubscribed from " + destination);
        }
    }

    @EventListener
    public void handleSessionDisconnectEvent(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        // Remove from active sessions and subscriptions
        String userName = activeSessions.remove(sessionId);
        subscriptions.remove(sessionId);

        System.out.println("[DISCONNECT] Session ID = " + sessionId + ", User: " + userName + " disconnected.");
    }

    @EventListener
    public void handleBrokerAvailabilityEvent(BrokerAvailabilityEvent event) {
        boolean isBrokerAvailable = event.isBrokerAvailable();

        if (isBrokerAvailable) {
            System.out.println("[BROKER AVAILABLE] The broker is now available.");
        } else {
            System.out.println("[BROKER UNAVAILABLE] The broker is unavailable. Avoid sending messages.");
        }
    }

    private String getUserNameFromHeader(StompHeaderAccessor headerAccessor) {
        String userName = "Anonymous";
        Object simpUser = headerAccessor.getHeader("simpUser");

        if (simpUser instanceof UsernamePasswordAuthenticationToken) {
            UsernamePasswordAuthenticationToken authenticationToken = (UsernamePasswordAuthenticationToken) simpUser;

            if (authenticationToken.getPrincipal() instanceof CustomUserDetails) {
                CustomUserDetails userDetails = (CustomUserDetails) authenticationToken.getPrincipal();
                userName = userDetails.getUsername();
            }
        }
        return userName;
    }
}
