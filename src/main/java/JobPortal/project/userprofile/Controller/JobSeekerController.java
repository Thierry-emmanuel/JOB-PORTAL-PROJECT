package JobPortal.project.userprofile.Controller;

import JobPortal.project.userprofile.Model.JobSeeker;
import JobPortal.project.userprofile.Service.JobSeekerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/jobseekers")
@CrossOrigin(origins = "*")
public class JobSeekerController {

    @Autowired
    private JobSeekerService jobSeekerService;

    // GET /api/v1/jobseekers
    // Returns all JobSeekers
    @GetMapping
    public ResponseEntity<List<JobSeeker>> getAllJobSeekers() {
        List<JobSeeker> jobSeekers = jobSeekerService.getAllJobSeekers();
        return ResponseEntity.ok(jobSeekers);
    }

    // GET /api/v1/jobseekers/{id}
    // Returns a single JobSeeker by ID
    @GetMapping("/{id}")
    public ResponseEntity<JobSeeker> getJobSeekerById(@PathVariable Long id) {
        return jobSeekerService.getJobSeekerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/v1/jobseekers
    // Creates a new JobSeeker
    @PostMapping
    public ResponseEntity<JobSeeker> createJobSeeker(@RequestBody JobSeeker jobSeeker) {
        try {
            JobSeeker created = jobSeekerService.createJobSeeker(jobSeeker);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    // PUT /api/v1/jobseekers/{id}
    // Updates an existing JobSeeker profile
    @PutMapping("/{id}")
    public ResponseEntity<JobSeeker> updateJobSeeker(
            @PathVariable Long id,
            @RequestBody JobSeeker updatedData) {
        try {
            JobSeeker updated = jobSeekerService.updateJobSeeker(id, updatedData);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // GET /api/v1/jobseekers/open-to-work
    // Returns all JobSeekers who are open to work
    @GetMapping("/open-to-work")
    public ResponseEntity<List<JobSeeker>> getJobSeekersOpenToWork() {
        List<JobSeeker> jobSeekers = jobSeekerService.getJobSeekersOpenToWork();
        return ResponseEntity.ok(jobSeekers);
    }

    // PATCH /api/v1/jobseekers/{id}/deactivate
    // Deactivates a JobSeeker account (soft delete)
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateJobSeeker(@PathVariable Long id) {
        try {
            jobSeekerService.deactivateJobSeeker(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE /api/v1/jobseekers/{id}
    // Permanently deletes a JobSeeker
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJobSeeker(@PathVariable Long id) {
        try {
            jobSeekerService.deleteJobSeeker(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
