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
import JobPortal.project.modules.application.service.GoogleCalendarService;
import JobPortal.project.modules.application.service.InterviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import JobPortal.project.modules.joblisting.entity.JobListing;
import JobPortal.project.modules.joblisting.repository.JobListingRepository;
import JobPortal.project.modules.auth.model.User;
import JobPortal.project.modules.auth.repository.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import JobPortal.project.modules.notification.event.NotificationEvent;
import JobPortal.project.enums.NotificationType;
import java.util.UUID;


@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewServiceImpl implements InterviewService {

    private final InterviewRepository   interviewRepository;
    private final ApplicationRepository applicationRepository;
    private final InterviewMapper       interviewMapper;
    private final ApplicationMapper     applicationMapper;
    private final GoogleCalendarService  googleCalendarService;
    private final JobListingRepository  jobListingRepository;
    private final UserRepository        userRepository;
    private final ApplicationEventPublisher eventPublisher;

    // ------------------------------------------------------------------ //
    //  Schedule                                                            //
    // ------------------------------------------------------------------ //

    @Override
    @Transactional
    @CacheEvict(value = "jobInterviews", allEntries = true)
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

        // Ensure VIDEO interviews always have a meeting link.
        // GoogleCalendarService will overwrite this with a real Meet URL if the
        // employer is authenticated via Google OAuth2; otherwise the generated
        // code acts as a valid stand-alone Google Meet room link.
        if (interview.getType() == InterviewType.VIDEO
                && (interview.getMeetingLink() == null || interview.getMeetingLink().isBlank())) {
            interview.setMeetingLink(generateRandomMeetLink());
            interview.setPlatform("Google Meet");
        }

        Interview saved = interviewRepository.save(interview);
        log.info("Interview scheduled: id={}, applicationId={}, type={}, scheduledAt={}",
                saved.getId(), applicationId, saved.getType(), request.scheduledAt());
        syncCalendar(saved);
        sendInterviewNotification(application, saved);
        return interviewMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "jobInterviews", allEntries = true)
    public InterviewResponse scheduleForEmployer(Long employerId, Long applicationId,
                                                 ScheduleInterviewRequest request) {

        Application application = findApplicationById(applicationId);

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

        // Same fallback Meet link logic as schedule().
        if (interview.getType() == InterviewType.VIDEO
                && (interview.getMeetingLink() == null || interview.getMeetingLink().isBlank())) {
            interview.setMeetingLink(generateRandomMeetLink());
            interview.setPlatform("Google Meet");
        }

        Interview saved = interviewRepository.save(interview);
        log.info("Interview scheduled by employer {}: id={}, applicationId={}, type={}, scheduledAt={}",
                employerId, saved.getId(), applicationId, saved.getType(), request.scheduledAt());
        syncCalendar(saved);
        sendInterviewNotification(application, saved);
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
    public InterviewPageResponse getBySeekerIdId(Long seekerId, int page, int size) {
        Page<Interview> interviews = interviewRepository.findBySeekerIdWithApplication(
                seekerId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "scheduledAt")));
        return toPageResponse(interviews);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "jobInterviews", key = "#jobPostingId + '-' + #page + '-' + #size")
    public InterviewPageResponse getByJobPostingId(Long jobPostingId, int page, int size) {
        Page<Interview> interviews = interviewRepository.findByJobPostingId(
                jobPostingId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "scheduledAt")));
        return toPageResponse(interviews);
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
    public InterviewPageResponse getInDateRange(LocalDateTime from, LocalDateTime to, int page, int size) {
        Page<Interview> interviews = interviewRepository.findByScheduledAtBetween(
                from, to, PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "scheduledAt")));
        return toPageResponse(interviews);
    }

    @Override
    @Transactional(readOnly = true)
    public InterviewPageResponse getSeekerInterviewsInDateRange(
            Long seekerId, LocalDateTime from, LocalDateTime to, int page, int size) {
        Page<Interview> interviews = interviewRepository.findBySeekerIdAndScheduledAtBetween(
                seekerId, from, to, PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "scheduledAt")));
        return toPageResponse(interviews);
    }

    @Override
    @Transactional(readOnly = true)
    public InterviewPageResponse getAllPending(int page, int size) {
        Page<Interview> interviews = interviewRepository.findAllPending(
                LocalDateTime.now(), PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "scheduledAt")));
        return toPageResponse(interviews);
    }

    @Override
    @Transactional(readOnly = true)
    public InterviewPageResponse getPendingBySeekerId(Long seekerId, int page, int size) {
        Page<Interview> interviews = interviewRepository.findPendingBySeekerId(
                seekerId, LocalDateTime.now(), PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "scheduledAt")));
        return toPageResponse(interviews);
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
    @CacheEvict(value = "jobInterviews", allEntries = true)
    public InterviewResponse reschedule(Long interviewId, RescheduleInterviewRequest request) {

        Interview interview = findByIdWithApplication(interviewId);

        if (interview.isCompleted()) {
            throw new IllegalStateException(
                    "Cannot reschedule a completed interview: " + interviewId);
        }

        interviewMapper.applyReschedule(request, interview);

        // Update or clear the meeting link based on what was provided
        if (request.meetingLink() != null && !request.meetingLink().isBlank()) {
            interview.setMeetingLink(request.meetingLink());
        } else {
            // If a blank/empty string was sent, clear the stored link so we can regenerate
            interview.setMeetingLink(null);
        }

        // For VIDEO interviews with no meeting link, auto-generate a fallback Meet link
        if (interview.getType() == InterviewType.VIDEO
                && (interview.getMeetingLink() == null || interview.getMeetingLink().isBlank())) {
            interview.setMeetingLink(generateRandomMeetLink());
            interview.setPlatform("Google Meet");
            log.info("Auto-generated fallback Meet link for rescheduled interview {}", interviewId);
        }

        Interview saved = interviewRepository.save(interview);
        log.info("Interview {} rescheduled to {}", interviewId, request.newScheduledAt());

        // Update Google Calendar
        if (saved.getGoogleCalendarEventId() != null) {
            googleCalendarService.cancelInterviewEvent(saved.getGoogleCalendarEventId()); // Simple approach: recreate
            String newEventId = googleCalendarService.createInterviewEvent(saved);
            saved.setGoogleCalendarEventId(newEventId);
            interviewRepository.save(saved);
        }

        return interviewMapper.toResponse(saved);
    }

    // ------------------------------------------------------------------ //
    //  Record result                                                       //
    // ------------------------------------------------------------------ //

    @Override
    @Transactional
    @CacheEvict(value = "jobInterviews", allEntries = true)
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
    @CacheEvict(value = "jobInterviews", allEntries = true)
    public void cancel(Long interviewId) {

        Interview interview = findByIdWithApplication(interviewId);

        if (interview.isCompleted()) {
            throw new IllegalStateException(
                    "Cannot cancel a completed interview: " + interviewId);
        }

        // Cancel Google Calendar event
        if (interview.getGoogleCalendarEventId() != null) {
            googleCalendarService.cancelInterviewEvent(interview.getGoogleCalendarEventId());
        }

        // Notify candidate of cancellation
        try {
            Application application = interview.getApplication();
            if (application != null) {
                User seeker = userRepository.findById(application.getSeekerId()).orElse(null);
                if (seeker != null) {
                    String jobTitle = "your applied job";
                    String uuidStr = jobListingRepository.findIdByNumericalId(application.getJobPostingId());
                    if (uuidStr != null) {
                        JobListing job = jobListingRepository.findById(UUID.fromString(uuidStr)).orElse(null);
                        if (job != null) {
                            jobTitle = job.getTitle();
                        }
                    }
                    eventPublisher.publishEvent(new NotificationEvent(
                            this,
                            seeker,
                            "Interview Cancelled",
                            "Hello " + seeker.getFullName() + ",\n\nYour scheduled interview for the position of " + jobTitle + " has been cancelled.",
                            NotificationType.APPLICATION_STATUS
                    ));
                }
            }
        } catch (Exception e) {
            log.warn("Failed to notify seeker of cancelled interview: {}", e.getMessage());
        }

        interviewRepository.delete(interview);
        log.info("Interview {} cancelled", interviewId);
    }

    @Override
    @Transactional(readOnly = true)
    public InterviewPageResponse getByEmployerId(Long employerId, int page, int size) {
        Page<Interview> interviews = interviewRepository.findByEmployerId(
                employerId.toString(), PageRequest.of(page, size, Sort.unsorted()));
        return toPageResponse(interviews);
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

    /**
     * Syncs an interview to Google Calendar after it is saved.
     * Stores the returned event ID back on the entity for future updates/cancellations.
     * Gracefully no-ops when the user is not authenticated via OAuth2.
     *
     * For VIDEO interviews the GoogleCalendarService may write a real Meet URL
     * back onto the entity; we persist that change here.
     */
    private void syncCalendar(Interview interview) {
        String eventId = googleCalendarService.createInterviewEvent(interview);
        if (eventId != null) {
            interview.setGoogleCalendarEventId(eventId);
            interviewRepository.save(interview);
        }
    }

    // ── Private helpers ─────────────────────────────────────────────────────────

    /**
     * Generates a Google-Meet-formatted random room code, e.g.
     * {@code https://meet.google.com/abc-defg-hij}.
     * This is used as a reliable fallback when the employer is not signed in via
     * Google OAuth2 and the Calendar API therefore cannot provision a real room.
     * The link resolves to a valid (though unregistered) Google Meet lobby.
     */
    private String generateRandomMeetLink() {
        final String CHARS = "abcdefghijklmnopqrstuvwxyz";
        Random rng = new Random();
        StringBuilder sb = new StringBuilder("https://meet.google.com/");
        for (int i = 0; i < 3; i++)  sb.append(CHARS.charAt(rng.nextInt(CHARS.length())));
        sb.append('-');
        for (int i = 0; i < 4; i++)  sb.append(CHARS.charAt(rng.nextInt(CHARS.length())));
        sb.append('-');
        for (int i = 0; i < 3; i++)  sb.append(CHARS.charAt(rng.nextInt(CHARS.length())));
        return sb.toString();
    }

    private void sendInterviewNotification(Application application, Interview interview) {
        try {
            User seeker = userRepository.findById(application.getSeekerId()).orElse(null);
            if (seeker != null) {
                String jobTitle = "your applied job";
                String uuidStr = jobListingRepository.findIdByNumericalId(application.getJobPostingId());
                if (uuidStr != null) {
                    JobListing job = jobListingRepository.findById(UUID.fromString(uuidStr)).orElse(null);
                    if (job != null) {
                        jobTitle = job.getTitle();
                    }
                }
                String message = "Your interview for the position of " + jobTitle + " has been scheduled on " +
                        interview.getScheduledAt() + ". Format: " + interview.getType() + ". " +
                        (interview.getMeetingLink() != null ? "Meeting link: " + interview.getMeetingLink() : "");

                eventPublisher.publishEvent(new NotificationEvent(
                        this,
                        seeker,
                        "Interview Scheduled",
                        message,
                        NotificationType.APPLICATION_STATUS
                ));
            }
        } catch (Exception e) {
            log.warn("Failed to notify seeker of scheduled interview: {}", e.getMessage());
        }
    }
}


