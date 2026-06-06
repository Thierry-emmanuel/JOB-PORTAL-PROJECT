package JobPortal.project.modules.auth.repository;

import JobPortal.project.modules.auth.model.User;
import JobPortal.project.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    
    long countByRole(Role role);
    long countByIsActive(Boolean isActive);
    List<User> findAllByOrderByCreatedAtDesc();
    List<User> findAllByRole(Role role);
}

