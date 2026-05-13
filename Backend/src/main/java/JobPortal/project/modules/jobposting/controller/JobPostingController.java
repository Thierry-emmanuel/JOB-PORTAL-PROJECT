package JobPortal.project.modules.jobposting.controller;

import JobPortal.project.modules.jobposting.model.JobPosting;
import JobPortal.project.modules.jobposting.repository.JobPostingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobPostingController {

    private final JobPostingRepository jobPostingRepository;

    @GetMapping
    public ResponseEntity<Page<JobPosting>> getAllJobs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        // Frontend uses 1-based indexing for pages, Spring uses 0-based
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());
        
        Page<JobPosting> jobs = jobPostingRepository.searchJobs(
                (search == null || search.isEmpty()) ? null : search,
                (location == null || location.isEmpty()) ? null : location,
                (type == null || type.isEmpty()) ? null : type,
                pageable
        );
        
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobPosting> getJobById(@PathVariable Long id) {
        return jobPostingRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<JobPosting> createJob(@RequestBody JobPosting jobPosting) {
        return ResponseEntity.ok(jobPostingRepository.save(jobPosting));
    }
}
