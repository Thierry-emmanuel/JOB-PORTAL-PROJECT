package JobPortal.project.modules.cms.repository;

import JobPortal.project.modules.cms.model.FAQ;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FAQRepository extends JpaRepository<FAQ, Long> {
    List<FAQ> findAllByIsActive(Boolean isActive);
}
