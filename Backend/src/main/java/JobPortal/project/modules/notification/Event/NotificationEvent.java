package JobPortal.project.modules.notification.event;

import JobPortal.project.modules.auth.model.User;
import JobPortal.project.enums.NotificationType;
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



