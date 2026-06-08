package JobPortal.project.modules.application.dto.response;

import JobPortal.project.modules.application.enums.ApplicationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;


public record ApplicationResponse(

        Long id,
        Long seekerId,
        Long jobPostingId,

        /**
         * UUID string of the JobListing — use this for GET /api/jobs/{jobListingId}/detail.
         * Null for applications created before this field was added; fall back to jobPostingId in that case.
         */
        String jobListingId,

        String coverLetter,
        BigDecimal expectedSalary,
        ApplicationStatus status,

        InterviewSummaryResponse interview,

        String employerReview,

        boolean terminal,
        boolean withdrawable,
        boolean hasInterview,

        LocalDateTime appliedAt,
        LocalDateTime lastUpdatedAt
) {}