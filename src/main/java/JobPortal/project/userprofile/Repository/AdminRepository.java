package JobPortal.project.userprofile.Repository;


import JobPortal.project.userprofile.Model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {

    // Find an Admin by their email
    Optional<Admin> findByEmail(String email);

    // Check if an Admin exists with a given email
    Boolean existsByEmail(String email);

    // Find all Admins by their level (STANDARD or SUPER_ADMIN)
    List<Admin> findByAdminLevel(String adminLevel);

    // Find all active Admins
    List<Admin> findByIsActive(Boolean isActive);

    // Find the most active admin (highest actionsPerformed)
    Optional<Admin> findTopByOrderByActionsPerformedDesc();
}
