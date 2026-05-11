package JobPortal.project.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddFeedbackRequest(

        @NotBlank(message = "Feedback must not be blank")
        @Size(max = 2000, message = "Feedback must not exceed 2000 characters")
        String feedback
) {}