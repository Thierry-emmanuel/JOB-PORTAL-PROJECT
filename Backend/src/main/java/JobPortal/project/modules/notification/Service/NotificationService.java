package JobPortal.project.modules.notification.Service;

import JobPortal.project.modules.auth.Model.User;
import JobPortal.project.enums.NotificationType;
import JobPortal.project.modules.notification.Model.Notification;
import JobPortal.project.modules.notification.Repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final MailService mailService;

    @Transactional
    public Notification sendNotification(User recipient, String title, String message, NotificationType type) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .title(title)
                .message(message)
                .type(type)
                .isRead(false)
                .build();
        
        Notification saved = notificationRepository.save(notification);

        // Send email for critical notifications or based on user settings (if implemented)
        if (type == NotificationType.JOB_ALERT || type == NotificationType.WELCOME || type == NotificationType.NEW_APPLICATION) {
            try {
                mailService.sendEmail(recipient.getEmail(), title, message);
            } catch (Exception e) {
                // Log error but don't fail notification creation
                System.err.println("Failed to send email: " + e.getMessage());
            }
        }

        return saved;
    }

    public List<Notification> getNotificationsForUser(User user) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByRecipientAndIsReadFalse(user);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unread = notificationRepository.findByRecipientOrderByCreatedAtDesc(user)
                .stream()
                .filter(n -> !n.isRead())
                .toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }
}



