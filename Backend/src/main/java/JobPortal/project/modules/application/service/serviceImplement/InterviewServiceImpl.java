package JobPortal.project.modules.application.service.serviceImplement;

import JobPortal.project.modules.application.dto.request.RescheduleInterviewRequest;
import JobPortal.project.modules.application.dto.request.ScheduleInterviewRequest;
import JobPortal.project.modules.application.dto.response.ApplicationResponse;
import JobPortal.project.modules.application.dto.response.InterviewPageResponse;
import JobPortal.project.modules.application.dto.response.InterviewResponse;
import JobPortal.project.modules.application.enums.ApplicationStatus;
import JobPortal.project.modules.application.enums.InterviewResult;
import JobPortal.project.modules.application.enums.InterviewType;
import JobPortal.project.modules.application.mapper.ApplicationMapper;
import JobPortal.project.modules.application.mapper.InterviewMapper;
import JobPortal.project.modules.application.model.Application;
import JobPortal.project.modules.application.model.Interview;
import JobPortal.project.modules.application.repository.ApplicationRepository;
import JobPortal.project.modules.application.repository.InterviewRepository;
import JobPortal.project.modules.application.service.InterviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;


@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewServiceImpl implements InterviewService {

    private final InterviewRepository   interviewRepository;
    private final ApplicationRepository applicationRepository;
    private final InterviewMapper       interviewMapper;
    private final ApplicationMapper     applicationMapper;

    // ------------------------------------------------------------------ //
    //  Schedule                                                            //
    // ------------------------------------------------------------------ //

    @Override
    @Transactional
    public InterviewResponse schedule(Long applicationId, ScheduleInterviewRequest request) {

        Application application = findApplicationById(applicationId);

        if (application.getStatus() != ApplicationStatus.SHORTLISTED) {
            throw new IllegalStateException(
                    "An interview can only be scheduled for a SHORTLISTED application. " +
                            "Current status: " + application.getStatus());
        }

        if (interviewRepository.existsByApplicationId(applicationId)) {
            throw new IllegalStateException(
                    "Application " + applicationId + " already has a scheduled interview.");
        }

        Interview interview = interviewMapper.toEntity(request);
        interview.setApplication(application);

        Interview saved = interviewRepository.save(interview);
        log.info("Interview scheduled: id={}, applicationId={}, scheduledAt={}",
                saved.getId(), applicationId, request.scheduledAt());

        return interviewMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public InterviewResponse scheduleForEmployer(Long employerId, Long applicationId,
                                                 ScheduleInterviewRequest request) {

        Application application = findApplicationById(applicationId);

        // Ownership check: verify this application belongs to a posting owned by this employer.
        // Uses a native sub-query via the repository rather than loading the JobPosting entity
        // (which lives in a different module and is not visible to this persistence context).
        boolean owned = applicationRepository.existsByIdAndEmployerId(
                applicationId, employerId.toString());
        if (!owned) {
            throw new AccessDeniedException(
                    "Employer " + employerId + " does not own the job posting for application " + applicationId);
        }

        if (application.getStatus() != ApplicationStatus.SHORTLISTED) {
            throw new IllegalStateException(
                    "An interview can only be scheduled for a SHORTLISTED application. " +
                            "Current status: " + application.getStatus());
        }

        if (interviewRepository.existsByApplicationId(applicationId)) {
            throw new IllegalStateException(
                    "Application " + applicationId + " already has a scheduled interview.");
        }

        Interview interview = interviewMapper.toEntity(request);
        interview.setApplication(application);

        Interview saved = interviewRepository.save(interview);
        log.info("Interview scheduled by employer {}: id={}, applicationId={}, scheduledAt={}",
                employerId, saved.getId(), applicationId, request.scheduledAt());

        return interviewMapper.toResponse(saved);
    }


    @Override
    @Transactional(readOnly = true)
    public InterviewResponse getById(Long interviewId) {
        Interview interview = findByIdWithApplication(interviewId);
        return interviewMapper.toResponse(interview);
    }

    @Override
    @Transactional(readOnly = true)
    public InterviewResponse getByApplicationId(Long applicationId) {
        Interview interview = interviewRepository.findByApplicationIdWithApplication(applicationId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "No interview found for application: " + applicationId));
        return interviewMapper.toResponse(interview);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InterviewResponse> getBySeekerIdId(Long seekerId) {
        List<Interview> interviews = interviewRepository.findBySeekerIdWithApplication(seekerId);
        return interviewMapper.toResponseList(interviews);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InterviewResponse> getByJobPostingId(Long jobPostingId) {
        List<Interview> interviews = interviewRepository.findByJobPostingId(jobPostingId);
        return interviewMapper.toResponseList(interviews);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getShortlistedForPosting(Long jobPostingId) {
        List<Application> shortlisted = applicationRepository.findShortlistedByJobPostingId(
                jobPostingId, ApplicationStatus.SHORTLISTED);
        return applicationMapper.toResponseList(shortlisted);
    }

    @Override
    @Transactional(readOnly = true)
    public InterviewPageResponse getBySeekerIdPaged(Long seekerId, int page, int size) {
        Page<Interview> result = interviewRepository.findBySeekerId(
                seekerId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "scheduledAt")));
        return toPageResponse(result);
    }

    @Override
    @Transactional(readOnly = true)
    public InterviewPageResponse getByType(InterviewType type, int page, int size) {
        Page<Interview> result = interviewRepository.findByType(
                type,
                PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "scheduledAt")));
        return toPageResponse(result);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InterviewResponse> getInDateRange(LocalDateTime from, LocalDateTime to) {
        List<Interview> interviews = interviewRepository.findByScheduledAtBetween(from, to);
        return interviewMapper.toResponseList(interviews);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InterviewResponse> getSeekerInterviewsInDateRange(
            Long seekerId, LocalDateTime from, LocalDateTime to) {
        List<Interview> interviews = interviewRepository.findBySeekerIdAndScheduledAtBetween(
                seekerId, from, to);
        return interviewMapper.toResponseList(interviews);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InterviewResponse> getAllPending() {
        List<Interview> interviews = interviewRepository.findAllPending(LocalDateTime.now());
        return interviewMapper.toResponseList(interviews);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InterviewResponse> getPendingBySeekerId(Long seekerId) {
        List<Interview> interviews = interviewRepository.findPendingBySeekerId(
                seekerId, LocalDateTime.now());
        return interviewMapper.toResponseList(interviews);
    }

    @Override
    @Transactional(readOnly = true)
    public InterviewResponse getByApplicationIdSimple(Long applicationId) {
        Interview interview = interviewRepository.findByApplicationId(applicationId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "No interview found for application: " + applicationId));
        return interviewMapper.toResponse(interview);
    }

    // ------------------------------------------------------------------ //
    //  Reschedule                                                          //
    // ------------------------------------------------------------------ //

    @Override
    @Transactional
    public InterviewResponse reschedule(Long interviewId, RescheduleInterviewRequest request) {

        Interview interview = findByIdWithApplication(interviewId);

        if (interview.isCompleted()) {
            throw new IllegalStateException(
                    "Cannot reschedule a completed interview: " + interviewId);
        }

        interviewMapper.applyReschedule(request, interview);

        if (request.meetingLink() != null) {
            interview.setMeetingLink(request.meetingLink());
        }

        Interview saved = interviewRepository.save(interview);
        log.info("Interview {} rescheduled to {}", interviewId, request.newScheduledAt());
        return interviewMapper.toResponse(saved);
    }

    // ------------------------------------------------------------------ //
    //  Record result                                                       //
    // ------------------------------------------------------------------ //

    @Override
    @Transactional
    public InterviewResponse recordResult(Long interviewId, InterviewResult result, String feedback) {

        Interview interview = findByIdWithApplication(interviewId);

        if (interview.isCompleted()) {
            throw new IllegalStateException(
                    "Interview " + interviewId + " already has a recorded result: " + interview.getResult());
        }

        interview.setResult(result);
        if (feedback != null && !feedback.isBlank()) {
            interview.setFeedBack(feedback);
        }

        // Cascade result to the linked application status
        Application application = interview.getApplication();
        ApplicationStatus newAppStatus = (result == InterviewResult.PASSED)
                ? ApplicationStatus.HIRED
                : ApplicationStatus.REJECTED;

        application.setStatus(newAppStatus);
        applicationRepository.save(application);

        Interview saved = interviewRepository.save(interview);
        log.info("Interview {} result recorded: {} → application {} → {}",
                interviewId, result, application.getId(), newAppStatus);

        return interviewMapper.toResponse(saved);
    }

    // ------------------------------------------------------------------ //
    //  Feedback                                                            //
    // ------------------------------------------------------------------ //

    @Override
    @Transactional
    public InterviewResponse addFeedback(Long interviewId, String feedback) {

        Interview interview = findByIdWithApplication(interviewId);
        interview.setFeedBack(feedback);

        Interview saved = interviewRepository.save(interview);
        log.info("Feedback added/updated for interview {}", interviewId);
        return interviewMapper.toResponse(saved);
    }

    // ------------------------------------------------------------------ //
    //  Cancel                                                              //
    // ------------------------------------------------------------------ //

    @Override
    @Transactional
    public void cancel(Long interviewId) {

        Interview interview = findByIdWithApplication(interviewId);

        if (interview.isCompleted()) {
            throw new IllegalStateException(
                    "Cannot cancel a completed interview: " + interviewId);
        }

        interviewRepository.delete(interview);
        log.info("Interview {} cancelled", interviewId);
    }

    // ------------------------------------------------------------------ //
    //  Private helpers                                                     //
    // ------------------------------------------------------------------ //

    private InterviewPageResponse toPageResponse(Page<Interview> page) {
        return new InterviewPageResponse(
                interviewMapper.toResponseList(page.getContent()),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast());
    }

    private Interview findByIdWithApplication(Long id) {
        return interviewRepository.findByIdWithApplication(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Interview not found: " + id));
    }

    private Application findApplicationById(Long applicationId) {
        return applicationRepository.findById(applicationId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Application not found: " + applicationId));
    }
}


