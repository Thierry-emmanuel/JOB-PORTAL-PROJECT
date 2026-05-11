package JobPortal.project.application.dto.response;

import JobPortal.project.application.enums.ApplicationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;


public record ApplicationResponse(

        UUID id,
        UUID seekerId,
        UUID jobPostingId,
        String coverLetter,
        BigDecimal expectedSalary,
        ApplicationStatus status,

        InterviewSummaryResponse interview,

        boolean terminal,
        boolean withdrawable,
        boolean hasInterview,

        LocalDateTime appliedAt,
        LocalDateTime lastUpdatedAt
) {}