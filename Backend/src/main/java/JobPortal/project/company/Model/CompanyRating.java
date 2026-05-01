package JobPortal.project.company.Model;

import JobPortal.project.userprofile.Model.JobSeeker;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "company_ratings",
        uniqueConstraints = @UniqueConstraint(columnNames = {"company_id", "job_seeker_id"})
)
public class CompanyRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Rating value between 1 and 5
    @Column(nullable = false)
    private Double rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(nullable = false)
    private Boolean isVisible = true;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Many ratings belong to one Company
    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    // Many ratings belong to one JobSeeker
    @ManyToOne
    @JoinColumn(name = "job_seeker_id", nullable = false)
    private JobSeeker jobSeeker;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        validateRating();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        validateRating();
    }

    // Ensures the rating is always between 1 and 5
    private void validateRating() {
        if (this.rating < 1.0 || this.rating > 5.0) {
            throw new RuntimeException("Rating must be between 1 and 5.");
        }
    }
}
