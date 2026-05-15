package JobPortal.project.auth.repository;

import JobPortal.project.auth.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    
    long countByRole(JobPortal.project.auth.Enum.Role role);
    long countByIsActive(Boolean isActive);
    List<User> findAllByOrderByCreatedAtDesc();
}
