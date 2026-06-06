package JobPortal.project.modules.joblisting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Skill reference table, shared across job listings.
 * Maps to {@code listing_skills}.
 */
@Entity
@Table(name = "listing_skills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;
}
