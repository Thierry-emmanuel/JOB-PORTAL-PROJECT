package JobPortal.project.modules.application.dto.response;

import JobPortal.project.modules.application.enums.InterviewResult;
import JobPortal.project.modules.application.enums.InterviewType;

import java.time.LocalDateTime;
import java.util.UUID;


public record InterviewResponse(

        UUID id,
        UUID applicationId,
        UUID seekerId,
        UUID jobPostingId,

        LocalDateTime scheduledAt,
        InterviewType type,
        String platform,
        String meetingLink,
        String feedback,
        InterviewResult result,

        boolean completed,
        boolean pending,

        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}


