package JobPortal.project.modules.joblisting.config;

import org.springframework.context.ApplicationEvent;

import java.util.UUID;

public class JobListingDeletedEvent extends ApplicationEvent {

    private final UUID listingId;

    public JobListingDeletedEvent(Object source, UUID listingId) {
        super(source);
        this.listingId = listingId;
    }


    public UUID getListingId() {
        return listingId;
    }
}
