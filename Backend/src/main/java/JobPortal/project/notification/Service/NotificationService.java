package JobPortal.project.notification.Service;

import JobPortal.project.auth.Model.User;
import JobPortal.project.notification.Enum.NotificationType;
import JobPortal.project.notification.Model.Notification;
import JobPortal.project.notification.Repository.NotificationRepository;
import JobPortal.project.auth.Enum.Role;
import JobPortal.project.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final MailService mailService;
    private final UserRepository userRepository;

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

    @Transactional
    public void sendBroadcastNotification(String title, String message, Role targetRole) {
        List<User> recipients;
        if (targetRole == null) {
            recipients = userRepository.findAll();
        } else {
            // Need a custom query in UserRepository to find by role if not already fetching list.
            // Wait, we only have countByRole. We should add findByRole to UserRepository.
            // For now, let's fetch all and filter to be safe, or just use the findByRole we will add.
            // I'll add findByRole to UserRepository shortly.
            recipients = userRepository.findAll().stream().filter(u -> u.getRole() == targetRole).toList();
        }

        List<Notification> notifications = recipients.stream().map(recipient -> 
            (Notification) Notification.builder()
                .recipient(recipient)
                .title(title)
                .message(message)
                .type(NotificationType.SYSTEM)
                .isRead(false)
                .build()
        ).collect(java.util.stream.Collectors.toList());

        notificationRepository.saveAll(notifications);
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
