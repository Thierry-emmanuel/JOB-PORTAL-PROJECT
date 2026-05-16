package JobPortal.project.modules.application.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;


public record CreateApplicationRequest(

        @NotNull(message = "Job posting ID is required")
        Long jobPostingId,

        @Size(max = 1000, message = "Cover letter must not exceed 1000 characters")
        String coverLetter,

        @DecimalMin(value = "0.0", inclusive = false, message = "Expected salary must be positive")
        @Digits(integer = 10, fraction = 2, message = "Expected salary must have at most 10 integer digits and 2 decimal places")
        BigDecimal expectedSalary
) {}


