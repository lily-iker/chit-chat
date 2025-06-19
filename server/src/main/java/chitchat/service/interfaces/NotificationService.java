package chitchat.service.interfaces;

public interface NotificationService {
    void sendNotification(String destination, Object payload);
}
