package JobPortal.project.modules.company.Service;

import JobPortal.project.modules.company.Model.Company;
import JobPortal.project.modules.company.Model.CompanyRating;
import JobPortal.project.modules.company.Repository.CompanyRepository;
import JobPortal.project.modules.userprofile.Model.Employer;
import JobPortal.project.modules.userprofile.Repository.EmployerRepository;
import JobPortal.project.modules.userprofile.Model.JobSeeker;
import JobPortal.project.modules.userprofile.Repository.JobSeekerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import JobPortal.project.modules.company.Model.CompanyLike;
import JobPortal.project.modules.company.dto.CompanyStatsResponse;
import JobPortal.project.modules.application.repository.ApplicationRepository;
import org.springframework.transaction.annotation.Transactional;

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

    @Autowired
    private ApplicationRepository applicationRepository;

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

    @Transactional
    public Company toggleLike(Long companyId, Long jobSeekerId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));

        JobSeeker jobSeeker = jobSeekerRepository.findById(jobSeekerId)
                .orElseThrow(() -> new RuntimeException("JobSeeker not found with id: " + jobSeekerId));

        Optional<CompanyLike> existingLike = company.getLikes().stream()
                .filter(l -> l.getJobSeeker().getId().equals(jobSeekerId))
                .findFirst();

        if (existingLike.isPresent()) {
            company.getLikes().remove(existingLike.get());
        } else {
            CompanyLike newLike = CompanyLike.builder()
                    .company(company)
                    .jobSeeker(jobSeeker)
                    .build();
            company.getLikes().add(newLike);
        }

        company.setLikesCount(company.getLikes().size());
        return companyRepository.save(company);
    }

    @Transactional(readOnly = true)
    public CompanyStatsResponse getCompanyStats(Long companyId, Long seekerId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));

        long totalApplications = applicationRepository.countByCompanyId(companyId);
        long totalHired = applicationRepository.countByCompanyIdAndStatus(companyId, "HIRED");

        double recruitmentRate = 0.0;
        if (totalApplications > 0) {
            recruitmentRate = ((double) totalHired / totalApplications) * 100.0;
        }

        boolean hasLiked = false;
        if (seekerId != null) {
            hasLiked = company.getLikes().stream()
                    .anyMatch(l -> l.getJobSeeker().getId().equals(seekerId));
        }

        String recommendationMessage;
        if (recruitmentRate >= 70.0) {
            recommendationMessage = String.format("This company recruits %.0f%% of its applicants. You have a very high chance of getting hired if you apply here!", recruitmentRate);
        } else if (recruitmentRate >= 45.0) {
            recommendationMessage = String.format("This company recruits %.0f%% of its applicants. You have a solid chance if you apply here.", recruitmentRate);
        } else if (totalApplications == 0) {
            recommendationMessage = "Be among the first applicants for this company's postings!";
        } else {
            recommendationMessage = String.format("This company recruits %.0f%% of its applicants. Competition is high, so make your application stand out!", recruitmentRate);
        }

        return new CompanyStatsResponse(
                companyId,
                recruitmentRate,
                totalApplications,
                totalHired,
                hasLiked,
                company.getLikesCount() == null ? 0 : company.getLikesCount(),
                company.getAverageRating() == null ? 0.0 : company.getAverageRating(),
                company.getRatingCount() == null ? 0 : company.getRatingCount(),
                recommendationMessage
        );
    }
}



