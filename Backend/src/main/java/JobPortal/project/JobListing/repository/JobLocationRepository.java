package JobPortal.project.JobListing.repository;

import JobPortal.project.JobListing.entity.JobLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for the job location reference table.
 * Locations are pre-seeded and referenced by UUID FK on {@link JobPortal.project.JobListing.entity.JobListing}.
 */
@Repository
public interface JobLocationRepository extends JpaRepository<JobLocation, UUID> {

    Optional<JobLocation> findByCityIgnoreCaseAndCountryIgnoreCase(String city, String country);
}
