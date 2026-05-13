package JobPortal.project.JobListing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Pre-seeded geographic reference table.
 * Normalises city/country data across job listings.
 * Maps to {@code job_listing_locations}.
 */
@Entity
@Table(name = "job_listing_locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(nullable = false, length = 100)
    private String country;

    private Double latitude;
    private Double longitude;
}
