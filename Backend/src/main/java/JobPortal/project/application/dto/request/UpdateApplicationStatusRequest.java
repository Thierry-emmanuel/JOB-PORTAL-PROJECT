package JobPortal.project.application.dto.request;

import JobPortal.project.application.enums.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateApplicationStatusRequest(

        @NotNull(message = "New status is required")
        ApplicationStatus newStatus,

        @NotNull(message = "Expected current status is required")
        ApplicationStatus expectedStatus
) {}