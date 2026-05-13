package JobPortal.project.modules.jobposting.repository;

import JobPortal.project.modules.jobposting.model.JobPosting;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {

    List<JobPosting> findByEmployerId(Long employerId);

    @Query("SELECT j FROM JobPosting j WHERE " +
           "(:search IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(j.companyName) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:type IS NULL OR j.type = :type)")
    Page<JobPosting> searchJobs(@Param("search") String search, 
                               @Param("location") String location, 
                               @Param("type") String type, 
                               Pageable pageable);
}
