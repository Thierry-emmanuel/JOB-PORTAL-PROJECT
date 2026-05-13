package JobPortal.project.JobListing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Reference table of job categories (e.g. IT, Finance, Healthcare).
 * Pre-seeded via {@code DataInitializer}. Used for filtering and reporting.
 * Maps to {@code job_listing_categories}.
 */
@Entity
@Table(name = "job_listing_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    /** URL-friendly slug, e.g. "information-technology" */
    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(name = "icon_url")
    private String iconUrl;

    @Column(columnDefinition = "TEXT")
    private String description;
}
