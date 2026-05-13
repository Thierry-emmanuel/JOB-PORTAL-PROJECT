package JobPortal.project.JobListing.controller;

import JobPortal.project.JobListing.dto.request.JobListingCreateRequest;
import JobPortal.project.JobListing.dto.request.JobListingStatusRequest;
import JobPortal.project.JobListing.dto.request.JobListingUpdateRequest;
import JobPortal.project.JobListing.dto.response.ApiResponse;
import JobPortal.project.JobListing.dto.response.JobListingResponse;
import JobPortal.project.JobListing.dto.response.JobListingSummary;
import JobPortal.project.JobListing.service.JobListingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Employer job listing management — authenticated ROLE_EMPLOYER required.
 *
 * <p>Base path: {@code /api/jobs}
 *
 * <p>The employer's UUID is extracted from the JWT principal via
 * {@code @AuthenticationPrincipal} and forwarded to the service for
 * per-resource ownership verification (prevents IDOR).
 *
 * <p>Endpoint summary:
 * <ul>
 *   <li>POST   /api/jobs                    — create listing</li>
 *   <li>PUT    /api/jobs/{id}               — update listing</li>
 *   <li>DELETE /api/jobs/{id}               — soft-delete listing</li>
 *   <li>GET    /api/jobs/employer/{id}      — all employer's own listings</li>
 *   <li>PATCH  /api/jobs/{id}/status        — toggle open / closed</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Tag(name = "Employer – Job Listings",
     description = "CRUD and status management for employer-owned job listings")
@SecurityRequirement(name = "bearerAuth")
public class EmployerJobListingController {

    private final JobListingService jobListingService;

    // ── POST /api/jobs ────────────────────────────────────────────────────────

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(
        summary = "Create a job listing",
        description = "Creates a new listing owned by the authenticated employer. "
            + "Set `publishImmediately=true` to go live immediately (ACTIVE); "
            + "otherwise it is saved as DRAFT."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Listing created")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Account not verified or not active")
    public ResponseEntity<ApiResponse<JobListingResponse>> createListing(
            @AuthenticationPrincipal JobPortal.project.security.UserPrincipal principal,
            @Valid @RequestBody JobListingCreateRequest request) {

        JobListingResponse response =
            jobListingService.createListing(principal.getId(), request);

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok("Job listing created successfully", response));
    }

    // ── PUT /api/jobs/{id} ────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(
        summary = "Update a job listing",
        description = "Partially updates an existing listing (PATCH semantics: only "
            + "non-null fields are applied). Only DRAFT and ACTIVE listings can be edited."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Listing updated")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Listing not found or not owned")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Listing is EXPIRED or DELETED")
    public ResponseEntity<ApiResponse<JobListingResponse>> updateListing(
            @AuthenticationPrincipal JobPortal.project.security.UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody JobListingUpdateRequest request) {

        JobListingResponse response =
            jobListingService.updateListing(principal.getId(), id, request);

        return ResponseEntity.ok(ApiResponse.ok("Job listing updated successfully", response));
    }

    // ── DELETE /api/jobs/{id} ─────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(
        summary = "Delete a job listing",
        description = "Soft-deletes the listing (status → DELETED). "
            + "The record and all associated applications are retained in the database. "
            + "A JobListingDeletedEvent is published for the Application and Notification modules."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Listing deleted")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Listing not found or not owned")
    public ResponseEntity<ApiResponse<Void>> deleteListing(
            @AuthenticationPrincipal JobPortal.project.security.UserPrincipal principal,
            @PathVariable UUID id) {

        jobListingService.deleteListing(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Job listing deleted successfully"));
    }

    // ── GET /api/jobs/employer/{employerId} ───────────────────────────────────

    @GetMapping("/employer/{employerId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(
        summary = "Get all listings for an employer",
        description = "Returns a paginated list of all non-deleted listings belonging "
            + "to the specified employer. The authenticated user must be that employer."
    )
    public ResponseEntity<ApiResponse<Page<JobListingSummary>>> getEmployerListings(
            @AuthenticationPrincipal JobPortal.project.security.UserPrincipal principal,

            @Parameter(description = "Employer UUID — must match authenticated user")
            @PathVariable UUID employerId,

            @RequestParam(defaultValue = "0")          int page,
            @RequestParam(defaultValue = "10")         int size,
            @RequestParam(defaultValue = "createdAt")  String sortBy,
            @RequestParam(defaultValue = "DESC")       String direction) {

        // Security: the authenticated employer can only view their own listings
        if (!principal.getId().equals(employerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("You can only view your own listings."));
        }

        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Page<JobListingSummary> result =
            jobListingService.getEmployerListings(employerId, PageRequest.of(page, size, sort));

        return ResponseEntity.ok(ApiResponse.ok("Listings retrieved", result));
    }

    // ── PATCH /api/jobs/{id}/status ───────────────────────────────────────────

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('EMPLOYER')")
    @Operation(
        summary = "Toggle listing open / closed",
        description = "Allowed transitions:\n"
            + "- `DRAFT → ACTIVE` (open / publish)\n"
            + "- `ACTIVE → DRAFT` (close / unpublish)\n"
            + "- `DRAFT | ACTIVE → DELETED` (soft-delete)\n\n"
            + "EXPIRED status cannot be set manually."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Status changed")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Invalid transition")
    public ResponseEntity<ApiResponse<JobListingResponse>> changeStatus(
            @AuthenticationPrincipal JobPortal.project.security.UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody JobListingStatusRequest request) {

        JobListingResponse response =
            jobListingService.changeListingStatus(principal.getId(), id, request);

        return ResponseEntity.ok(
            ApiResponse.ok("Listing status changed to " + request.status(), response));
    }
}
