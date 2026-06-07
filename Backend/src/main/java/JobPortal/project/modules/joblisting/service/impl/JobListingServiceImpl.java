package JobPortal.project.modules.joblisting.service.impl;

import JobPortal.project.modules.joblisting.dto.request.AdminJobModerationRequest;
import JobPortal.project.modules.joblisting.dto.request.JobListingCreateRequest;
import JobPortal.project.modules.joblisting.dto.request.JobListingStatusRequest;
import JobPortal.project.modules.joblisting.dto.request.JobListingUpdateRequest;
import JobPortal.project.modules.joblisting.dto.response.CategoryResponse;
import JobPortal.project.modules.joblisting.dto.response.JobListingResponse;
import JobPortal.project.modules.joblisting.dto.response.JobListingSummary;
import JobPortal.project.modules.joblisting.entity.*;
import JobPortal.project.modules.joblisting.enums.ExperienceLevel;
import JobPortal.project.modules.joblisting.enums.JobType;
import JobPortal.project.modules.joblisting.enums.PostingStatus;
import JobPortal.project.modules.joblisting.exception.InvalidListingStateException;
import JobPortal.project.modules.joblisting.exception.JobListingAccessDeniedException;
import JobPortal.project.modules.joblisting.exception.ResourceNotFoundException;
import JobPortal.project.modules.joblisting.mapper.JobListingMapper;
import JobPortal.project.modules.joblisting.repository.*;
import JobPortal.project.modules.joblisting.service.JobListingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Full implementation of {@link JobListingService}.
 *
 * <p><b>Authorisation model:</b> Every mutating employer method first verifies
 * that the authenticated employer owns the target listing.
 * A {@link JobListingAccessDeniedException} (HTTP 403) is thrown otherwise,
 * preventing Insecure Direct Object Reference (IDOR) attacks.
 *
 * <p><b>Admin operations:</b> No ownership check — admins operate platform-wide.
 *
 * <p><b>Notification / Application hooks:</b>
 * When a listing status changes to DELETED (soft-delete), a Spring Application
 * Event ({@link JobPortal.project.modules.joblisting.config.JobListingDeletedEvent})
 * is published so the Notification and Application modules (other sprint teams)
 * can react asynchronously without a direct dependency.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JobListingServiceImpl implements JobListingService {

    private final JobListingRepository     listingRepository;
    private final JobCategoryRepository    categoryRepository;
    private final ListingSkillRepository   skillRepository;
    private final JobLocationRepository    locationRepository;
    private final JobListingMapper         mapper;

    // Spring ApplicationEventPublisher — injected for cross-module event broadcasting
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;
    private final JobPortal.project.modules.auth.repository.UserRepository userRepository;

    // ═══════════════════════════════════════════════════════════════════════════
    // EMPLOYER OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "jobListings",   allEntries = true),
            @CacheEvict(value = "jobCategories", allEntries = true)   // category counts change
    })
    public JobListingResponse createListing(Long employerId, JobListingCreateRequest req) {

        JobCategory category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("JobCategory", req.categoryId()));

        // Build the location FK reference without loading the full entity
        JobLocation location = null;
        if (req.locationId() != null) {
            location = new JobLocation();
            location.setId(req.locationId());
        }

        Set<ListingSkill> skills = resolveSkills(req.skillIds());

        JobListing listing = JobListing.builder()
                .employerId(employerId)
                .companyId(req.companyId())
                .category(category)
                .location(location)
                .title(req.title())
                .description(req.description())
                .jobType(req.jobType())
                .salaryMin(req.salaryMin())
                .salaryMax(req.salaryMax())
                .experienceLevel(req.experienceLevel())
                .deadline(req.deadline())
                .skills(skills)
                .qualificationNeeded(req.qualificationNeeded())
                .requiresInterview(req.requiresInterview() != null ? req.requiresInterview() : false)
                .status(PostingStatus.DRAFT)
                .viewCount(0)
                .build();

        if (req.publishImmediately()) {
            listing.publish();
        }

        JobListing saved = listingRepository.save(listing);
        log.info("[JobListing] Employer {} created listing {} (status={})",
                employerId, saved.getId(), saved.getStatus());

        if (saved.getStatus() == PostingStatus.ACTIVE) {
            notifyEmployerOfPublication(employerId, saved);
        }

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "jobListingDetail", key = "#listingId"),
            @CacheEvict(value = "jobListings",      allEntries = true)
    })
    public JobListingResponse updateListing(Long employerId, UUID listingId,
                                            JobListingUpdateRequest req) {

        JobListing listing = findOwnedListing(employerId, listingId);
        assertEditable(listing);

        // PATCH semantics — only apply non-null fields
        if (req.title()           != null) listing.setTitle(req.title());
        if (req.description()     != null) listing.setDescription(req.description());
        if (req.jobType()         != null) listing.setJobType(req.jobType());
        if (req.salaryMin()       != null) listing.setSalaryMin(req.salaryMin());
        if (req.salaryMax()       != null) listing.setSalaryMax(req.salaryMax());
        if (req.experienceLevel() != null) listing.setExperienceLevel(req.experienceLevel());
        if (req.deadline()        != null) listing.setDeadline(req.deadline());
        if (req.qualificationNeeded() != null) listing.setQualificationNeeded(req.qualificationNeeded());
        if (req.requiresInterview()   != null) listing.setRequiresInterview(req.requiresInterview());

        if (req.categoryId() != null) {
            listing.setCategory(categoryRepository.findById(req.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("JobCategory", req.categoryId())));
        }
        if (req.locationId() != null) {
            JobLocation loc = new JobLocation();
            loc.setId(req.locationId());
            listing.setLocation(loc);
        }
        if (req.skillIds() != null) {
            listing.setSkills(resolveSkills(req.skillIds())); // full replacement
        }

        JobListing updated = listingRepository.save(listing);
        log.info("[JobListing] Employer {} updated listing {}", employerId, listingId);
        return mapper.toResponse(updated);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "jobListingDetail", key = "#listingId"),
            @CacheEvict(value = "jobListings",      allEntries = true),
            @CacheEvict(value = "jobCategories",    allEntries = true)
    })
    public void deleteListing(Long employerId, UUID listingId) {
        JobListing listing = findOwnedListing(employerId, listingId);
        listing.softDelete();
        listingRepository.save(listing);
        log.info("[JobListing] Employer {} soft-deleted listing {}", employerId, listingId);

        // Notify Application + Notification modules (loose coupling via Spring Events)
        eventPublisher.publishEvent(
                new JobPortal.project.modules.joblisting.config.JobListingDeletedEvent(this, listingId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobListingSummary> getEmployerListings(Long employerId, Pageable pageable) {
        return listingRepository.findAllByEmployerId(employerId, pageable)
                .map(mapper::toSummary);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "jobListingDetail", key = "#listingId"),
            @CacheEvict(value = "jobListings",      allEntries = true)
    })
    public JobListingResponse changeListingStatus(Long employerId, UUID listingId,
                                                  JobListingStatusRequest req) {
        JobListing listing = findOwnedListing(employerId, listingId);
        applyStatusTransition(listing, req.status());
        JobListing saved = listingRepository.save(listing);
        log.info("[JobListing] Employer {} changed listing {} → {}", employerId, listingId, req.status());

        if (saved.getStatus() == PostingStatus.ACTIVE) {
            notifyEmployerOfPublication(employerId, saved);
        }

        return mapper.toResponse(saved);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC / JOB SEEKER OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "jobListings", key = "'active:p'+#pageable.pageNumber+':s'+#pageable.pageSize")
    public Page<JobListingSummary> getActiveListings(Pageable pageable) {
        // Use the specification with no filters — status=ACTIVE is always applied
        Specification<JobListing> spec = JobListingSpecification.buildFilter(
                JobListingSpecification.SearchParams.builder().build());
        return listingRepository.findAll(spec, pageable).map(mapper::toSummary);
    }

    @Override
    @Transactional
    @Cacheable(value = "jobListingDetail", key = "#listingId")
    public JobListingResponse getPublicListingById(UUID listingId) {
        JobListing listing = listingRepository.findActiveById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("JobListing", listingId));

        listing.incrementViewCount();
        listingRepository.save(listing);

        return mapper.toResponse(listing);
    }

    @Override
    @Transactional(readOnly = true)
    public JobListingResponse getAnyListingById(UUID listingId) {
        JobListing listing = listingRepository.findAnyById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("JobListing", listingId));
        return mapper.toResponse(listing);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobListingSummary> searchListings(
            String keyword, UUID categoryId, JobType jobType,
            String city, ExperienceLevel experienceLevel,
            BigDecimal salaryMin, BigDecimal salaryMax,
            Pageable pageable) {

        Specification<JobListing> spec = JobListingSpecification.buildFilter(
                JobListingSpecification.SearchParams.builder()
                        .keyword(keyword)
                        .categoryId(categoryId)
                        .jobType(jobType)
                        .city(city)
                        .experienceLevel(experienceLevel)
                        .salaryMin(salaryMin)
                        .salaryMax(salaryMax)
                        .build());

        return listingRepository.findAll(spec, pageable).map(mapper::toSummary);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "jobCategories", key = "'all'")
    public List<CategoryResponse> getAllCategories() {
        List<JobPortal.project.modules.joblisting.dto.response.SalaryAggregationResponse> stats = listingRepository.getAverageSalaryByCategory();
        java.util.Map<String, JobPortal.project.modules.joblisting.dto.response.SalaryAggregationResponse> statsMap = stats.stream()
                .collect(Collectors.toMap(
                        s -> s.getCategory().toLowerCase(),
                        s -> s,
                        (s1, s2) -> s1
                ));

        return categoryRepository.findAll().stream()
                .map(cat -> {
                    JobPortal.project.modules.joblisting.dto.response.SalaryAggregationResponse agg = statsMap.get(cat.getName().toLowerCase());
                    if (agg != null) {
                        return mapper.toCategoryResponse(cat, agg.getJobCount(), agg.getAvgSalaryMin(), agg.getAvgSalaryMax());
                    } else {
                        return mapper.toCategoryResponse(cat, 0L, 0.0, 0.0);
                    }
                })
                .collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    @Override
    @Transactional(readOnly = true)
    public Page<JobListingSummary> adminGetAllListings(PostingStatus status, Long employerId,
                                                       Pageable pageable) {
        return listingRepository.findAllForAdmin(status, employerId, pageable)
                .map(mapper::toSummary);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "jobListingDetail", key = "#listingId"),
            @CacheEvict(value = "jobListings",      allEntries = true),
            @CacheEvict(value = "jobCategories",    allEntries = true)
    })
    public JobListingResponse adminModerate(Long adminId, UUID listingId,
                                            AdminJobModerationRequest req) {

        JobListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("JobListing", listingId));

        PostingStatus oldStatus = listing.getStatus();
        applyAdminTransition(listing, req.status(), req.reason());
        JobListing saved = listingRepository.save(listing);
        log.info("[JobListing] Admin {} moderated listing {} → {} (reason={})",
                adminId, listingId, req.status(), req.reason());

        if (req.status() == PostingStatus.DELETED) {
            eventPublisher.publishEvent(
                    new JobPortal.project.modules.joblisting.config.JobListingDeletedEvent(this, listingId));
        } else if (saved.getStatus() == PostingStatus.ACTIVE && oldStatus != PostingStatus.ACTIVE) {
            notifyEmployerOfPublication(saved.getEmployerId(), saved);
        }

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "jobListingDetail", key = "#listingId"),
            @CacheEvict(value = "jobListings",      allEntries = true),
            @CacheEvict(value = "jobCategories",    allEntries = true)
    })
    public void adminDeleteListing(Long adminId, UUID listingId) {
        JobListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("JobListing", listingId));

        listing.softDelete();
        listing.setModerationNote("Force-removed by admin " + adminId);
        listingRepository.save(listing);
        log.info("[JobListing] Admin {} force-deleted listing {}", adminId, listingId);

        eventPublisher.publishEvent(
                new JobPortal.project.modules.joblisting.config.JobListingDeletedEvent(this, listingId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Fetches a listing and verifies the employer owns it.
     * Returns 404 if not found; 403 if owned by a different employer.
     */
    private JobListing findOwnedListing(Long employerId, UUID listingId) {
        return listingRepository.findByIdAndEmployerId(listingId, employerId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Job listing not found or you do not have permission to access it."));
    }

    /**
     * Ensures a listing is in a mutable state.
     * EXPIRED and DELETED listings cannot be edited.
     */
    private void assertEditable(JobListing listing) {
        if (listing.getStatus() == PostingStatus.EXPIRED ||
                listing.getStatus() == PostingStatus.DELETED) {
            throw new InvalidListingStateException(
                    "Cannot edit a listing with status: " + listing.getStatus());
        }
    }

    /**
     * Employer-allowed status transitions.
     *
     * <pre>
     *   DRAFT  → ACTIVE  (publish / open)
     *   ACTIVE → DRAFT   (unpublish / close)
     *   DRAFT | ACTIVE → DELETED (soft-delete)
     * </pre>
     */
    private void applyStatusTransition(JobListing listing, PostingStatus target) {
        PostingStatus current = listing.getStatus();
        switch (target) {
            case ACTIVE -> {
                if (current != PostingStatus.DRAFT)
                    throw new InvalidListingStateException(
                            "Only DRAFT listings can be published. Current: " + current);
                listing.publish();
            }
            case DRAFT -> {
                if (current != PostingStatus.ACTIVE)
                    throw new InvalidListingStateException(
                            "Only ACTIVE listings can be moved back to DRAFT. Current: " + current);
                listing.setStatus(PostingStatus.DRAFT);
            }
            case DELETED -> {
                if (current == PostingStatus.EXPIRED || current == PostingStatus.DELETED)
                    throw new InvalidListingStateException(
                            "Listing is already in terminal state: " + current);
                listing.softDelete();
            }
            default -> throw new InvalidListingStateException(
                    "Status " + target + " cannot be set manually.");
        }
    }

    /**
     * Admin-allowed transitions (no ownership check, reason stored for audit).
     */
    private void applyAdminTransition(JobListing listing, PostingStatus target, String reason) {
        switch (target) {
            case ACTIVE  -> listing.setStatus(PostingStatus.ACTIVE);
            case DRAFT   -> listing.setStatus(PostingStatus.DRAFT);
            case DELETED -> listing.softDelete();
            default -> throw new InvalidListingStateException(
                    "Admin cannot set status to: " + target);
        }
        listing.setModerationNote(reason);
    }

    /**
     * Resolves a set of skill UUIDs to {@link ListingSkill} entities.
     * Silently ignores unrecognised IDs (logs a warning).
     */
    private Set<ListingSkill> resolveSkills(Set<UUID> skillIds) {
        if (CollectionUtils.isEmpty(skillIds)) return new HashSet<>();
        Set<ListingSkill> found = skillRepository.findByIdIn(skillIds);
        if (found.size() != skillIds.size()) {
            log.warn("[JobListing] Some skill IDs were not found in the database; "
                    + "posting will include only matched skills.");
        }
        return found;
    }

    @Override
    @Transactional(readOnly = true)
    public UUID resolveNumericalIdToUuid(Long numericalId) {
        String uuidStr = listingRepository.findIdByNumericalId(numericalId);
        if (uuidStr == null) {
            return null;
        }
        return UUID.fromString(uuidStr);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "jobLocations", key = "'all'")
    public List<JobLocation> getAllLocations() {
        return locationRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "jobSkills", key = "'all'")
    public List<ListingSkill> getAllSkills() {
        return skillRepository.findAll();
    }

    private void notifyEmployerOfPublication(Long employerId, JobListing listing) {
        try {
            userRepository.findById(employerId).ifPresent(employer -> {
                eventPublisher.publishEvent(new JobPortal.project.modules.notification.event.NotificationEvent(
                        this,
                        employer,
                        "Job Posting Published Successfully",
                        "Hello " + employer.getFullName() + ",\n\nYour job listing '" + listing.getTitle() + "' has been successfully published on Kora and is now live for candidates to view and apply.",
                        JobPortal.project.enums.NotificationType.JOB_ALERT
                ));
            });
        } catch (Exception e) {
            log.warn("Failed to notify employer of job publication: {}", e.getMessage());
        }
    }
}