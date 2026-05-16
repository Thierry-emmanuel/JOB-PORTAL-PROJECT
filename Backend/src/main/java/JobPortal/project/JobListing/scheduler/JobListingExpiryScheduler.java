package JobPortal.project.JobListing.scheduler;

import JobPortal.project.JobListing.repository.JobListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Nightly scheduler that bulk-expires job listings whose deadline has passed.
 *
 * <p>Runs at midnight UTC via a cron expression configured in {@code application.properties}
 * ({@code app.scheduler.expiry.cron}). Defaults to {@code 0 0 0 * * *} (midnight every day).
 *
 * <p>A single UPDATE query is used instead of loading and saving each entity
 * individually, keeping DB load O(1) regardless of the number of expired listings.
 *
 * <p>The expired listing count is logged for monitoring / alerting integration.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JobListingExpiryScheduler {

    private final JobListingRepository listingRepository;

    /**
     * Bulk-expire all ACTIVE listings whose deadline < today.
     *
     * <p>Cron: configurable via {@code app.scheduler.expiry.cron};
     * defaults to {@code 0 0 0 * * *} (midnight UTC daily).
     */
    @Scheduled(cron = "${app.scheduler.expiry.cron:0 0 0 * * *}")
    @Transactional
    public void expireDeadlinedListings() {
        LocalDate today = LocalDate.now();
        log.info("[JobListingExpiryScheduler] Running expiry check for date: {}", today);

        List<UUID> expiredIds = listingRepository.findExpiredListingIds(today);
        if (expiredIds.isEmpty()) {
            log.info("[JobListingExpiryScheduler] No listings to expire today.");
            return;
        }

        int updated = listingRepository.bulkExpire(expiredIds);
        log.info("[JobListingExpiryScheduler] Expired {} listing(s): {}", updated, expiredIds);
    }
}
