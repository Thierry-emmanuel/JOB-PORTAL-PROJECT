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

import java.util.List;


@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final InterviewRepository   interviewRepository;
    private final ApplicationMapper     applicationMapper;

    // ------------------------------------------------------------------ //
    //  Apply                                                               //
    // ------------------------------------------------------------------ //

    @Override
    @Transactional
    public ApplicationResponse apply(Long seekerId, CreateApplicationRequest request) {

        if (applicationRepository.existsBySeekerIdAndJobPostingId(seekerId, request.jobPostingId())) {
            throw new IllegalStateException(
                    "Seeker " + seekerId + " has already applied to job posting " + request.jobPostingId());
        }

        Application application = applicationMapper.toEntity(request, seekerId);
        Application saved = applicationRepository.save(application);

        log.info("New application created: id={}, seekerId={}, jobPostingId={}",
                saved.getId(), seekerId, request.jobPostingId());

        return applicationMapper.toResponse(saved);
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
            page = applicationRepository.findByEmployerIdAndStatus(
                    filter.employerId().toString(), filter.status().name(), pageable);

        } else if (filter.employerId() != null) {
            page = applicationRepository.findByEmployerId(filter.employerId().toString(), pageable);

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
    public ApplicationResponse updateStatus(Long applicationId, UpdateApplicationStatusRequest request) {

        Application application = findById(applicationId);

        if (application.isTerminal()) {
            throw new IllegalStateException(
                    "Application " + applicationId + " is in a terminal state and cannot be updated.");
        }

        int updated = applicationRepository.updateStatusIfExpected(
                applicationId,
                request.expectedStatus(),
                request.newStatus());

        if (updated == 0) {
            throw new IllegalStateException(
                    "Status update failed: expected status " + request.expectedStatus()
                            + " but current status is " + application.getStatus());
        }

        Application refreshed = findByIdWithInterview(applicationId);
        log.info("Application {} status updated: {} → {}", applicationId, request.expectedStatus(), request.newStatus());
        return applicationMapper.toResponse(refreshed);
    }

    @Override
    @Transactional
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
    public List<ApplicationResponse> getWithInterviewsBySeekerId(Long seekerId) {
        List<Application> applications = applicationRepository.findBySeekerIdWithInterview(seekerId);
        return applicationMapper.toResponseList(applications);
    }

    // ------------------------------------------------------------------ //
    //  Stats                                                               //
    // ------------------------------------------------------------------ //

    @Override
    @Transactional(readOnly = true)
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
}


