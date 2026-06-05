package JobPortal.project.modules.application.dto.response;

import JobPortal.project.modules.application.enums.ApplicationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;



public record ApplicationResponse(

        Long id,
        Long seekerId,
        Long jobPostingId,
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


