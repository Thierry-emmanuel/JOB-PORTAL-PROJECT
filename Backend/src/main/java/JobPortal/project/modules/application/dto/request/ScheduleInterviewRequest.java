package JobPortal.project.modules.application.dto.request;

import JobPortal.project.modules.application.enums.InterviewType;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

public record ScheduleInterviewRequest(

        @NotNull(message = "Scheduled date/time is required")
        @Future(message = "Interview must be scheduled in the future")
        LocalDateTime scheduledAt,

        @NotNull(message = "Interview type is required")
        InterviewType type,

        @Size(max = 100, message = "Platform name must not exceed 100 characters")
        String platform,

        @Size(max = 512, message = "Meeting link must not exceed 512 characters")
        String meetingLink
) {}


