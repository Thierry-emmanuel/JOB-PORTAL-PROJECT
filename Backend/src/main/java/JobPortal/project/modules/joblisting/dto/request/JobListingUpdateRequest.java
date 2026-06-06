package JobPortal.project.modules.joblisting.dto.request;

import JobPortal.project.modules.joblisting.enums.ExperienceLevel;
import JobPortal.project.modules.joblisting.enums.JobType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

/**
 * Request body for {@code PUT /api/jobs/{id}} — employer updates an existing listing.
 * All fields are optional; only non-null values are applied (PATCH semantics).
 */
@Schema(description = "Partial update payload for an existing job listing. "
      + "Only provided (non-null) fields are applied.")
public record JobListingUpdateRequest(

    @Size(min = 3, max = 200, message = "Title must be 3–200 characters")
    @Schema(description = "Updated job title")
    String title,

    @Size(min = 50, message = "Description must be at least 50 characters")
    @Schema(description = "Updated job description")
    String description,

    @Schema(description = "Updated category UUID")
    UUID categoryId,

    @Schema(description = "Updated location UUID")
    UUID locationId,

    @Schema(description = "Updated contract type")
    JobType jobType,

    @DecimalMin(value = "0.0", message = "Salary min must be non-negative")
    @Schema(description = "Updated minimum salary")
    BigDecimal salaryMin,

    @DecimalMin(value = "0.0", message = "Salary max must be non-negative")
    @Schema(description = "Updated maximum salary")
    BigDecimal salaryMax,

    @Schema(description = "Updated experience level")
    ExperienceLevel experienceLevel,

    @Future(message = "Deadline must be a future date")
    @Schema(description = "Updated application deadline")
    LocalDate deadline,

    @Schema(description = "Updated qualifications or education required")
    String qualificationNeeded,

    @Schema(description = "Updated interview requirement status")
    Boolean requiresInterview,

    @Schema(description = "Replacement skill set (fully replaces existing skills when provided)")
    Set<UUID> skillIds

) {}
