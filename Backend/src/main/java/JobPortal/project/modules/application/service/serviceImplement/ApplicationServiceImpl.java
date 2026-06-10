package JobPortal.project.modules.application.service.serviceImplement;

import JobPortal.project.modules.application.dto.request.ApplicationFilterRequest;
import JobPortal.project.modules.application.dto.request.CreateApplicationRequest;
import JobPortal.project.modules.application.dto.request.UpdateApplicationStatusRequest;
import JobPortal.project.modules.application.dto.response.ApplicationPageResponse;
import JobPortal.project.modules.application.dto.response.ApplicationResponse;
import JobPortal.project.modules.application.dto.response.ApplicationStatsResponse;
import JobPortal.project.modules.application.enums.ApplicationStatus;
import JobPortal.project.modules.application.enums.InterviewResult;
import JobPortal.project.modules.application.mapper.ApplicationMapper;
import JobPortal.project.modules.application.model.Application;
import JobPortal.project.modules.application.repository.ApplicationRepository;
import JobPortal.project.modules.application.repository.InterviewRepository;
import JobPortal.project.modules.application.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import JobPortal.project.modules.joblisting.entity.JobListing;
import JobPortal.project.modules.joblisting.repository.JobListingRepository;
import JobPortal.project.modules.auth.model.User;
import JobPortal.project.modules.auth.repository.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import JobPortal.project.modules.notification.event.NotificationEvent;
import JobPortal.project.enums.NotificationType;
import JobPortal.project.modules.application.dto.request.UpdateApplicationReviewRequest;
import JobPortal.project.modules.notification.service.RealtimeMessagingService;
import java.util.UUID;


@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final InterviewRepository   interviewRepository;
    private final ApplicationMapper     applicationMapper;
    private final JobListingRepository  jobListingRepository;
    private final UserRepository        userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final RealtimeMessagingService  realtimeMessagingService;

    // ------------------------------------------------------------------ //
    //  Apply                                                               //
    // ------------------------------------------------------------------ //

    @Override
    @Transactional
    @CacheEvict(value = {"seekerApplications", "applicationStats"}, allEntries = true)
    public ApplicationResponse apply(Long seekerId, CreateApplicationRequest request) {

        if (applicationRepository.existsBySeekerIdAndJobPostingId(seekerId, request.jobPostingId())) {
            throw new IllegalStateException(
                    "Seeker " + seekerId + " has already applied to job posting " + request.jobPostingId());
        }

        // Resolve UUID now — used both to populate jobListingId on the entity
        // and later for view-count increment + notifications.
        String resolvedUuid = null;
        try {
            resolvedUuid = jobListingRepository.findIdByNumericalId(request.jobPostingId());
        } catch (Exception e) {
            log.warn("Could not resolve numericId {} to UUID: {}", request.jobPostingId(), e.getMessage());
        }

        Application application = applicationMapper.toEntity(request, seekerId);
        application.setJobListingId(resolvedUuid);   // store UUID so frontend can fetch job detail directly
        Application saved = applicationRepository.save(application);

        log.info("New application created: id={}, seekerId={}, jobPostingId={}, jobListingId={}",
                saved.getId(), seekerId, request.jobPostingId(), resolvedUuid);

        Long employerId = null;
        // Increment view count of the job listing and notify employer
        try {
            String uuidStr = resolvedUuid;
            if (uuidStr != null) {
                JobListing job = jobListingRepository.findById(UUID.fromString(uuidStr)).orElse(null);
                if (job != null) {
                    employerId = job.getEmployerId();
                    job.incrementViewCount();
                    jobListingRepository.save(job);

                    // Notify employer
                    User employer = userRepository.findById(job.getEmployerId()).orElse(null);
                    User seeker = userRepository.findById(seekerId).orElse(null);
                    if (employer != null && seeker != null) {
                        eventPublisher.publishEvent(new NotificationEvent(
                                this,
                                employer,
                                "New Application Received",
                                "A new application has been submitted by " + seeker.getFullName() + " for the position of " + job.getTitle() + ".",
                                NotificationType.NEW_APPLICATION
                        ));

                        eventPublisher.publishEvent(new NotificationEvent(
                                this,
                                seeker,
                                "Application Submitted Successfully",
                                "Hello " + seeker.getFullName() + ",\n\nYour application for the position of " + job.getTitle() + " has been successfully submitted. We will notify you when there is an update.",
                                NotificationType.APPLICATION_STATUS
                        ));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to increment view count or notify employer: {}", e.getMessage());
        }

        ApplicationResponse response = applicationMapper.toResponse(saved);
        if (employerId == null) {
            employerId = resolveEmployerId(saved.getJobPostingId());
        }
        realtimeMessagingService.publishApplicationEvent("APPLICATION_CREATED", response, employerId);
        return response;
    }

    private Long resolveEmployerId(Long jobPostingId) {
        try {
            String uuidStr = jobListingRepository.findIdByNumericalId(jobPostingId);
            if (uuidStr == null) return null;
            return jobListingRepository.findById(UUID.fromString(uuidStr))
                    .map(JobListing::getEmployerId)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    // ------------------------------------------------------------------ //
    //  Read                                                                //
    // ------------------------------------------------------------------ //

    @Override
    @Transactional(readOnly = true)
    public ApplicationResponse getById(Long applicationId) {
        Application application = findByIdWithInterview(applicationId);
        return applicationMapper.toResponse(application);
    }

    @Override
    @Transactional(readOnly = true)
    public ApplicationPageResponse getAll(ApplicationFilterRequest filter) {

        Pageable pageable = PageRequest.of(
                filter.page(),
                filter.size(),
                Sort.by(Sort.Direction.DESC, "appliedAt"));

        Page<Application> page;

        if (filter.seekerId() != null && filter.status() != null) {
            page = applicationRepository.findBySeekerIdAndStatus(filter.seekerId(), filter.status(), pageable);

        } else if (filter.seekerId() != null) {
            page = applicationRepository.findBySeekerId(filter.seekerId(), pageable);

        } else if (filter.jobPostingId() != null && filter.status() != null) {
            page = applicationRepository.findByJobPostingIdAndStatus(filter.jobPostingId(), filter.status(), pageable);

        } else if (filter.jobPostingId() != null) {
            page = applicationRepository.findByJobPostingId(filter.jobPostingId(), pageable);

        } else if (filter.employerId() != null && filter.status() != null) {
            Pageable nativePageable = PageRequest.of(filter.page(), filter.size(), Sort.unsorted());
            page = applicationRepository.findByEmployerIdAndStatus(
                    filter.employerId().toString(), filter.status().name(), nativePageable);

        } else if (filter.employerId() != null) {
            Pageable nativePageable = PageRequest.of(filter.page(), filter.size(), Sort.unsorted());
            page = applicationRepository.findByEmployerId(filter.employerId().toString(), nativePageable);

        } else {
            page = applicationRepository.findAll(pageable);
        }

        return new ApplicationPageResponse(
                applicationMapper.toResponseList(page.getContent()),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast());
    }

    // ------------------------------------------------------------------ //
    //  Status transitions                                                  //
    // ------------------------------------------------------------------ //

    @Override
    @Transactional
    @CacheEvict(value = {"seekerApplications", "applicationStats"}, allEntries = true)
    public ApplicationResponse updateStatus(Long applicationId, UpdateApplicationStatusRequest request) {

        Application application = findById(applicationId);

        // Allow employers to override terminal states (HIRED/REJECTED) by passing
        // the current status as expectedStatus — this enables the status-override dropdown.
        // Only block when expectedStatus doesn't match the actual current status.
        int updated = applicationRepository.updateStatusIfExpected(
                applicationId,
                request.expectedStatus(),
                request.newStatus());

        if (updated == 0) {
            // Re-fetch to get current status for a clear error message
            Application current = findById(applicationId);
            throw new IllegalStateException(
                    "Status update failed: expected status " + request.expectedStatus()
                            + " but current status is " + current.getStatus());
        }

        Application refreshed = findByIdWithInterview(applicationId);
        log.info("Application {} status updated: {} → {}", applicationId, request.expectedStatus(), request.newStatus());

        // Notify seeker
        try {
            User seeker = userRepository.findById(refreshed.getSeekerId()).orElse(null);
            if (seeker != null) {
                String jobTitle = "your applied job";
                String uuidStr = jobListingRepository.findIdByNumericalId(refreshed.getJobPostingId());
                if (uuidStr != null) {
                    JobListing job = jobListingRepository.findById(UUID.fromString(uuidStr)).orElse(null);
                    if (job != null) {
                        jobTitle = job.getTitle();
                    }
                }
                eventPublisher.publishEvent(new NotificationEvent(
                        this,
                        seeker,
                        "Application Status Update",
                        "Your application for the position of " + jobTitle + " has been updated to: " + request.newStatus() + ".",
                        NotificationType.APPLICATION_STATUS
                ));
            }
        } catch (Exception e) {
            log.warn("Failed to notify seeker of status update: {}", e.getMessage());
        }

        ApplicationResponse response = applicationMapper.toResponse(refreshed);
        realtimeMessagingService.publishApplicationEvent(
                "APPLICATION_STATUS_CHANGED", response, resolveEmployerId(refreshed.getJobPostingId()));
        return response;
    }

    @Override
    @Transactional
    @CacheEvict(value = {"seekerApplications", "applicationStats"}, allEntries = true)
    public void withdraw(Long applicationId, Long seekerId) {

        Application application = findById(applicationId);

        if (!seekerId.equals(application.getSeekerId())) {
            // AccessDeniedException is handled by Spring Security → 403
            throw new AccessDeniedException(
                    "Seeker " + seekerId + " does not own application " + applicationId);
        }

        if (!application.isWithdrawable()) {
            throw new IllegalStateException(
                    "Application " + applicationId + " cannot be withdrawn in status: " + application.getStatus());
        }

        applicationRepository.delete(application);
        log.info("Application {} withdrawn by seeker {}", applicationId, seekerId);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "seekerApplications", key = "#seekerId + '-' + #page + '-' + #size")
    public ApplicationPageResponse getWithInterviewsBySeekerId(Long seekerId, int page, int size) {
        Page<Application> pageResult = applicationRepository.findBySeekerIdWithInterview(
                seekerId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "appliedAt")));
        
        return new ApplicationPageResponse(
                applicationMapper.toResponseList(pageResult.getContent()),
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                pageResult.isLast());
    }

    // ------------------------------------------------------------------ //
    //  Stats                                                               //
    // ------------------------------------------------------------------ //

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "applicationStats", key = "(#jobPostingId != null ? #jobPostingId : 'null') + '-' + (#seekerId != null ? #seekerId : 'null')")
    public ApplicationStatsResponse getStats(Long jobPostingId, Long seekerId) {

        if (jobPostingId != null) {
            return buildJobPostingStats(jobPostingId);
        } else if (seekerId != null) {
            return buildSeekerStats(seekerId);
        } else {
            throw new IllegalArgumentException("Either jobPostingId or seekerId must be provided.");
        }
    }

    // ------------------------------------------------------------------ //
    //  Private helpers                                                     //
    // ------------------------------------------------------------------ //

    private Application findById(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Application not found: " + id));
    }

    private Application findByIdWithInterview(Long id) {
        return applicationRepository.findByIdWithInterview(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Application not found: " + id));
    }

    private ApplicationStatsResponse buildJobPostingStats(Long jobPostingId) {

        long total       = applicationRepository.countByJobPostingId(jobPostingId);
        long applied     = applicationRepository.countByJobPostingIdAndStatus(jobPostingId, ApplicationStatus.APPLIED);
        long shortlisted = applicationRepository.countByJobPostingIdAndStatus(jobPostingId, ApplicationStatus.SHORTLISTED);
        long rejected    = applicationRepository.countByJobPostingIdAndStatus(jobPostingId, ApplicationStatus.REJECTED);
        long hired       = applicationRepository.countByJobPostingIdAndStatus(jobPostingId, ApplicationStatus.HIRED);

        // Use COUNT queries — never load entities just to count
        long interviewsScheduled = interviewRepository.countByJobPostingId(jobPostingId);
        long passed  = interviewRepository.countByJobPostingIdAndResult(jobPostingId, InterviewResult.PASSED);
        long failed  = interviewRepository.countByJobPostingIdAndResult(jobPostingId, InterviewResult.FAILED);
        long noShow  = interviewRepository.countByJobPostingIdAndResult(jobPostingId, InterviewResult.NO_SHOW);

        return new ApplicationStatsResponse(
                jobPostingId, null,
                total, applied, shortlisted, rejected, hired,
                interviewsScheduled, passed, failed, noShow);
    }

    private ApplicationStatsResponse buildSeekerStats(Long seekerId) {

        long total       = applicationRepository.countBySeekerId(seekerId);
        long applied     = applicationRepository.countBySeekerIdAndStatus(seekerId, ApplicationStatus.APPLIED);
        long shortlisted = applicationRepository.countBySeekerIdAndStatus(seekerId, ApplicationStatus.SHORTLISTED);
        long rejected    = applicationRepository.countBySeekerIdAndStatus(seekerId, ApplicationStatus.REJECTED);
        long hired       = applicationRepository.countBySeekerIdAndStatus(seekerId, ApplicationStatus.HIRED);

        // Use COUNT queries — never load entities just to count
        long interviewsScheduled = interviewRepository.countBySeekerId(seekerId);
        long passed  = interviewRepository.countBySeekerIdAndResult(seekerId, InterviewResult.PASSED);
        long failed  = interviewRepository.countBySeekerIdAndResult(seekerId, InterviewResult.FAILED);
        long noShow  = interviewRepository.countBySeekerIdAndResult(seekerId, InterviewResult.NO_SHOW);

        return new ApplicationStatsResponse(
                null, seekerId,
                total, applied, shortlisted, rejected, hired,
                interviewsScheduled, passed, failed, noShow);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"seekerApplications", "applicationStats"}, allEntries = true)
    public ApplicationResponse updateReview(Long applicationId, UpdateApplicationReviewRequest request) {
        Application application = findById(applicationId);
        application.setEmployerReview(request.review());
        Application saved = applicationRepository.save(application);
        log.info("Application {} review updated by employer", applicationId);
        return applicationMapper.toResponse(saved);
    }
}