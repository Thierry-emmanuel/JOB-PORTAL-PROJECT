package JobPortal.project.modules.notification.repository;

import JobPortal.project.modules.auth.model.User;
import JobPortal.project.modules.notification.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

    long countByRecipientAndIsReadFalse(User recipient);

    /**
     * Single bulk-update: avoids loading all notifications into memory
     * and issuing N individual UPDATE statements.
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipient = :user AND n.isRead = false")
    void markAllReadForUser(@Param("user") User user);
}
