package JobPortal.project.JobListing.repository;

import JobPortal.project.JobListing.entity.JobListing;
import JobPortal.project.JobListing.enums.PostingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Persistence layer for {@link JobListing}.
 *
 * <ul>
 *   <li>Extends {@link JpaSpecificationExecutor} to support dynamic multi-criteria
 *       filtering via {@code JobListingSpecification}.</li>
 *   <li>Custom JPQL queries JOIN FETCH associations to avoid N+1 on list views.</li>
 * </ul>
 */
@Repository
public interface JobListingRepository
        extends JpaRepository<JobListing, UUID>, JpaSpecificationExecutor<JobListing> {

    // ── Employer-scoped ───────────────────────────────────────────────────────

    /**
     * All non-deleted listings for an employer, most recent first.
     * Used on the employer dashboard.
     */
    @Query("""
        SELECT jl FROM JobListing jl
        JOIN FETCH jl.category
        LEFT JOIN FETCH jl.location
        WHERE jl.employerId = :employerId
          AND jl.status <> JobPortal.project.JobListing.enums.PostingStatus.DELETED
        ORDER BY jl.createdAt DESC
        """)
    Page<JobListing> findAllByEmployerId(@Param("employerId") Long employerId, Pageable pageable);

    /**
     * Single listing owned by the given employer (prevents IDOR).
     */
    @Query("""
        SELECT jl FROM JobListing jl
        JOIN FETCH jl.category
        LEFT JOIN FETCH jl.location
        LEFT JOIN FETCH jl.skills
        WHERE jl.id = :id
          AND jl.employerId = :employerId
          AND jl.status <> JobPortal.project.JobListing.enums.PostingStatus.DELETED
        """)
    Optional<JobListing> findByIdAndEmployerId(
            @Param("id") UUID id,
            @Param("employerId") Long employerId);

    // ── Public ────────────────────────────────────────────────────────────────

    /**
     * Public detail view — only ACTIVE listings are served to job seekers.
     */
    @Query("""
        SELECT jl FROM JobListing jl
        JOIN FETCH jl.category
        LEFT JOIN FETCH jl.location
        LEFT JOIN FETCH jl.skills
        WHERE jl.id = :id
          AND jl.status = JobPortal.project.JobListing.enums.PostingStatus.ACTIVE
        """)
    Optional<JobListing> findActiveById(@Param("id") UUID id);

    // ── Admin ─────────────────────────────────────────────────────────────────

    /**
     * Admin view: any listing regardless of status, with optional filters.
     */
    @Query("""
        SELECT jl FROM JobListing jl
        JOIN FETCH jl.category
        LEFT JOIN FETCH jl.location
        WHERE (:status IS NULL OR jl.status = :status)
          AND (:employerId IS NULL OR jl.employerId = :employerId)
        ORDER BY jl.createdAt DESC
        """)
    Page<JobListing> findAllForAdmin(
            @Param("status")     PostingStatus status,
            @Param("employerId") Long employerId,
            Pageable pageable);

    // ── Scheduler ─────────────────────────────────────────────────────────────

    /** Returns IDs of all ACTIVE listings whose deadline has passed. */
    @Query("SELECT jl.id FROM JobListing jl WHERE jl.status = 'ACTIVE' AND jl.deadline < :today")
    List<UUID> findExpiredListingIds(@Param("today") LocalDate today);

    /** Bulk-updates status to EXPIRED — single UPDATE, no N+1. */
    @Modifying
    @Query("UPDATE JobListing jl SET jl.status = 'EXPIRED' WHERE jl.id IN :ids")
    int bulkExpire(@Param("ids") List<UUID> ids);

    // ── Counts (admin dashboard) ───────────────────────────────────────────────

    long countByStatus(PostingStatus status);
    long countByEmployerId(Long employerId);

    // ── Market Insights ───────────────────────────────────────────────────────

    @Query("""
        SELECT new JobPortal.project.JobListing.dto.response.SalaryAggregationResponse(
            c.name, AVG(jl.salaryMin), AVG(jl.salaryMax), COUNT(jl)
        )
        FROM JobListing jl
        JOIN jl.category c
        WHERE jl.status = 'ACTIVE' AND jl.salaryMin IS NOT NULL AND jl.salaryMax IS NOT NULL
        GROUP BY c.name
    """)
    List<JobPortal.project.JobListing.dto.response.SalaryAggregationResponse> getAverageSalaryByCategory();

    @Query("""
        SELECT YEAR(jl.createdAt) as yr, MONTH(jl.createdAt) as mo, COUNT(jl) as cnt
        FROM JobListing jl
        WHERE jl.status = 'ACTIVE'
        GROUP BY YEAR(jl.createdAt), MONTH(jl.createdAt)
        ORDER BY yr ASC, mo ASC
    """)
    List<Object[]> getDemandTrendsRaw();
}
