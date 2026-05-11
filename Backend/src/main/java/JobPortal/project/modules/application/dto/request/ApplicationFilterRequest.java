package JobPortal.project.modules.application.dto.request;

import JobPortal.project.modules.application.enums.ApplicationStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.UUID;


public record ApplicationFilterRequest(

        UUID seekerId,

        UUID jobPostingId,

        UUID employerId,

        ApplicationStatus status,

        @Min(value = 0, message = "Page index must be >= 0")
        int page,

        @Min(value = 1, message = "Page size must be >= 1")
        @Max(value = 100, message = "Page size must be <= 100")
        int size
) {
    /** Canonical defaults: first page, 20 items. */
    public ApplicationFilterRequest {
        if (size == 0) size = 20;
    }
}


