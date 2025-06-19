package chitchat.service.implement;

import chitchat.service.interfaces.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    @Async
    @Override
    public void sendNotification(String destination, Object payload) {
//        try {
//            Thread.sleep(5000);
//        } catch (InterruptedException e) {
//            Thread.currentThread().interrupt();
//            throw new RuntimeException("Notification sending interrupted", e);
//        }
        messagingTemplate.convertAndSend(destination, payload);
    }
}
