package JobPortal.project.JobListing.controller;

import JobPortal.project.JobListing.dto.request.AdminJobModerationRequest;
import JobPortal.project.JobListing.dto.response.ApiResponse;
import JobPortal.project.JobListing.dto.response.JobListingResponse;
import JobPortal.project.JobListing.dto.response.JobListingSummary;
import JobPortal.project.JobListing.enums.PostingStatus;
import JobPortal.project.JobListing.service.JobListingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Admin job listing oversight — ROLE_ADMIN required on all endpoints.
 *
 * <p>Base path: {@code /api/admin/jobs}
 *
 * <p>Admins can view, approve, flag, and force-remove ANY listing regardless
 * of the owning employer.
 *
 * <p>Endpoint summary:
 * <ul>
 *   <li>GET   /api/admin/jobs              — view all listings (including inactive)</li>
 *   <li>PATCH /api/admin/jobs/{id}/approve — approve or flag a listing</li>
 *   <li>DELETE /api/admin/jobs/{id}        — force-remove a listing</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/admin/jobs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin – Job Listing Oversight",
     description = "View, approve, flag, and force-remove any job listing")
@SecurityRequirement(name = "bearerAuth")
public class AdminJobListingController {

    private final JobListingService jobListingService;

    // ── GET /api/admin/jobs ───────────────────────────────────────────────────

    @GetMapping
    @Operation(
        summary = "View all job listings",
        description = """
            Returns ALL job listings on the platform, including DRAFT, ACTIVE,
            EXPIRED, and DELETED records. Admin-only.
            
            **Optional filters (combinable):**
            - `status`     – DRAFT | ACTIVE | EXPIRED | DELETED
            - `employerId` – filter by specific employer UUID
            
            Default sort: `createdAt DESC`.
            """
    )
    public ResponseEntity<ApiResponse<Page<JobListingSummary>>> getAllListings(

            @Parameter(description = "Filter by posting status")
            @RequestParam(required = false) PostingStatus status,

            @Parameter(description = "Filter by employer UUID")
            @RequestParam(required = false) UUID employerId,

            @RequestParam(defaultValue = "0")          int page,
            @RequestParam(defaultValue = "20")         int size,
            @RequestParam(defaultValue = "createdAt")  String sortBy,
            @RequestParam(defaultValue = "DESC")       String direction) {

        PageRequest pageable = PageRequest.of(page, size,
            Sort.by(Sort.Direction.fromString(direction), sortBy));

        Page<JobListingSummary> result =
            jobListingService.adminGetAllListings(status, employerId, pageable);

        return ResponseEntity.ok(ApiResponse.ok("All listings retrieved", result));
    }

    // ── PATCH /api/admin/jobs/{id}/approve ────────────────────────────────────

    @PatchMapping("/{id}/approve")
    @Operation(
        summary = "Approve or flag a job listing",
        description = """
            Admin moderates a listing by setting its status with a mandatory reason.
            
            **Actions:**
            - `ACTIVE`  — approve: make publicly visible.
            - `DRAFT`   — flag: remove from public view, retain record.
            - `DELETED` — force-remove: soft-delete (also fires JobListingDeletedEvent).
            
            **Audit:** Status change, reason, and admin ID are logged.
            """
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Listing moderated")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error (reason too short)")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Listing not found")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Invalid target status")
    public ResponseEntity<ApiResponse<JobListingResponse>> moderateListing(
            @AuthenticationPrincipal JobPortal.project.security.UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody AdminJobModerationRequest request) {

        JobListingResponse response =
            jobListingService.adminModerate(principal.getId(), id, request);

        return ResponseEntity.ok(
            ApiResponse.ok("Listing moderated — new status: " + request.status(), response));
    }

    // ── DELETE /api/admin/jobs/{id} ───────────────────────────────────────────

    @DeleteMapping("/{id}")
    @Operation(
        summary = "Force-remove a job listing",
        description = "Admin soft-deletes any listing regardless of owner or status. "
            + "A JobListingDeletedEvent is published so the Application and "
            + "Notification modules can clean up affected applications."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Listing removed")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Listing not found")
    public ResponseEntity<ApiResponse<Void>> forceDeleteListing(
            @AuthenticationPrincipal JobPortal.project.security.UserPrincipal principal,
            @PathVariable UUID id) {

        jobListingService.adminDeleteListing(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Listing force-removed by admin"));
    }
}
