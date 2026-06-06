package JobPortal.project.modules.userprofile.repository;

import JobPortal.project.modules.userprofile.model.JobSeeker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface JobSeekerRepository extends JpaRepository<JobSeeker, Long> {

    // Find a JobSeeker by their email
    Optional<JobSeeker> findByEmail(String email);

    // Check if a JobSeeker exists with a given email
    Boolean existsByEmail(String email);

    // Find all JobSeekers who are open to work
    List<JobSeeker> findByIsOpenToWork(Boolean isOpenToWork);

    // Find all JobSeekers in a specific city
    List<JobSeeker> findByCity(String city);

    // Find all active JobSeekers
    List<JobSeeker> findByIsActive(Boolean isActive);
}



