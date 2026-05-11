package JobPortal.project.application.dto.request;

import JobPortal.project.application.enums.InterviewResult;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RecordInterviewResultRequest(

        @NotNull(message = "Interview result is required")
        InterviewResult result,

        @Size(max = 2000, message = "Feedback must not exceed 2000 characters")
        String feedback
) {}