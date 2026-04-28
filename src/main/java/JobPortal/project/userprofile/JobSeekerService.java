package JobPortal.project.userprofile;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class JobSeekerService {

    @Autowired
    private JobSeekerRepository jobSeekerRepository;

    // Get all JobSeekers
    public List<JobSeeker> getAllJobSeekers() {
        return jobSeekerRepository.findAll();
    }

    // Get a JobSeeker by ID
    public Optional<JobSeeker> getJobSeekerById(Long id) {
        return jobSeekerRepository.findById(id);
    }

    // Get a JobSeeker by email
    public Optional<JobSeeker> getJobSeekerByEmail(String email) {
        return jobSeekerRepository.findByEmail(email);
    }

    // Create a new JobSeeker
    public JobSeeker createJobSeeker(JobSeeker jobSeeker) {
        if (jobSeekerRepository.existsByEmail(jobSeeker.getEmail())) {
            throw new RuntimeException("A JobSeeker with this email already exists.");
        }
        jobSeeker.computeProfileScore();
        return jobSeekerRepository.save(jobSeeker);
    }

    // Update an existing JobSeeker profile
    public JobSeeker updateJobSeeker(Long id, JobSeeker updatedData) {
        JobSeeker existing = jobSeekerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("JobSeeker not found with id: " + id));

        existing.setFullName(updatedData.getFullName());
        existing.setPhone(updatedData.getPhone());
        existing.setCity(updatedData.getCity());
        existing.setRegion(updatedData.getRegion());
        existing.setProfileSummary(updatedData.getProfileSummary());
        existing.setAvatarUrl(updatedData.getAvatarUrl());
        existing.setLinkedInUrl(updatedData.getLinkedInUrl());
        existing.setPortfolioUrl(updatedData.getPortfolioUrl());
        existing.setIsOpenToWork(updatedData.getIsOpenToWork());

        // Recompute score after update
        existing.computeProfileScore();

        return jobSeekerRepository.save(existing);
    }

    // Get all JobSeekers open to work
    public List<JobSeeker> getJobSeekersOpenToWork() {
        return jobSeekerRepository.findByIsOpenToWork(true);
    }

    // Deactivate a JobSeeker account
    public void deactivateJobSeeker(Long id) {
        JobSeeker jobSeeker = jobSeekerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("JobSeeker not found with id: " + id));
        jobSeeker.setIsActive(false);
        jobSeekerRepository.save(jobSeeker);
    }

    // Delete a JobSeeker permanently
    public void deleteJobSeeker(Long id) {
        if (!jobSeekerRepository.existsById(id)) {
            throw new RuntimeException("JobSeeker not found with id: " + id);
        }
        jobSeekerRepository.deleteById(id);
    }
}
