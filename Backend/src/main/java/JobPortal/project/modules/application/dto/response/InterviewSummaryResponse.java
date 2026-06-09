package JobPortal.project.modules.application.dto.response;

import JobPortal.project.modules.application.enums.InterviewResult;
import JobPortal.project.modules.application.enums.InterviewType;

import java.time.LocalDateTime;



public record InterviewSummaryResponse(

        Long id,
        LocalDateTime scheduledAt,
        InterviewType type,
        String platform,
        String meetingLink,
        String notes,
        String feedback,
        InterviewResult result,
        boolean completed,
        boolean pending
) {}