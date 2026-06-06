package JobPortal.project.modules.joblisting.repository;

import JobPortal.project.modules.joblisting.entity.ListingSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Set;
import java.util.UUID;

/** Repository for listing skill reference table. */
@Repository
public interface ListingSkillRepository extends JpaRepository<ListingSkill, UUID> {
    Set<ListingSkill> findByIdIn(Set<UUID> ids);
}
