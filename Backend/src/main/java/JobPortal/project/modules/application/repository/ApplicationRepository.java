package JobPortal.project.modules.application.repository;

import JobPortal.project.modules.application.enums.ApplicationStatus;
import JobPortal.project.modules.application.model.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Data access for Application entities.
 *
 * IMPORTANT: job_listings.id is stored as VARCHAR(36) standard UUID string
 * (e.g. "550e8400-e29b-41d4-a716-446655440000"), NOT as binary(16).
 * Therefore BIN_TO_UUID() must NOT be used. The numeric job_posting_id is
 * derived via CONV(SUBSTRING(jp.id, 1, 8), 16, 10) which reads the first
 * 8 hex chars of the UUID string — kept in sync with JobListingMapper.toNumericId().
 */
@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // ─── Existence checks ────────────────────────────────────────────────────

    boolean existsBySeekerIdAndJobPostingId(Long seekerId, Long jobPostingId);

    /**
     * Confirms that a given application belongs to a job posting owned by the given employer.
     * Used for ownership validation before an employer acts on an application.
     * Native SQL: job_listings lives in a separate module/table outside this JPA context.
     *
     * FIX: replaced BIN_TO_UUID(jp.id) with CONV(SUBSTRING(jp.id,1,8),16,10) because
     * job_listings.id is varchar(36), not binary(16).
     */
    @Query(value = """
            SELECT COUNT(*) > 0
            FROM applications a
            JOIN job_listings jp ON CONV(SUBSTRING(jp.id, 1, 8), 16, 10) = a.job_posting_id
            WHERE a.id = :applicationId
            AND jp.employer_id = :employerId
            """, nativeQuery = true)
    boolean existsByIdAndEmployerId(
            @Param("applicationId") Long applicationId,
            @Param("employerId") String employerId);

    // ─── Single-record lookups ────────────────────────────────────────────────

    Optional<Application> findBySeekerIdAndJobPostingId(Long seekerId, Long jobPostingId);

    // ─── Seeker-scoped queries ────────────────────────────────────────────────

    Page<Application> findBySeekerId(Long seekerId, Pageable pageable);

    Page<Application> findBySeekerIdAndStatus(Long seekerId, ApplicationStatus status, Pageable pageable);

    List<Application> findBySeekerIdAndStatus(Long seekerId, ApplicationStatus status);

    long countByStatus(ApplicationStatus status);

    long countBySeekerId(Long seekerId);

    long countBySeekerIdAndStatus(Long seekerId, ApplicationStatus status);

    // ─── Job-posting-scoped queries ───────────────────────────────────────────

    Page<Application> findByJobPostingId(Long jobPostingId, Pageable pageable);

    Page<Application> findByJobPostingIdAndStatus(Long jobPostingId, ApplicationStatus status, Pageable pageable);

    List<Application> findByJobPostingIdAndStatus(Long jobPostingId, ApplicationStatus status);

    long countByJobPostingId(Long jobPostingId);

    long countByJobPostingIdAndStatus(Long jobPostingId, ApplicationStatus status);

    // ─── Employer-scoped queries (across all their postings) ─────────────────
    // Native SQL: job_listings lives in a separate module, not visible as a JPQL entity.
    //
    // FIX: All queries below replaced BIN_TO_UUID(jp.id) with CONV(SUBSTRING(jp.id,1,8),16,10).
    // job_listings.id is varchar(36) UUID string; BIN_TO_UUID only applies to binary(16).

    @Query(value = """
            SELECT a.* FROM applications a
            WHERE a.job_posting_id IN (
                SELECT CONV(SUBSTRING(jp.id, 1, 8), 16, 10) FROM job_listings jp WHERE jp.employer_id = :employerId
            )
            ORDER BY a.applied_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM applications a
            WHERE a.job_posting_id IN (
                SELECT CONV(SUBSTRING(jp.id, 1, 8), 16, 10) FROM job_listings jp WHERE jp.employer_id = :employerId
            )
            """,
            nativeQuery = true)
    Page<Application> findByEmployerId(@Param("employerId") String employerId, Pageable pageable);

    @Query(value = """
            SELECT a.* FROM applications a
            WHERE a.job_posting_id IN (
                SELECT CONV(SUBSTRING(jp.id, 1, 8), 16, 10) FROM job_listings jp WHERE jp.employer_id = :employerId
            )
            AND a.status = :status
            ORDER BY a.applied_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM applications a
            WHERE a.job_posting_id IN (
                SELECT CONV(SUBSTRING(jp.id, 1, 8), 16, 10) FROM job_listings jp WHERE jp.employer_id = :employerId
            )
            AND a.status = :status
            """,
            nativeQuery = true)
    Page<Application> findByEmployerIdAndStatus(
            @Param("employerId") String employerId,
            @Param("status") String status,
            Pageable pageable);

    // ─── Status bulk update ───────────────────────────────────────────────────

    @Modifying
    @Query("UPDATE Application a SET a.status = :newStatus WHERE a.id = :id AND a.status = :expectedStatus")
    int updateStatusIfExpected(
            @Param("id") Long id,
            @Param("expectedStatus") ApplicationStatus expectedStatus,
            @Param("newStatus") ApplicationStatus newStatus);

    // ─── Applications with interview eagerly joined ───────────────────────────

    @Query("SELECT a FROM Application a LEFT JOIN FETCH a.interview WHERE a.id = :id")
    Optional<Application> findByIdWithInterview(@Param("id") Long id);

    @Query("SELECT a FROM Application a LEFT JOIN FETCH a.interview WHERE a.seekerId = :seekerId")
    Page<Application> findBySeekerIdWithInterview(@Param("seekerId") Long seekerId, Pageable pageable);

    // ─── Shortlisted applications (convenience) ───────────────────────────────

    @Query("SELECT a FROM Application a WHERE a.jobPostingId = :jobPostingId AND a.status = :status")
    List<Application> findShortlistedByJobPostingId(
            @Param("jobPostingId") Long jobPostingId,
            @Param("status") ApplicationStatus status);

    // ─── Company-scoped aggregate counts (Admin analytics) ───────────────────
    // FIX: replaced BIN_TO_UUID with CONV(SUBSTRING(...)) — same varchar(36) reason.

    @Query(value = """
        SELECT COUNT(*) FROM applications a
        JOIN job_listings jp ON CONV(SUBSTRING(jp.id, 1, 8), 16, 10) = a.job_posting_id
        WHERE jp.company_id = :companyId
        """, nativeQuery = true)
    long countByCompanyId(@Param("companyId") Long companyId);

    @Query(value = """
        SELECT COUNT(*) FROM applications a
        JOIN job_listings jp ON CONV(SUBSTRING(jp.id, 1, 8), 16, 10) = a.job_posting_id
        WHERE jp.company_id = :companyId AND a.status = :status
        """, nativeQuery = true)
    long countByCompanyIdAndStatus(@Param("companyId") Long companyId, @Param("status") String status);
}