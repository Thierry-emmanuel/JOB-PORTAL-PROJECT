package JobPortal.project.modules.application.controller.rest;

import JobPortal.project.modules.application.dto.request.AddFeedbackRequest;
import JobPortal.project.modules.application.dto.request.RecordInterviewResultRequest;
import JobPortal.project.modules.application.dto.request.RescheduleInterviewRequest;
import JobPortal.project.modules.application.dto.request.ScheduleInterviewRequest;
import JobPortal.project.modules.application.dto.response.ApplicationResponse;
import JobPortal.project.modules.application.dto.response.InterviewPageResponse;
import JobPortal.project.modules.application.dto.response.InterviewResponse;
import JobPortal.project.modules.application.enums.InterviewType;
import JobPortal.project.modules.application.service.InterviewService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;


@RestController
@RequestMapping("/api/v1/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    // ------------------------------------------------------------------ //
    //  POST /api/v1/interviews/applications/{applicationId}               //
    //  Schedule an interview for a shortlisted application                //
    // ------------------------------------------------------------------ //

    @PostMapping("/applications/{applicationId}")
    public ResponseEntity<InterviewResponse> schedule(
            @PathVariable Long applicationId,
            @Valid @RequestBody ScheduleInterviewRequest request) {

        InterviewResponse response = interviewService.schedule(applicationId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ------------------------------------------------------------------ //
    //  GET /api/v1/interviews/{id}                                         //
    //  Retrieve an interview by its own ID                                 //
    // ------------------------------------------------------------------ //

    @GetMapping("/{id}")
    public ResponseEntity<InterviewResponse> getById(@PathVariable Long id) {
        InterviewResponse response = interviewService.getById(id);
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  GET /api/v1/interviews/applications/{applicationId}                //
    //  Retrieve the interview linked to a specific application            //
    // ------------------------------------------------------------------ //

    @GetMapping("/applications/{applicationId}")
    public ResponseEntity<InterviewResponse> getByApplicationId(@PathVariable Long applicationId) {
        InterviewResponse response = interviewService.getByApplicationId(applicationId);
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  GET /api/v1/interviews?seekerId=...                                 //
    //  All interviews for a seeker                                         //
    // ------------------------------------------------------------------ //

    @GetMapping("/seekers/{seekerId}")
    public ResponseEntity<List<InterviewResponse>> getBySeekerId(@PathVariable Long seekerId) {
        List<InterviewResponse> response = interviewService.getBySeekerIdId(seekerId);
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  GET /api/v1/interviews/job-postings/{jobPostingId}                 //
    //  All interviews for a job posting                                    //
    // ------------------------------------------------------------------ //

    @GetMapping("/job-postings/{jobPostingId}")
    public ResponseEntity<List<InterviewResponse>> getByJobPostingId(@PathVariable Long jobPostingId) {
        List<InterviewResponse> response = interviewService.getByJobPostingId(jobPostingId);
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  GET /api/v1/interviews/job-postings/{jobPostingId}/shortlisted     //
    //  SHORTLISTED applications for a posting eligible for scheduling     //
    // ------------------------------------------------------------------ //

    @GetMapping("/job-postings/{jobPostingId}/shortlisted")
    public ResponseEntity<List<ApplicationResponse>> getShortlistedForPosting(
            @PathVariable Long jobPostingId) {

        List<ApplicationResponse> response = interviewService.getShortlistedForPosting(jobPostingId);
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  GET /api/v1/interviews/seekers/{seekerId}/paged                    //
    //  Paginated interviews for a seeker                                  //
    // ------------------------------------------------------------------ //

    @GetMapping("/seekers/{seekerId}/paged")
    public ResponseEntity<InterviewPageResponse> getBySeekerIdPaged(
            @PathVariable Long seekerId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {

        InterviewPageResponse response = interviewService.getBySeekerIdPaged(seekerId, page, size);
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  GET /api/v1/interviews/seekers/{seekerId}/pending                  //
    //  Pending (upcoming, no result) interviews for a seeker              //
    // ------------------------------------------------------------------ //

    @GetMapping("/seekers/{seekerId}/pending")
    public ResponseEntity<List<InterviewResponse>> getPendingBySeekerId(@PathVariable Long seekerId) {
        List<InterviewResponse> response = interviewService.getPendingBySeekerId(seekerId);
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  GET /api/v1/interviews/seekers/{seekerId}/date-range               //
    //  Seeker's interviews within a time window                           //
    // ------------------------------------------------------------------ //

    @GetMapping("/seekers/{seekerId}/date-range")
    public ResponseEntity<List<InterviewResponse>> getSeekerInterviewsInDateRange(
            @PathVariable Long seekerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        List<InterviewResponse> response = interviewService.getSeekerInterviewsInDateRange(seekerId, from, to);
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  GET /api/v1/interviews/type/{type}                                 //
    //  Paginated interviews filtered by type                              //
    // ------------------------------------------------------------------ //

    @GetMapping("/type/{type}")
    public ResponseEntity<InterviewPageResponse> getByType(
            @PathVariable InterviewType type,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {

        InterviewPageResponse response = interviewService.getByType(type, page, size);
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  GET /api/v1/interviews/pending                                     //
    //  All pending interviews platform-wide (admin)                       //
    // ------------------------------------------------------------------ //

    @GetMapping("/pending")
    public ResponseEntity<List<InterviewResponse>> getAllPending() {
        List<InterviewResponse> response = interviewService.getAllPending();
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  GET /api/v1/interviews/date-range                                  //
    //  All interviews within a time window (admin)                        //
    // ------------------------------------------------------------------ //

    @GetMapping("/date-range")
    public ResponseEntity<List<InterviewResponse>> getInDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        List<InterviewResponse> response = interviewService.getInDateRange(from, to);
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  GET /api/v1/interviews/applications/{applicationId}/simple         //
    //  Lightweight lookup — no eager join on application                  //
    // ------------------------------------------------------------------ //

    @GetMapping("/applications/{applicationId}/simple")
    public ResponseEntity<InterviewResponse> getByApplicationIdSimple(
            @PathVariable Long applicationId) {

        InterviewResponse response = interviewService.getByApplicationIdSimple(applicationId);
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  PATCH /api/v1/interviews/{id}/reschedule                           //
    //  Move the interview to a new date/time                              //
    // ------------------------------------------------------------------ //

    @PatchMapping("/{id}/reschedule")
    public ResponseEntity<InterviewResponse> reschedule(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleInterviewRequest request) {

        InterviewResponse response = interviewService.reschedule(id, request);
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  PATCH /api/v1/interviews/{id}/result                               //
    //  Record the outcome of a completed interview                         //
    // ------------------------------------------------------------------ //

    @PatchMapping("/{id}/result")
    public ResponseEntity<InterviewResponse> recordResult(
            @PathVariable Long id,
            @Valid @RequestBody RecordInterviewResultRequest request) {

        InterviewResponse response = interviewService.recordResult(
                id, request.result(), request.feedback());
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  PATCH /api/v1/interviews/{id}/feedback                             //
    //  Add or replace textual feedback on an interview                     //
    // ------------------------------------------------------------------ //

    @PatchMapping("/{id}/feedback")
    public ResponseEntity<InterviewResponse> addFeedback(
            @PathVariable Long id,
            @Valid @RequestBody AddFeedbackRequest request) {

        InterviewResponse response = interviewService.addFeedback(id, request.feedback());
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  DELETE /api/v1/interviews/{id}                                      //
    //  Cancel a pending interview                                           //
    // ------------------------------------------------------------------ //

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        interviewService.cancel(id);
        return ResponseEntity.noContent().build();
    }
}


