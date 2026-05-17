package JobPortal.project.JobListing.controller;

import JobPortal.project.JobListing.dto.request.JobListingCreateRequest;
import JobPortal.project.JobListing.dto.request.JobListingStatusRequest;
import JobPortal.project.JobListing.dto.request.JobListingUpdateRequest;
import JobPortal.project.JobListing.dto.response.ApiResponse;
import JobPortal.project.JobListing.dto.response.JobListingResponse;
import JobPortal.project.JobListing.dto.response.JobListingSummary;
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
 * Employer job listing management — authenticated ROLE_EMPLOYER required.
 * Base path: /api/jobs
 */
@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Tag(name = "Employer - Job Listings",
     description = "CRUD and status management for employer-owned job listings")
@SecurityRequirement(name = "bearerAuth")
public class EmployerJobListingController {

    private final JobListingService jobListingService;
    private final UserRepository    userRepository;

    // ── Resolve authenticated user UUID from email principal ──────────────────

    private Long resolveEmployerId(UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
        return user.getId();
    }

    // ── POST /api/jobs ────────────────────────────────────────────────────────

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('ROLE_EMPLOYER')")
    @Operation(summary = "Create a job listing",
               description = "Creates a new listing. Set publishImmediately=true to go ACTIVE immediately.")
    public ResponseEntity<ApiResponse<JobListingResponse>> createListing(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody JobListingCreateRequest request) {

        JobListingResponse response =
            jobListingService.createListing(resolveEmployerId(principal), request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok("Job listing created successfully", response));
    }

    // ── PUT /api/jobs/{id} ────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_EMPLOYER')")
    @Operation(summary = "Update a job listing",
               description = "Partially updates an existing listing (null fields are ignored).")
    public ResponseEntity<ApiResponse<JobListingResponse>> updateListing(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id,
            @Valid @RequestBody JobListingUpdateRequest request) {

        JobListingResponse response =
            jobListingService.updateListing(resolveEmployerId(principal), id, request);
        return ResponseEntity.ok(ApiResponse.ok("Job listing updated successfully", response));
    }

    // ── DELETE /api/jobs/{id} ─────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_EMPLOYER')")
    @Operation(summary = "Soft-delete a job listing")
    public ResponseEntity<ApiResponse<Void>> deleteListing(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id) {

        jobListingService.deleteListing(resolveEmployerId(principal), id);
        return ResponseEntity.ok(ApiResponse.ok("Job listing deleted successfully"));
    }

    // ── GET /api/jobs/employer/{employerId} ───────────────────────────────────

    @GetMapping("/employer/{employerId}")
    @PreAuthorize("hasAuthority('ROLE_EMPLOYER')")
    @Operation(summary = "Get all listings for an employer")
    public ResponseEntity<ApiResponse<Page<JobListingSummary>>> getEmployerListings(
            @AuthenticationPrincipal UserDetails principal,

            @Parameter(description = "Employer ID - must match authenticated user")
            @PathVariable Long employerId,

            @RequestParam(defaultValue = "0")         int page,
            @RequestParam(defaultValue = "10")        int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC")      String direction) {

        Long authenticatedId = resolveEmployerId(principal);
        if (!authenticatedId.equals(employerId)) {
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
    @PreAuthorize("hasAuthority('ROLE_EMPLOYER')")
    @Operation(summary = "Toggle listing open / closed",
               description = "DRAFT->ACTIVE (open), ACTIVE->DRAFT (close), any->DELETED (soft-delete).")
    public ResponseEntity<ApiResponse<JobListingResponse>> changeStatus(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id,
            @Valid @RequestBody JobListingStatusRequest request) {

        JobListingResponse response =
            jobListingService.changeListingStatus(resolveEmployerId(principal), id, request);
        return ResponseEntity.ok(
            ApiResponse.ok("Listing status changed to " + request.status(), response));
    }
}
