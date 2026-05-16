package JobPortal.project.modules.application.model;

import JobPortal.project.modules.application.enums.ApplicationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "applications",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_application_seeker_posting",
                columnNames = {"seeker_id", "job_posting_id"}
        ),
        indexes = {
                @Index(name = "idx_application_seeker_id",      columnList = "seeker_id"),
                @Index(name = "idx_application_job_posting_id", columnList = "job_posting_id"),
                @Index(name = "idx_application_status",         columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "seeker_id", nullable = false, updatable = false)
    private Long seekerId;

    @Column(name = "job_posting_id", nullable = false, updatable = false)
    private Long jobPostingId;

    @Column(name = "cover_letter", length = 1000)
    private String coverLetter;

    @Column(name = "expected_salary", precision = 12, scale = 2)
    private BigDecimal expectedSalary;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    @OneToOne(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Interview interview;

    @CreationTimestamp
    @Column(name = "applied_at", nullable = false, updatable = false)
    private LocalDateTime appliedAt;

    @UpdateTimestamp
    @Column(name = "last_updated_at", nullable = false)
    private LocalDateTime lastUpdatedAt;

    @Transient
    public boolean isTerminal() {
        return status == ApplicationStatus.HIRED || status == ApplicationStatus.REJECTED;
    }

    @Transient
    public boolean isWithdrawable() {
        return status == ApplicationStatus.APPLIED || status == ApplicationStatus.SHORTLISTED;
    }

    @Transient
    public boolean hasInterview() {
        return interview != null;
    }
}


