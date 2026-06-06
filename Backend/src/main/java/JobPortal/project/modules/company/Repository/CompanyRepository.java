package JobPortal.project.modules.company.repository;

import JobPortal.project.modules.company.model.Company;
import JobPortal.project.modules.company.enums.CompanySize;
import JobPortal.project.modules.userprofile.model.Employer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    // Find a company by its name
    Optional<Company> findByName(String name);

    // Find all companies belonging to a specific Employer
    List<Company> findByEmployer(Employer employer);

    // Find all companies in a specific city
    List<Company> findByCity(String city);

    // Find all companies by sector
    List<Company> findBySector(String sector);

    // Find all companies by size
    List<Company> findByCompanySize(CompanySize companySize);

    // Find all active companies
    List<Company> findByIsActive(Boolean isActive);

    // Find all companies with an average rating above a given value
    List<Company> findByAverageRatingGreaterThanEqual(Double minRating);

    // Check if a company with this name already exists
    Boolean existsByName(String name);
}



