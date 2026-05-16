package JobPortal.project.JobListing.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

/**
 * Response for the {@code GET /api/jobs/categories} endpoint.
 * Used to populate filter dropdowns on the frontend.
 */
@Schema(description = "Job category reference for filter dropdowns")
public record CategoryResponse(
    UUID   id,
    String name,
    String slug,
    String iconUrl,
    String description
) {}
