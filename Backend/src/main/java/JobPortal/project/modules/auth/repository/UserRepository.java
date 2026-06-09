package JobPortal.project.modules.auth.repository;

import JobPortal.project.modules.auth.model.User;
import JobPortal.project.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
    Page<User> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<User> findAllByRole(Role role);

    @Query("""
            SELECT u FROM User u
            WHERE (:role IS NULL OR u.role = :role)
              AND (:active IS NULL OR u.isActive = :active)
              AND (
                    :search IS NULL OR :search = ''
                    OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
                  )
            ORDER BY u.createdAt DESC
            """)
    Page<User> findFiltered(
            @Param("role") Role role,
            @Param("active") Boolean active,
            @Param("search") String search,
            Pageable pageable);
}

