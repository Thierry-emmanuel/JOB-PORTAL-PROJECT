package JobPortal.project.company;

import JobPortal.project.userprofile.Employer;
import JobPortal.project.userprofile.EmployerRepository;
import JobPortal.project.userprofile.JobSeeker;
import JobPortal.project.userprofile.JobSeekerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private EmployerRepository employerRepository;

    @Autowired
    private JobSeekerRepository jobSeekerRepository;

    // Get all companies
    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    // Get a company by ID
    public Optional<Company> getCompanyById(Long id) {
        return companyRepository.findById(id);
    }

    // Get all companies belonging to a specific Employer
    public List<Company> getCompaniesByEmployer(Long employerId) {
        Employer employer = employerRepository.findById(employerId)
                .orElseThrow(() -> new RuntimeException("Employer not found with id: " + employerId));
        return companyRepository.findByEmployer(employer);
    }

    // Create a new company
    public Company createCompany(Company company, Long employerId) {
        if (companyRepository.existsByName(company.getName())) {
            throw new RuntimeException("A company with this name already exists.");
        }

        Employer employer = employerRepository.findById(employerId)
                .orElseThrow(() -> new RuntimeException("Employer not found with id: " + employerId));

        // Only approved Employers can create a company (FR07)
        if (!employer.getIsApproved()) {
            throw new RuntimeException("Your account is not yet approved by an Admin.");
        }

        company.setEmployer(employer);
        return companyRepository.save(company);
    }

    // Update an existing company
    public Company updateCompany(Long id, Company updatedData) {
        Company existing = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));

        existing.setName(updatedData.getName());
        existing.setDescription(updatedData.getDescription());
        existing.setSector(updatedData.getSector());
        existing.setWebsiteUrl(updatedData.getWebsiteUrl());
        existing.setLogoUrl(updatedData.getLogoUrl());
        existing.setCity(updatedData.getCity());
        existing.setCountry(updatedData.getCountry());
        existing.setContactEmail(updatedData.getContactEmail());
        existing.setContactPhone(updatedData.getContactPhone());
        existing.setCompanySize(updatedData.getCompanySize());

        return companyRepository.save(existing);
    }

    // Add a rating to a company
    public Company addRating(Long companyId, Long jobSeekerId, Double ratingValue, String comment) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));

        JobSeeker jobSeeker = jobSeekerRepository.findById(jobSeekerId)
                .orElseThrow(() -> new RuntimeException("JobSeeker not found with id: " + jobSeekerId));

        // Check if this JobSeeker already rated this company
        boolean alreadyRated = company.getRatings().stream()
                .anyMatch(r -> r.getJobSeeker().getId().equals(jobSeekerId));

        if (alreadyRated) {
            throw new RuntimeException("You have already rated this company.");
        }

        CompanyRating newRating = new CompanyRating();
        newRating.setCompany(company);
        newRating.setJobSeeker(jobSeeker);
        newRating.setRating(ratingValue);
        newRating.setComment(comment);

        company.getRatings().add(newRating);

        // Recompute the average after adding the new rating
        company.computeAverageRating();

        return companyRepository.save(company);
    }

    // Get all companies by sector
    public List<Company> getCompaniesBySector(String sector) {
        return companyRepository.findBySector(sector);
    }

    // Get all companies with a minimum rating
    public List<Company> getTopRatedCompanies(Double minRating) {
        return companyRepository.findByAverageRatingGreaterThanEqual(minRating);
    }

    // Deactivate a company
    public void deactivateCompany(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + id));
        company.setIsActive(false);
        companyRepository.save(company);
    }

    // Delete a company permanently
    public void deleteCompany(Long id) {
        if (!companyRepository.existsById(id)) {
            throw new RuntimeException("Company not found with id: " + id);
        }
        companyRepository.deleteById(id);
    }
}
