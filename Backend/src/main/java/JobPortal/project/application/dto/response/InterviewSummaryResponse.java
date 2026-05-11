package JobPortal.project.application.dto.response;

import JobPortal.project.application.enums.InterviewResult;
import JobPortal.project.application.enums.InterviewType;

import java.time.LocalDateTime;
import java.util.UUID;


public record InterviewSummaryResponse(

        UUID id,
        LocalDateTime scheduledAt,
        InterviewType type,
        String platform,
        String meetingLink,
        InterviewResult result,
        boolean completed,
        boolean pending
) {}