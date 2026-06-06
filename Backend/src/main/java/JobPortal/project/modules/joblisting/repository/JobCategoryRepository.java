package JobPortal.project.modules.joblisting.repository;

import JobPortal.project.modules.joblisting.entity.JobCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/** Repository for the job category reference table. */
@Repository
public interface JobCategoryRepository extends JpaRepository<JobCategory, UUID> {
    boolean existsBySlug(String slug);
}
