package JobPortal.project.job.Repository;

import JobPortal.project.job.Enum.JobStatus;
import JobPortal.project.job.Model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findAllByStatus(JobStatus status);
    List<Job> findAllByCompanyId(Long companyId);
    List<Job> findAllByCategoryId(Long categoryId);
}
