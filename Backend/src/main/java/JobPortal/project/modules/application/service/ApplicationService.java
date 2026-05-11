package JobPortal.project.modules.application.service;

import JobPortal.project.modules.application.dto.request.ApplicationFilterRequest;
import JobPortal.project.modules.application.dto.request.CreateApplicationRequest;
import JobPortal.project.modules.application.dto.request.UpdateApplicationStatusRequest;
import JobPortal.project.modules.application.dto.response.ApplicationPageResponse;
import JobPortal.project.modules.application.dto.response.ApplicationResponse;
import JobPortal.project.modules.application.dto.response.ApplicationStatsResponse;

import java.util.List;
import java.util.UUID;

public interface ApplicationService {

    /**
     * Submit a new application for a job posting.
     * Throws if the seeker has already applied or the posting is closed.
     */
    ApplicationResponse apply(UUID seekerId, CreateApplicationRequest request);

    /**
     * Retrieve a single application by its ID.
     * Access is restricted: seekers may only view their own; employers their postings'; admins all.
     */
    ApplicationResponse getById(UUID applicationId);

    /**
     * Paginated list of applications filtered by seeker, employer, job posting or status.
     */
    ApplicationPageResponse getAll(ApplicationFilterRequest filter);

    /**
     * Transition an application to a new status.
     * Uses optimistic concurrency via expectedStatus to prevent lost updates.
     */
    ApplicationResponse updateStatus(UUID applicationId, UpdateApplicationStatusRequest request);

    /**
     * Seeker withdraws their own application.
     * Only allowed while the application is in a withdrawable state (APPLIED or SHORTLISTED).
     */
    void withdraw(UUID applicationId, UUID seekerId);

    /**
     * All applications for a seeker with their interviews eagerly loaded in a single query.
     * Prefer this over getAll(filter) when the caller needs interview data for every application,
     * as it avoids N+1 queries.
     */
    List<ApplicationResponse> getWithInterviewsBySeekerId(UUID seekerId);

    /**
     * Aggregate statistics for a job posting or a seeker.
     * Exactly one of jobPostingId / seekerId must be non-null.
     */
    ApplicationStatsResponse getStats(UUID jobPostingId, UUID seekerId);
}


