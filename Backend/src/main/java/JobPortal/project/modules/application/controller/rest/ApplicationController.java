package JobPortal.project.modules.application.controller.rest;

import JobPortal.project.modules.application.dto.request.ApplicationFilterRequest;
import JobPortal.project.modules.application.dto.request.CreateApplicationRequest;
import JobPortal.project.modules.application.dto.request.UpdateApplicationStatusRequest;
import JobPortal.project.modules.application.dto.response.ApplicationPageResponse;
import JobPortal.project.modules.application.dto.response.ApplicationResponse;
import JobPortal.project.modules.application.dto.response.ApplicationStatsResponse;
import JobPortal.project.modules.application.enums.ApplicationStatus;
import JobPortal.project.modules.application.service.ApplicationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    // ------------------------------------------------------------------ //
    //  POST /api/v1/applications                                           //
    //  Submit a new application (seeker action)                           //
    // ------------------------------------------------------------------ //

    @PostMapping
    public ResponseEntity<ApplicationResponse> apply(
            @RequestParam Long seekerId,
            @Valid @RequestBody CreateApplicationRequest request) {

        ApplicationResponse response = applicationService.apply(seekerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ------------------------------------------------------------------ //
    //  GET /api/v1/applications/{id}                                       //
    //  Retrieve a single application by ID                                 //
    // ------------------------------------------------------------------ //

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationResponse> getById(@PathVariable Long id) {
        ApplicationResponse response = applicationService.getById(id);
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  GET /api/v1/applications                                            //
    //  Paginated + filtered list of applications                           //
    // ------------------------------------------------------------------ //

    @GetMapping
    public ResponseEntity<ApplicationPageResponse> getAll(
            @RequestParam(required = false) Long seekerId,
            @RequestParam(required = false) Long jobPostingId,
            @RequestParam(required = false) Long employerId,
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {

        ApplicationFilterRequest filter = new ApplicationFilterRequest(
                seekerId, jobPostingId, employerId, status, page, size);

        ApplicationPageResponse response = applicationService.getAll(filter);
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  GET /api/v1/applications/seekers/{seekerId}/with-interviews         //
    //  All applications for a seeker, interviews eagerly loaded (no N+1)  //
    // ------------------------------------------------------------------ //

    @GetMapping("/seekers/{seekerId}/with-interviews")
    public ResponseEntity<List<ApplicationResponse>> getWithInterviewsBySeekerId(
            @PathVariable Long seekerId) {

        List<ApplicationResponse> response = applicationService.getWithInterviewsBySeekerId(seekerId);
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  PATCH /api/v1/applications/{id}/status                             //
    //  Transition an application to a new status (employer / admin)       //
    // ------------------------------------------------------------------ //

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApplicationResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateApplicationStatusRequest request) {

        ApplicationResponse response = applicationService.updateStatus(id, request);
        return ResponseEntity.ok(response);
    }

    // ------------------------------------------------------------------ //
    //  DELETE /api/v1/applications/{id}/withdraw                          //
    //  Seeker withdraws their own application                             //
    // ------------------------------------------------------------------ //

    @DeleteMapping("/{id}/withdraw")
    public ResponseEntity<Void> withdraw(
            @PathVariable Long id,
            @RequestParam Long seekerId) {

        applicationService.withdraw(id, seekerId);
        return ResponseEntity.noContent().build();
    }

    // ------------------------------------------------------------------ //
    //  GET /api/v1/applications/stats                                      //
    //  Aggregate statistics for a job posting or a seeker                  //
    // ------------------------------------------------------------------ //

    @GetMapping("/stats")
    public ResponseEntity<ApplicationStatsResponse> getStats(
            @RequestParam(required = false) Long jobPostingId,
            @RequestParam(required = false) Long seekerId) {

        ApplicationStatsResponse response = applicationService.getStats(jobPostingId, seekerId);
        return ResponseEntity.ok(response);
    }
}


