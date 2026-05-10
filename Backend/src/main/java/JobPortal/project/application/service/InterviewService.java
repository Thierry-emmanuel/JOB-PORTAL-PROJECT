package JobPortal.project.application.service;

import JobPortal.project.application.dto.request.RescheduleInterviewRequest;
import JobPortal.project.application.dto.request.ScheduleInterviewRequest;
import JobPortal.project.application.dto.response.ApplicationResponse;
import JobPortal.project.application.dto.response.InterviewPageResponse;
import JobPortal.project.application.dto.response.InterviewResponse;
import JobPortal.project.application.enums.InterviewResult;
import JobPortal.project.application.enums.InterviewType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface InterviewService {

    /**
     * Schedule an interview for an application that has been SHORTLISTED.
     * No ownership check — use scheduleForEmployer when the caller is an employer.
     */
    InterviewResponse schedule(UUID applicationId, ScheduleInterviewRequest request);

    /**
     * Schedule an interview on behalf of an employer.
     * Validates that the application's job posting belongs to the given employer
     * before scheduling — throws AccessDeniedException (403) if not.
     */
    InterviewResponse scheduleForEmployer(UUID employerId, UUID applicationId,
                                          ScheduleInterviewRequest request);

    /**
     * Retrieve a single interview by its own ID.
     */
    InterviewResponse getById(UUID interviewId);

    /**
     * Retrieve the interview linked to a specific application.
     */
    InterviewResponse getByApplicationId(UUID applicationId);

    /**
     * All interviews for a seeker.
     */
    List<InterviewResponse> getBySeekerIdId(UUID seekerId);

    /**
     * All interviews for a job posting.
     */
    List<InterviewResponse> getByJobPostingId(UUID jobPostingId);

    /**
     * All SHORTLISTED applications for a job posting that are eligible for interview
     * scheduling (i.e. not yet assigned an interview).
     */
    List<ApplicationResponse> getShortlistedForPosting(UUID jobPostingId);

    /**
     * Paginated interviews for a seeker.
     */
    InterviewPageResponse getBySeekerIdPaged(UUID seekerId, int page, int size);

    /**
     * Paginated interviews filtered by interview type (VIDEO, PHONE, IN_PERSON).
     */
    InterviewPageResponse getByType(InterviewType type, int page, int size);

    /**
     * All interviews across all seekers/postings within a time window (admin).
     */
    List<InterviewResponse> getInDateRange(LocalDateTime from, LocalDateTime to);

    /**
     * All interviews for a specific seeker within a time window.
     */
    List<InterviewResponse> getSeekerInterviewsInDateRange(UUID seekerId, LocalDateTime from, LocalDateTime to);

    /**
     * All pending interviews (no result yet, scheduled in the future) across the platform (admin).
     */
    List<InterviewResponse> getAllPending();

    /**
     * All pending interviews for a specific seeker.
     */
    List<InterviewResponse> getPendingBySeekerId(UUID seekerId);

    /**
     * Lightweight lookup of an interview by application — no eager join.
     */
    InterviewResponse getByApplicationIdSimple(UUID applicationId);

    /**
     * Move the interview to a new date/time.
     * Throws if the interview is already completed.
     */
    InterviewResponse reschedule(UUID interviewId, RescheduleInterviewRequest request);

    /**
     * Record the outcome of a completed interview.
     * Cascades application status: PASSED → HIRED, FAILED / NO_SHOW → REJECTED.
     */
    InterviewResponse recordResult(UUID interviewId, InterviewResult result, String feedback);

    /**
     * Add or replace textual feedback on an interview.
     */
    InterviewResponse addFeedback(UUID interviewId, String feedback);

    /**
     * Cancel a pending interview.
     * Throws if the interview already has a recorded result.
     */
    void cancel(UUID interviewId);
}