package JobPortal.project.JobListing.service;

import JobPortal.project.JobListing.dto.request.AdminJobModerationRequest;
import JobPortal.project.JobListing.dto.request.JobListingCreateRequest;
import JobPortal.project.JobListing.dto.request.JobListingStatusRequest;
import JobPortal.project.JobListing.dto.request.JobListingUpdateRequest;
import JobPortal.project.JobListing.dto.response.CategoryResponse;
import JobPortal.project.JobListing.dto.response.JobListingResponse;
import JobPortal.project.JobListing.dto.response.JobListingSummary;
import JobPortal.project.JobListing.enums.ExperienceLevel;
import JobPortal.project.JobListing.enums.JobType;
import JobPortal.project.JobListing.enums.PostingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Service contract for all Job Listing module operations.
 *
 * <p>Covers three actor groups:
 * <ul>
 *   <li><b>Employer</b> – owns listings: create, update, delete, status toggle, my-listings</li>
 *   <li><b>Public / Job Seeker</b> – browse: paginated list, detail, search, categories</li>
 *   <li><b>Admin</b> – platform oversight: view all, moderate, force-delete</li>
 * </ul>
 *
 * <p>Implementations enforce:
 * <ul>
 *   <li>Ownership checks on every mutating employer method (IDOR prevention)</li>
 *   <li>Employer account active + verified guard before any creation</li>
 *   <li>Status-transition validation via the domain state machine</li>
 * </ul>
 */
public interface JobListingService {

    // ═══════════════════════════════════════════════════════════════════════════
    // EMPLOYER OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Creates a new job listing owned by the authenticated employer.
     *
     * @param employerId authenticated employer UUID (from JWT principal)
     * @param request    validated create payload
     * @return full detail response of the created listing
     */
    JobListingResponse createListing(Long employerId, JobListingCreateRequest request);

    /**
     * Partially updates an existing listing.
     * Only non-null fields in the request are applied.
     * Only DRAFT and ACTIVE listings can be updated.
     *
     * @param employerId authenticated employer UUID
     * @param listingId  UUID of the listing to update
     * @param request    partial update payload
     * @return updated full detail response
     */
    JobListingResponse updateListing(Long employerId, UUID listingId,
                                     JobListingUpdateRequest request);

    /**
     * Soft-deletes a listing (status → DELETED).
     * Associated applications are retained in the database.
     *
     * @param employerId authenticated employer UUID
     * @param listingId  UUID of the listing to soft-delete
     */
    void deleteListing(Long employerId, UUID listingId);

    /**
     * Returns all non-deleted listings belonging to the employer (paginated).
     *
     * @param employerId authenticated employer UUID
     * @param pageable   pagination and sort parameters
     * @return page of lightweight summaries
     */
    Page<JobListingSummary> getEmployerListings(Long employerId, Pageable pageable);

    /**
     * Toggles a listing open (ACTIVE) or closed (DRAFT).
     * Also supports soft-delete via DELETED target.
     *
     * @param employerId authenticated employer UUID
     * @param listingId  UUID of the listing
     * @param request    target status
     * @return updated full detail response
     */
    JobListingResponse changeListingStatus(Long employerId, UUID listingId,
                                           JobListingStatusRequest request);

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC / JOB SEEKER OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Paginated list of all ACTIVE listings (supports page, size, sort params).
     * Used for the main public job board.
     *
     * @param pageable pagination and sort (default: createdAt DESC)
     * @return page of summaries
     */
    Page<JobListingSummary> getActiveListings(Pageable pageable);

    /**
     * Full detail view of a single ACTIVE listing.
     * Increments the view counter on each call.
     *
     * @param listingId UUID of the listing
     * @return full detail response
     */
    JobListingResponse getPublicListingById(UUID listingId);

    /**
     * Advanced multi-criteria search across all ACTIVE listings.
     *
     * @param keyword         optional keyword (searched in title, description, skills)
     * @param categoryId      optional category filter
     * @param jobType         optional contract type filter
     * @param city            optional city filter (partial match)
     * @param experienceLevel optional experience level filter
     * @param salaryMin       optional salary range lower bound
     * @param salaryMax       optional salary range upper bound
     * @param pageable        pagination and sort
     * @return page of summaries matching all supplied filters
     */
    Page<JobListingSummary> searchListings(
            String keyword, UUID categoryId, JobType jobType,
            String city, ExperienceLevel experienceLevel,
            BigDecimal salaryMin, BigDecimal salaryMax,
            Pageable pageable);

    /**
     * Returns all available job categories for filter dropdowns.
     *
     * @return ordered list of categories
     */
    List<CategoryResponse> getAllCategories();

    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Returns ALL listings across all statuses and employers (paginated).
     * Supports optional filtering by status and employerId.
     *
     * @param status     optional status filter
     * @param employerId optional employer filter
     * @param pageable   pagination and sort
     * @return page of summaries
     */
    Page<JobListingSummary> adminGetAllListings(PostingStatus status, Long employerId,
                                                Pageable pageable);

    /**
     * Admin approves, flags, or force-removes any listing regardless of owner.
     *
     * @param adminId   authenticated admin UUID (for audit trail)
     * @param listingId UUID of the listing to moderate
     * @param request   target status + mandatory reason
     * @return updated full detail response
     */
    JobListingResponse adminModerate(Long adminId, UUID listingId,
                                     AdminJobModerationRequest request);

    /**
     * Admin force-deletes (soft) any listing.
     *
     * @param adminId   authenticated admin UUID
     * @param listingId UUID of the listing to remove
     */
    void adminDeleteListing(Long adminId, UUID listingId);

    /**
     * Resolves a legacy numerical prefix ID to its full UUID representation.
     *
     * @param numericalId prefix ID
     * @return full UUID or null if not found
     */
    UUID resolveNumericalIdToUuid(Long numericalId);
}
