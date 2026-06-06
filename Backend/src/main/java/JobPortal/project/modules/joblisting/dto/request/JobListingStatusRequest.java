package JobPortal.project.modules.joblisting.dto.request;

import JobPortal.project.modules.joblisting.enums.PostingStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for {@code PATCH /api/jobs/{id}/status} — employer toggles a listing open/closed.
 *
 * <p>Allowed transitions (enforced in the service):
 * <ul>
 *   <li>DRAFT → ACTIVE (publish / open)</li>
 *   <li>ACTIVE → DRAFT (unpublish / close)</li>
 *   <li>DRAFT | ACTIVE → DELETED (soft-delete)</li>
 * </ul>
 */
@Schema(description = "Request to change the status of a job listing")
public record JobListingStatusRequest(

    @NotNull(message = "Status is required")
    @Schema(description = "Target status", allowableValues = {"ACTIVE", "DRAFT", "DELETED"})
    PostingStatus status

) {}
