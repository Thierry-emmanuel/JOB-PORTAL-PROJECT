package JobPortal.project.modules.userprofile.Repository;

import JobPortal.project.modules.userprofile.Model.Employer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployerRepository extends JpaRepository<Employer, Long> {

    // Find an Employer by their email
    Optional<Employer> findByEmail(String email);

    // Check if an Employer exists with a given email
    Boolean existsByEmail(String email);

    // Find all Employers who are approved by Admin
    List<Employer> findByIsApproved(Boolean isApproved);

    // Find all Employers in a specific city
    List<Employer> findByCity(String city);

    // Find all active Employers
    List<Employer> findByIsActive(Boolean isActive);

    // Find all Employers pending approval (not yet approved and still active)
    List<Employer> findByIsApprovedAndIsActive(Boolean isApproved, Boolean isActive);
}



