package JobPortal.project.modules.cms.repository;

import JobPortal.project.modules.cms.model.HeroConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HeroConfigRepository extends JpaRepository<HeroConfig, Long> {
    /** Returns the live (active) configuration, if any. */
    Optional<HeroConfig> findFirstByIsActiveTrue();
}