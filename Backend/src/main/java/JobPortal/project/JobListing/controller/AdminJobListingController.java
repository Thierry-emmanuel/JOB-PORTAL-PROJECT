package JobPortal.project.JobListing.controller;

import JobPortal.project.JobListing.dto.request.AdminJobModerationRequest;
import JobPortal.project.JobListing.dto.response.ApiResponse;
import JobPortal.project.JobListing.dto.response.JobListingResponse;
import JobPortal.project.JobListing.dto.response.JobListingSummary;
import JobPortal.project.JobListing.enums.PostingStatus;
import JobPortal.project.JobListing.service.JobListingService;
import JobPortal.project.modules.auth.Model.User;
import JobPortal.project.modules.auth.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Admin job listing oversight - ROLE_ADMIN required on all endpoints.
 * Base path: /api/admin/jobs
 */
@RestController
@RequestMapping("/api/admin/jobs")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@Tag(name = "Admin - Job Listing Oversight",
     description = "View, approve, flag, and force-remove any job listing")
@SecurityRequirement(name = "bearerAuth")
public class AdminJobListingController {

    private final JobListingService jobListingService;
    private final UserRepository    userRepository;

    // ── Resolve authenticated admin ID from email principal ─────────────────

    private Long resolveAdminId(UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
        return user.getId();
    }

    // ── GET /api/admin/jobs ───────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "View all job listings",
               description = "Returns ALL listings on the platform including DRAFT, ACTIVE, EXPIRED, DELETED.")
    public ResponseEntity<ApiResponse<Page<JobListingSummary>>> getAllListings(

            @Parameter(description = "Filter by posting status")
            @RequestParam(required = false) PostingStatus status,

            @Parameter(description = "Filter by employer ID")
            @RequestParam(required = false) Long employerId,

            @RequestParam(defaultValue = "0")         int page,
            @RequestParam(defaultValue = "20")        int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC")      String direction) {

        Sort compositeSort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        if (!"id".equals(sortBy)) {
            compositeSort = compositeSort.and(Sort.by(Sort.Direction.DESC, "id"));
        }
        PageRequest pageable = PageRequest.of(page, size, compositeSort);

        Page<JobListingSummary> result =
            jobListingService.adminGetAllListings(status, employerId, pageable);
        return ResponseEntity.ok(ApiResponse.ok("All listings retrieved", result));
    }

    // ── PATCH /api/admin/jobs/{id}/approve ────────────────────────────────────

    @PatchMapping("/{id}/approve")
    @Operation(summary = "Approve or flag a job listing",
               description = "ACTIVE=approve, DRAFT=flag/remove from public, DELETED=force-remove.")
    public ResponseEntity<ApiResponse<JobListingResponse>> moderateListing(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id,
            @Valid @RequestBody AdminJobModerationRequest request) {

        JobListingResponse response =
            jobListingService.adminModerate(resolveAdminId(principal), id, request);
        return ResponseEntity.ok(
            ApiResponse.ok("Listing moderated - new status: " + request.status(), response));
    }

    // ── DELETE /api/admin/jobs/{id} ───────────────────────────────────────────

    @DeleteMapping("/{id}")
    @Operation(summary = "Force-remove a job listing",
               description = "Admin soft-deletes any listing regardless of owner or status.")
    public ResponseEntity<ApiResponse<Void>> forceDeleteListing(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id) {

        jobListingService.adminDeleteListing(resolveAdminId(principal), id);
        return ResponseEntity.ok(ApiResponse.ok("Listing force-removed by admin"));
    }
}
