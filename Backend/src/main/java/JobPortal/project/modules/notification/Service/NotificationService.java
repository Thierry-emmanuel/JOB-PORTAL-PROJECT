package JobPortal.project.modules.notification.Service;

import JobPortal.project.modules.auth.Model.User;
import JobPortal.project.enums.NotificationType;
import JobPortal.project.modules.notification.Model.Notification;
import JobPortal.project.modules.notification.Repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final Set<NotificationType> EMAIL_TYPES =
            EnumSet.of(NotificationType.JOB_ALERT, NotificationType.WELCOME, NotificationType.NEW_APPLICATION);

    private final NotificationRepository notificationRepository;
    private final MailService mailService;
    private final SimpMessagingTemplate messagingTemplate;

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

        // Push real-time alert via WebSocket (fire-and-forget style)
        pushWebSocket(recipient.getId(), saved);

        // Send email asynchronously for designated types only
        if (EMAIL_TYPES.contains(type)) {
            sendEmailAsync(recipient.getEmail(), title, message);
        }

        return saved;
    }

    private void pushWebSocket(Long userId, Notification notification) {
        try {
            messagingTemplate.convertAndSend("/topic/notifications/" + userId, notification);
        } catch (Exception e) {
            log.warn("WebSocket push failed for userId={}: {}", userId, e.getMessage());
        }
    }

    /**
     * Sends email on a separate thread so SMTP latency never blocks the API response.
     */
    @Async("koraAsyncExecutor")
    public void sendEmailAsync(String to, String subject, String body) {
        try {
            mailService.sendEmail(to, subject, body);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    public List<Notification> getNotificationsForUser(User user) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByRecipientAndIsReadFalse(user);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    /**
     * Bulk update: uses a single DB query instead of a Java-side filter + saveAll.
     */
    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllReadForUser(user);
    }

    @Transactional
    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }
}
