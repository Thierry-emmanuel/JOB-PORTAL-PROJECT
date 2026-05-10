package JobPortal.project.notification.Repository;

import JobPortal.project.auth.Model.User;
import JobPortal.project.notification.Model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);
    
    long countByRecipientAndIsReadFalse(User recipient);
}
