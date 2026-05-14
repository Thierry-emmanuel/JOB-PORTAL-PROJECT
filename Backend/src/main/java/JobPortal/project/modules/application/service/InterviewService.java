package JobPortal.project.modules.application.service;

import JobPortal.project.modules.application.dto.request.RescheduleInterviewRequest;
import JobPortal.project.modules.application.dto.request.ScheduleInterviewRequest;
import JobPortal.project.modules.application.dto.response.ApplicationResponse;
import JobPortal.project.modules.application.dto.response.InterviewPageResponse;
import JobPortal.project.modules.application.dto.response.InterviewResponse;
import JobPortal.project.modules.application.enums.InterviewResult;
import JobPortal.project.modules.application.enums.InterviewType;

import java.time.LocalDateTime;
import java.util.List;


public interface InterviewService {

    /**
     * Schedule an interview for an application that has been SHORTLISTED.
     * No ownership check — use scheduleForEmployer when the caller is an employer.
     */
    InterviewResponse schedule(Long applicationId, ScheduleInterviewRequest request);

    /**
     * Schedule an interview on behalf of an employer.
     * Validates that the application's job posting belongs to the given employer
     * before scheduling — throws AccessDeniedException (403) if not.
     */
    InterviewResponse scheduleForEmployer(Long employerId, Long applicationId,
                                          ScheduleInterviewRequest request);

    /**
     * Retrieve a single interview by its own ID.
     */
    InterviewResponse getById(Long interviewId);

    /**
     * Retrieve the interview linked to a specific application.
     */
    InterviewResponse getByApplicationId(Long applicationId);

    /**
     * All interviews for a seeker.
     */
    InterviewPageResponse getBySeekerIdId(Long seekerId, int page, int size);

    /**
     * All interviews for a job posting.
     */
    InterviewPageResponse getByJobPostingId(Long jobPostingId, int page, int size);

    /**
     * All SHORTLISTED applications for a job posting that are eligible for interview
     * scheduling (i.e. not yet assigned an interview).
     */
    List<ApplicationResponse> getShortlistedForPosting(Long jobPostingId);

    /**
     * Paginated interviews for a seeker.
     */
    InterviewPageResponse getBySeekerIdPaged(Long seekerId, int page, int size);

    /**
     * Paginated interviews filtered by interview type (VIDEO, PHONE, IN_PERSON).
     */
    InterviewPageResponse getByType(InterviewType type, int page, int size);

    /**
     * All interviews across all seekers/postings within a time window (admin).
     */
    InterviewPageResponse getInDateRange(LocalDateTime from, LocalDateTime to, int page, int size);

    /**
     * All interviews for a specific seeker within a time window.
     */
    InterviewPageResponse getSeekerInterviewsInDateRange(Long seekerId, LocalDateTime from, LocalDateTime to, int page, int size);

    /**
     * All pending interviews (no result yet, scheduled in the future) across the platform (admin).
     */
    InterviewPageResponse getAllPending(int page, int size);

    /**
     * All pending interviews for a specific seeker.
     */
    InterviewPageResponse getPendingBySeekerId(Long seekerId, int page, int size);

    /**
     * Lightweight lookup of an interview by application — no eager join.
     */
    InterviewResponse getByApplicationIdSimple(Long applicationId);

    /**
     * Move the interview to a new date/time.
     * Throws if the interview is already completed.
     */
    InterviewResponse reschedule(Long interviewId, RescheduleInterviewRequest request);

    /**
     * Record the outcome of a completed interview.
     * Cascades application status: PASSED → HIRED, FAILED / NO_SHOW → REJECTED.
     */
    InterviewResponse recordResult(Long interviewId, InterviewResult result, String feedback);

    /**
     * Add or replace textual feedback on an interview.
     */
    InterviewResponse addFeedback(Long interviewId, String feedback);

    /**
     * Cancel a pending interview.
     * Throws if the interview already has a recorded result.
     */
    void cancel(Long interviewId);
}


