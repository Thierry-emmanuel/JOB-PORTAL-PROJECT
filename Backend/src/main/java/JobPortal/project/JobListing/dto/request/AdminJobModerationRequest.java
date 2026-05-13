package JobPortal.project.JobListing.dto.request;

import JobPortal.project.JobListing.enums.PostingStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request body for {@code PATCH /api/admin/jobs/{id}/approve} — admin moderates a listing.
 *
 * <p>Admin actions:
 * <ul>
 *   <li>ACTIVE  — approve: make the listing publicly visible</li>
 *   <li>DRAFT   — flag: remove from public view, retain record</li>
 *   <li>DELETED — force-remove: soft-delete regardless of owner</li>
 * </ul>
 */
@Schema(description = "Admin request to moderate a job listing")
public record AdminJobModerationRequest(

    @NotNull(message = "Action status is required")
    @Schema(description = "Target status: ACTIVE (approve), DRAFT (flag), DELETED (remove)",
            allowableValues = {"ACTIVE", "DRAFT", "DELETED"})
    PostingStatus status,

    @NotNull(message = "Reason is required for the audit trail")
    @Size(min = 10, max = 500, message = "Reason must be 10–500 characters")
    @Schema(description = "Mandatory moderation reason recorded in the audit log",
            example = "Listing violates platform community guidelines.")
    String reason

) {}
