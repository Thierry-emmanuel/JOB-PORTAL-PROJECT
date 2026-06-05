package JobPortal.project.modules.application.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateApplicationReviewRequest(
        @Size(max = 2000, message = "Review notes cannot exceed 2000 characters")
        String review
) {}
