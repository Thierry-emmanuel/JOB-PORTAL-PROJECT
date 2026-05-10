package JobPortal.project.application.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record RescheduleInterviewRequest(

        @NotNull(message = "New scheduled date/time is required")
        @Future(message = "Rescheduled interview must be set in the future")
        LocalDateTime newScheduledAt,

        @Size(max = 512, message = "Meeting link must not exceed 512 characters")
        String meetingLink
) {}