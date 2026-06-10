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
 * Request body for {@code POST /api/jobs} — employer creates a new job listing.
 * All fields are validated via Bean Validation before reaching the service layer.
 *
 * <h3>FIX — companyId is no longer @NotNull</h3>
 * <p>The service layer ({@link JobPortal.project.modules.joblisting.service.impl.JobListingServiceImpl#createListing})
 * auto-resolves {@code companyId} from the authenticated employer's existing company
 * records, and creates a stub company if none exist. Marking it {@code @NotNull} was
 * causing 400 validation failures for any employer whose client did not yet have the
 * company ID available in the session (first-time posters, OAuth sign-ins, etc.).</p>
 *
 * <p>Removing {@code @NotNull} here is safe because:
 * <ol>
 *   <li>The service always resolves or creates a company before persisting.</li>
 *   <li>The {@code JobListing.companyId} column is {@code NOT NULL} at the DB level —
 *       a null would fail at save-time with a clear error instead of a confusing 400.</li>
 *   <li>All other required fields retain their constraints.</li>
 * </ol>
 * </p>
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

        /**
         * Optional — if null the service auto-resolves from the employer's company
         * records or creates a stub company.  Clients should still send this when
         * available to avoid the auto-resolve lookup overhead.
         */
        @Schema(description = "ID of the employer's company. Null is accepted — the backend "
                + "will auto-resolve from the employer's existing company or create one.")
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
        @FutureOrPresent(message = "Deadline cannot be in the past")
        @Schema(description = "Application deadline (today or later)", example = "2026-12-31")
        LocalDate deadline,

        @Schema(description = "Set of skill UUIDs required for this position")
        Set<UUID> skillIds,

        @Schema(description = "Qualifications or education required for the position",
                example = "Bachelor's degree in CS")
        String qualificationNeeded,

        @Schema(description = "If an interview is required for this job listing", defaultValue = "false")
        Boolean requiresInterview,

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