package JobPortal.project.JobListing.entity;

import JobPortal.project.JobListing.enums.ExperienceLevel;
import JobPortal.project.JobListing.enums.JobType;
import JobPortal.project.JobListing.enums.PostingStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Core domain entity for the Job Listing module.
 *
 * <p>Posting lifecycle:
 * <pre>
 *   DRAFT → ACTIVE → EXPIRED  (auto-expired by nightly scheduler when deadline passes)
 *                  → DELETED  (soft-deleted by employer or admin)
 * </pre>
 *
 * <p>Table: {@code job_listings}
 * <p>Indexes on high-cardinality filter columns per NFR-DB-02.
 */
@Entity
@Table(
    name = "job_listings",
    indexes = {
        @Index(name = "idx_jl_status",      columnList = "status"),
        @Index(name = "idx_jl_deadline",    columnList = "deadline"),
        @Index(name = "idx_jl_category_id", columnList = "category_id"),
        @Index(name = "idx_jl_employer_id", columnList = "employer_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobListing {

    // ── Identity ───────────────────────────────────────────────────────────────

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    // ── Ownership ──────────────────────────────────────────────────────────────

    /** FK to users(id) — the employer who owns this posting. */
    @Column(name = "employer_id", nullable = false, updatable = false)
    private UUID employerId;

    /** Denormalised employer company UUID — avoids a join for list views. */
    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    // ── Classification ─────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private JobCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private JobLocation location;

    // ── Core Fields ────────────────────────────────────────────────────────────

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", nullable = false, length = 20)
    private JobType jobType;

    @Column(name = "salary_min", precision = 15, scale = 2)
    private BigDecimal salaryMin;

    @Column(name = "salary_max", precision = 15, scale = 2)
    private BigDecimal salaryMax;

    @Enumerated(EnumType.STRING)
    @Column(name = "experience_level", length = 20)
    private ExperienceLevel experienceLevel;

    @Column(nullable = false)
    private LocalDate deadline;

    // ── Status ──────────────────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PostingStatus status = PostingStatus.DRAFT;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Integer viewCount = 0;

    // ── Skills (many-to-many via join table) ───────────────────────────────────

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "job_listing_skills",
        joinColumns        = @JoinColumn(name = "job_listing_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    @Builder.Default
    private Set<ListingSkill> skills = new HashSet<>();

    // ── Admin moderation ────────────────────────────────────────────────────────

    /** Reason stored when an admin flags or removes a listing. */
    @Column(name = "moderation_note", length = 500)
    private String moderationNote;

    // ── Audit ───────────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ── Domain helpers ──────────────────────────────────────────────────────────

    /** Transitions DRAFT → ACTIVE. Throws if not in DRAFT. */
    public void publish() {
        if (this.status != PostingStatus.DRAFT) {
            throw new IllegalStateException(
                "Only DRAFT listings can be published. Current status: " + this.status);
        }
        this.status = PostingStatus.ACTIVE;
    }

    /** Soft-deletes by setting status to DELETED. Record is retained. */
    public void softDelete() {
        this.status = PostingStatus.DELETED;
    }

    /** Called by the nightly expiry scheduler. */
    public void expire() {
        this.status = PostingStatus.EXPIRED;
    }

    /** Increments view counter on each public detail access (analytics). */
    public void incrementViewCount() {
        this.viewCount = (this.viewCount == null ? 0 : this.viewCount) + 1;
    }

    /** @return true if this listing's deadline has already passed. */
    public boolean isExpired() {
        return this.deadline != null && LocalDate.now().isAfter(this.deadline);
    }

    /** @return true when the given employer UUID owns this listing. */
    public boolean isOwnedBy(UUID ownerId) {
        return this.employerId != null && this.employerId.equals(ownerId);
    }
}
