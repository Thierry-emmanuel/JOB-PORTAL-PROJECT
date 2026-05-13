package JobPortal.project.modules.application.repository;

import JobPortal.project.modules.application.enums.InterviewResult;
import JobPortal.project.modules.application.enums.InterviewType;
import JobPortal.project.modules.application.model.Interview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {

    // ─── Lookup by application ────────────────────────────────────────────────

    Optional<Interview> findByApplicationId(Long applicationId);

    boolean existsByApplicationId(Long applicationId);

    // ─── Lookup with application eagerly fetched ──────────────────────────────

    @Query("SELECT i FROM Interview i JOIN FETCH i.application WHERE i.id = :id")
    Optional<Interview> findByIdWithApplication(@Param("id") Long id);

    @Query("SELECT i FROM Interview i JOIN FETCH i.application WHERE i.application.id = :applicationId")
    Optional<Interview> findByApplicationIdWithApplication(@Param("applicationId") Long applicationId);

    // ─── Seeker-scoped queries ────────────────────────────────────────────────

    @Query("""
            SELECT i FROM Interview i
            JOIN FETCH i.application a
            WHERE a.seekerId = :seekerId
            """)
    List<Interview> findBySeekerIdWithApplication(@Param("seekerId") Long seekerId);

    @Query("""
            SELECT i FROM Interview i
            JOIN i.application a
            WHERE a.seekerId = :seekerId
            """)
    Page<Interview> findBySeekerId(@Param("seekerId") Long seekerId, Pageable pageable);

    @Query("""
            SELECT i FROM Interview i
            JOIN i.application a
            WHERE a.seekerId = :seekerId AND i.result = :result
            """)
    List<Interview> findBySeekerIdAndResult(
            @Param("seekerId") Long seekerId,
            @Param("result") InterviewResult result);

    // ─── Employer/job-posting-scoped queries ──────────────────────────────────

    @Query("""
            SELECT i FROM Interview i
            JOIN i.application a
            WHERE a.jobPostingId = :jobPostingId
            """)
    List<Interview> findByJobPostingId(@Param("jobPostingId") Long jobPostingId);

    @Query("""
            SELECT i FROM Interview i
            JOIN i.application a
            WHERE a.jobPostingId = :jobPostingId
            AND i.result = :result
            """)
    List<Interview> findByJobPostingIdAndResult(
            @Param("jobPostingId") Long jobPostingId,
            @Param("result") InterviewResult result);

    // ─── Scheduled-time window queries ───────────────────────────────────────

    List<Interview> findByScheduledAtBetween(LocalDateTime from, LocalDateTime to);

    @Query("""
            SELECT i FROM Interview i
            JOIN i.application a
            WHERE a.seekerId = :seekerId
            AND i.scheduledAt BETWEEN :from AND :to
            """)
    List<Interview> findBySeekerIdAndScheduledAtBetween(
            @Param("seekerId") Long seekerId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // ─── Pending / upcoming interviews (no result yet, scheduled in future) ───

    @Query("SELECT i FROM Interview i WHERE i.result IS NULL AND i.scheduledAt > :now")
    List<Interview> findAllPending(@Param("now") LocalDateTime now);

    @Query("""
            SELECT i FROM Interview i
            JOIN i.application a
            WHERE a.seekerId = :seekerId
            AND i.result IS NULL
            AND i.scheduledAt > :now
            """)
    List<Interview> findPendingBySeekerId(
            @Param("seekerId") Long seekerId,
            @Param("now") LocalDateTime now);

    // ─── Filter by type ───────────────────────────────────────────────────────

    Page<Interview> findByType(InterviewType type, Pageable pageable);

    // ─── Count helpers ────────────────────────────────────────────────────────

    @Query("SELECT COUNT(i) FROM Interview i WHERE i.result = :result")
    long countByResult(@Param("result") InterviewResult result);

    @Query("""
            SELECT COUNT(i) FROM Interview i
            JOIN i.application a
            WHERE a.jobPostingId = :jobPostingId
            """)
    long countByJobPostingId(@Param("jobPostingId") Long jobPostingId);

    @Query("""
            SELECT COUNT(i) FROM Interview i
            JOIN i.application a
            WHERE a.jobPostingId = :jobPostingId
            AND i.result = :result
            """)
    long countByJobPostingIdAndResult(
            @Param("jobPostingId") Long jobPostingId,
            @Param("result") InterviewResult result);

    @Query("""
            SELECT COUNT(i) FROM Interview i
            JOIN i.application a
            WHERE a.seekerId = :seekerId
            """)
    long countBySeekerId(@Param("seekerId") Long seekerId);

    @Query("""
            SELECT COUNT(i) FROM Interview i
            JOIN i.application a
            WHERE a.seekerId = :seekerId
            AND i.result = :result
            """)
    long countBySeekerIdAndResult(
            @Param("seekerId") Long seekerId,
            @Param("result") InterviewResult result);
}


