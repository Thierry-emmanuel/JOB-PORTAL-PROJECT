package JobPortal.project.JobListing.controller;

import JobPortal.project.JobListing.dto.response.ApiResponse;
import JobPortal.project.JobListing.dto.response.CategoryResponse;
import JobPortal.project.JobListing.dto.response.JobListingResponse;
import JobPortal.project.JobListing.dto.response.JobListingSummary;
import JobPortal.project.JobListing.enums.ExperienceLevel;
import JobPortal.project.JobListing.enums.JobType;
import JobPortal.project.JobListing.service.JobListingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Public (unauthenticated) job listing endpoints.
 *
 * <p>Base path: {@code /api/jobs}
 *
 * <p>These endpoints are whitelisted in {@code SecurityConfig} and do
 * not require a Bearer token.
 *
 * <p>Endpoint summary:
 * <ul>
 *   <li>GET /api/jobs                — paginated list of all ACTIVE listings</li>
 *   <li>GET /api/jobs/{id}           — full detail of a single ACTIVE listing</li>
 *   <li>GET /api/jobs/search         — advanced multi-criteria search</li>
 *   <li>GET /api/jobs/categories     — all categories for filter dropdowns</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Tag(name = "Public – Job Listings",
     description = "Publicly accessible job search, detail, and category endpoints")
public class PublicJobListingController {

    private final JobListingService jobListingService;

    // ── GET /api/jobs ─────────────────────────────────────────────────────────

    @GetMapping
    @Operation(
        summary = "List all active job listings",
        description = "Returns a paginated list of all ACTIVE job listings, "
            + "newest first by default. Supports `page`, `size`, and `sort` query params."
    )
    public ResponseEntity<ApiResponse<Page<JobListingSummary>>> getActiveListings(

            @Parameter(description = "Page index (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Page size (max 50)", example = "10")
            @RequestParam(defaultValue = "10") int size,

            @Parameter(description = "Sort field: createdAt | deadline | salaryMin", example = "createdAt")
            @RequestParam(defaultValue = "createdAt") String sort,

            @Parameter(description = "Sort direction: ASC | DESC", example = "DESC")
            @RequestParam(defaultValue = "DESC") String direction) {

        int clampedSize = Math.min(size, 50);
        PageRequest pageable = PageRequest.of(page, clampedSize,
            Sort.by(Sort.Direction.fromString(direction), sort));

        Page<JobListingSummary> result = jobListingService.getActiveListings(pageable);
        return ResponseEntity.ok(ApiResponse.ok("Active listings retrieved", result));
    }

    // ── GET /api/jobs/{id} ────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Operation(
        summary = "Get a job listing by ID",
        description = "Returns the full detail of an ACTIVE listing. "
            + "Each call increments the listing's view counter."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Listing found")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Listing not found or not ACTIVE")
    public ResponseEntity<ApiResponse<JobListingResponse>> getListingById(
            @PathVariable String id) {

        UUID uuid;
        try {
            uuid = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            // Not a UUID format, check if it's a numeric ID prefix
            try {
                Long numericalId = Long.parseLong(id);
                uuid = jobListingService.resolveNumericalIdToUuid(numericalId);
                if (uuid == null) {
                    throw new JobPortal.project.JobListing.exception.ResourceNotFoundException("JobListing", id);
                }
            } catch (NumberFormatException nfe) {
                throw new IllegalArgumentException("Invalid ID format: " + id);
            }
        }

        JobListingResponse response = jobListingService.getPublicListingById(uuid);
        return ResponseEntity.ok(ApiResponse.ok("Job listing retrieved", response));
    }

    // ── GET /api/jobs/search ──────────────────────────────────────────────────

    @GetMapping("/search")
    @Operation(
        summary = "Advanced job search",
        description = "Searches ACTIVE listings with optional multi-criteria filters. "
            + "All parameters are optional and can be freely combined. "
            + "Default sort: `createdAt DESC`."
    )
    public ResponseEntity<ApiResponse<Page<JobListingSummary>>> searchListings(

            @Parameter(description = "Keyword — searched in title, description, and skill names")
            @RequestParam(required = false) String title,

            @Parameter(description = "Filter by city (partial match)")
            @RequestParam(required = false) String location,

            @Parameter(description = "Filter by job category UUID")
            @RequestParam(required = false) UUID category,

            @Parameter(description = "Minimum salary filter (XAF)", example = "200000")
            @RequestParam(required = false) BigDecimal salaryMin,

            @Parameter(description = "Maximum salary filter (XAF)", example = "800000")
            @RequestParam(required = false) BigDecimal salaryMax,

            @Parameter(description = "Comma-separated skill UUIDs (unused in search, kept for "
                + "API compatibility — keyword covers skill names)")
            @RequestParam(required = false) String skills,

            @Parameter(description = "Generic keyword (alias for title when title is null)")
            @RequestParam(required = false) String keyword,

            @Parameter(description = "Filter by contract type: CDI | CDD | INTERNSHIP | FREELANCE")
            @RequestParam(required = false) JobType jobType,

            @Parameter(description = "Filter by experience level: ENTRY | JUNIOR | MID | SENIOR | LEAD")
            @RequestParam(required = false) ExperienceLevel experienceLevel,

            @RequestParam(defaultValue = "0")         int page,
            @RequestParam(defaultValue = "10")        int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC")      String direction) {

        // title param acts as keyword; if keyword is also supplied, keyword wins
        String effectiveKeyword = (keyword != null) ? keyword : title;

        int clampedSize = Math.min(size, 50);
        PageRequest pageable = PageRequest.of(page, clampedSize,
            Sort.by(Sort.Direction.fromString(direction), sort));

        Page<JobListingSummary> result = jobListingService.searchListings(
            effectiveKeyword, category, jobType, location,
            experienceLevel, salaryMin, salaryMax, pageable);

        return ResponseEntity.ok(ApiResponse.ok("Search results retrieved", result));
    }

    // ── GET /api/jobs/categories ──────────────────────────────────────────────

    @GetMapping("/categories")
    @Operation(
        summary = "List all job categories",
        description = "Returns the complete list of job categories. "
            + "Use these UUIDs and names to populate filter dropdowns in the UI."
    )
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories() {
        List<CategoryResponse> categories = jobListingService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.ok("Categories retrieved", categories));
    }
}
