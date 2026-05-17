package JobPortal.project.JobListing.dto.request;

import JobPortal.project.JobListing.enums.ExperienceLevel;
import JobPortal.project.JobListing.enums.JobType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

/**
 * Request body for {@code POST /api/jobs} — employer creates a new job listing.
 * All fields are validated via Bean Validation before reaching the service layer.
 */
@Schema(description = "Payload to create a new job listing")
public record JobListingCreateRequest(

    @NotBlank(message = "Job title is required")
    @Size(min = 3, max = 200, message = "Title must be 3–200 characters")
    @Schema(description = "Title of the role", example = "Senior Java Developer")
    String title,

    @NotBlank(message = "Description is required")
    @Size(min = 50, message = "Description must be at least 50 characters")
    @Schema(description = "Full job description (HTML or plain text)")
    String description,

    @NotNull(message = "Category UUID is required")
    @Schema(description = "UUID of the job category")
    UUID categoryId,

    @NotNull(message = "Company ID is required")
    @Schema(description = "ID of the employer's company to associate this listing with")
    Long companyId,

    @Schema(description = "UUID of the location (null = remote/unspecified)")
    UUID locationId,

    @NotNull(message = "Contract type is required")
    @Schema(description = "Contract type: CDI, CDD, INTERNSHIP, FREELANCE")
    JobType jobType,

    @DecimalMin(value = "0.0", message = "Salary min must be non-negative")
    @Schema(description = "Minimum offered salary in XAF (optional)", example = "300000")
    BigDecimal salaryMin,

    @DecimalMin(value = "0.0", message = "Salary max must be non-negative")
    @Schema(description = "Maximum offered salary in XAF (optional)", example = "600000")
    BigDecimal salaryMax,

    @Schema(description = "Required experience level")
    ExperienceLevel experienceLevel,

    @NotNull(message = "Application deadline is required")
    @Future(message = "Deadline must be a future date")
    @Schema(description = "Application deadline", example = "2026-12-31")
    LocalDate deadline,

    @Schema(description = "Set of skill UUIDs required for this position")
    Set<UUID> skillIds,

    @Schema(description = "If true, immediately publish as ACTIVE; otherwise saved as DRAFT",
            defaultValue = "false")
    boolean publishImmediately

) {
    /** Cross-field validation: salaryMax >= salaryMin when both are present. */
    @AssertTrue(message = "salaryMax must be greater than or equal to salaryMin")
    @Schema(hidden = true)
    public boolean isSalaryRangeValid() {
        if (salaryMin == null || salaryMax == null) return true;
        return salaryMax.compareTo(salaryMin) >= 0;
    }
}
