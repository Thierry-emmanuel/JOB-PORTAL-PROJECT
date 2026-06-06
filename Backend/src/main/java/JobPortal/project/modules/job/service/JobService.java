package JobPortal.project.modules.job.service;

import JobPortal.project.modules.job.enums.JobStatus;
import JobPortal.project.modules.job.model.Job;
import JobPortal.project.modules.job.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;

    @Transactional(readOnly = true)
    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Job> getJobsByStatus(JobStatus status) {
        return jobRepository.findAllByStatus(status);
    }

    @Transactional
    public Job createJob(Job job) {
        // Defaults to PENDING_APPROVAL
        job.setStatus(JobStatus.PENDING_APPROVAL);
        return jobRepository.save(job);
    }

    @Transactional
    public Job updateJobStatus(Long id, JobStatus newStatus) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + id));
        job.setStatus(newStatus);
        return jobRepository.save(job);
    }

    @Transactional
    public void deleteJob(Long id) {
        if (!jobRepository.existsById(id)) {
            throw new RuntimeException("Job not found with id: " + id);
        }
        jobRepository.deleteById(id);
    }
}
