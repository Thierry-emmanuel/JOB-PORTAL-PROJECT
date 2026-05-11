package JobPortal.project.notification.Event;

import JobPortal.project.auth.Model.User;
import JobPortal.project.notification.Enum.NotificationType;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class NotificationEvent extends ApplicationEvent {
    private final User recipient;
    private final String title;
    private final String message;
    private final NotificationType type;

    public NotificationEvent(Object source, User recipient, String title, String message, NotificationType type) {
        super(source);
        this.recipient = recipient;
        this.title = title;
        this.message = message;
        this.type = type;
    }
}
