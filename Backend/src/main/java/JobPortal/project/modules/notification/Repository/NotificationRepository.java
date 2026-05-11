package JobPortal.project.modules.notification.Repository;

import JobPortal.project.modules.auth.Model.User;
import JobPortal.project.modules.notification.Model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);
    
    long countByRecipientAndIsReadFalse(User recipient);
}



