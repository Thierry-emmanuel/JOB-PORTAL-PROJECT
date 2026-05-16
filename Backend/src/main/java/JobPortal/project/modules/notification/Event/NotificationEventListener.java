package JobPortal.project.modules.notification.Event;

import JobPortal.project.modules.notification.Service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;

    @Async
    @EventListener
    public void handleNotificationEvent(NotificationEvent event) {
        notificationService.sendNotification(
                event.getRecipient(),
                event.getTitle(),
                event.getMessage(),
                event.getType()
        );
    }
}



