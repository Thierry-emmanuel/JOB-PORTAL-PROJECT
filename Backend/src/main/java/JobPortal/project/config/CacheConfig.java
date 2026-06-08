package JobPortal.project.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

/**
 * Caffeine cache configuration for KORA Job Portal.
 *
 * Cache strategy per data type:
 *
 *  jobListings        – public paginated listings, TTL 5 min  (high read, changes when employer posts)
 *  jobListingDetail   – single job detail by UUID, TTL 10 min (stable, evicted on update/delete)
 *  jobCategories      – category list, TTL 60 min            (very stable, seeded data)
 *  jobLocations       – location list, TTL 60 min            (very stable, seeded data)
 *  jobSkills          – skill list, TTL 60 min               (very stable, seeded data)
 *  heroConfig         – homepage hero content, TTL 30 min    (admin-edited, evicted on save)
 *  faqs               – FAQ list, TTL 30 min                 (admin-edited, evicted on change)
 *  marketInsights     – salary/demand stats, TTL 60 min      (heavy aggregation query)
 *  seekerProfile      – job seeker profile by id, TTL 10 min (evicted on update)
 *  employerProfile    – employer profile by id, TTL 10 min   (evicted on update)
 *  seekerApplications – paginated applications per seeker, TTL 5 min  (evicted on apply/withdraw/status change)
 *  applicationStats   – aggregate stats per job/seeker, TTL 5 min     (evicted on any application change)
 *  jobInterviews      – paginated interviews per job posting, TTL 5 min (evicted on schedule/reschedule/result)
 */
@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(Arrays.asList(
                build("jobListings",        5,  500),   // 5 min TTL, up to 500 entries (paginated results)
                build("jobListingDetail",   10, 200),   // 10 min TTL, up to 200 single-job entries
                build("jobCategories",      60, 50),    // 60 min TTL, small seeded list
                build("jobLocations",       60, 100),   // 60 min TTL, small seeded list
                build("jobSkills",          60, 300),   // 60 min TTL, skill catalog
                build("heroConfig",         30, 2),     // 30 min TTL, single entry (id=1 + default)
                build("faqs",               30, 10),    // 30 min TTL, small list
                build("marketInsights",     60, 10),    // 60 min TTL, heavy aggregation
                build("seekerProfile",      10, 500),   // 10 min TTL, per-user profile
                build("employerProfile",    10, 200),   // 10 min TTL, per-employer profile
                build("seekerApplications", 5,  1000),  // 5 min TTL, per-seeker paginated application list
                build("applicationStats",   5,  500),   // 5 min TTL, aggregate stats per job or seeker
                build("jobInterviews",      5,  500)    // 5 min TTL, paginated interviews per job posting
        ));
        return manager;
    }

    private CaffeineCache build(String name, long ttlMinutes, long maxSize) {
        return new CaffeineCache(name,
                Caffeine.newBuilder()
                        .expireAfterWrite(ttlMinutes, TimeUnit.MINUTES)
                        .maximumSize(maxSize)
                        .recordStats()          // enables cache hit/miss metrics in logs
                        .build());
    }
}