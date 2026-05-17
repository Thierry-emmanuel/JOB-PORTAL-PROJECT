package JobPortal.project.JobListing.config;

import JobPortal.project.JobListing.entity.JobCategory;
import JobPortal.project.JobListing.entity.JobLocation;
import JobPortal.project.JobListing.entity.ListingSkill;
import JobPortal.project.JobListing.repository.JobCategoryRepository;
import JobPortal.project.JobListing.repository.JobLocationRepository;
import JobPortal.project.JobListing.repository.ListingSkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import JobPortal.project.JobListing.entity.JobListing;
import JobPortal.project.JobListing.enums.ExperienceLevel;
import JobPortal.project.JobListing.enums.JobType;
import JobPortal.project.JobListing.enums.PostingStatus;
import JobPortal.project.JobListing.repository.JobListingRepository;
import JobPortal.project.modules.company.Model.Company;
import JobPortal.project.modules.company.Repository.CompanyRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;


@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class JobListingDataSeeder implements ApplicationRunner {

    private final JobCategoryRepository  categoryRepository;
    private final ListingSkillRepository skillRepository;
    private final JobLocationRepository  locationRepository;
    private final JobListingRepository   jobListingRepository;
    private final CompanyRepository      companyRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedCategories();
        seedSkills();
        seedLocations();
        seedJobs();
        log.info("[JobListingDataSeeder] Reference data seeding complete.");
    }



    private void seedCategories() {
        if (categoryRepository.count() > 0) {
            log.info("[JobListingDataSeeder] Categories already seeded — skipping.");
            return;
        }
        List<JobCategory> categories = List.of(
            cat("Information Technology", "information-technology", "💻",
                "Software development, networking, cybersecurity, IT support"),
            cat("Finance & Accounting",   "finance-accounting",     "💰",
                "Accounting, auditing, financial analysis, banking"),
            cat("Healthcare",             "healthcare",             "🏥",
                "Medicine, nursing, pharmacy, public health"),
            cat("Education",              "education",              "🎓",
                "Teaching, training, academic research, e-learning"),
            cat("Engineering",            "engineering",            "⚙️",
                "Civil, mechanical, electrical, software engineering"),
            cat("Marketing & Sales",      "marketing-sales",        "📢",
                "Digital marketing, sales management, brand strategy"),
            cat("Human Resources",        "human-resources",        "👥",
                "Recruitment, HR management, payroll, training"),
            cat("Legal",                  "legal",                  "⚖️",
                "Corporate law, compliance, contracts, legal advisory"),
            cat("Logistics & Transport",  "logistics-transport",    "🚚",
                "Supply chain, procurement, fleet management"),
            cat("Agriculture",            "agriculture",            "🌾",
                "Agribusiness, agronomy, livestock, food production")
        );
        categoryRepository.saveAll(categories);
        log.info("[JobListingDataSeeder] Seeded {} job categories.", categories.size());
    }

    private JobCategory cat(String name, String slug, String icon, String desc) {
        return JobCategory.builder()
            .name(name).slug(slug).iconUrl(icon).description(desc).build();
    }


    private void seedSkills() {
        if (skillRepository.count() > 0) {
            log.info("[JobListingDataSeeder] Skills already seeded — skipping.");
            return;
        }
        List<String> names = List.of(
            "Java", "Python", "JavaScript", "TypeScript", "SQL",
            "Spring Boot", "React", "Angular", "Docker", "Kubernetes",
            "AWS", "Git", "Linux", "REST API", "Microservices",
            "Machine Learning", "Data Analysis", "Project Management",
            "Communication", "Leadership"
        );
        List<ListingSkill> skills = names.stream()
            .map(n -> ListingSkill.builder().name(n).build())
            .toList();
        skillRepository.saveAll(skills);
        log.info("[JobListingDataSeeder] Seeded {} skills.", skills.size());
    }



    private void seedLocations() {
        if (locationRepository.count() > 0) {
            log.info("[JobListingDataSeeder] Locations already seeded — skipping.");
            return;
        }
        List<JobLocation> locations = List.of(
            loc("Yaoundé",   "Centre",     "Cameroon",  3.8480,  11.5021),
            loc("Douala",    "Littoral",   "Cameroon",  4.0511,   9.7679),
            loc("Bafoussam", "West",       "Cameroon",  5.4737,  10.4179),
            loc("Bamenda",   "North West", "Cameroon",  5.9631,  10.1591),
            loc("Garoua",    "North",      "Cameroon",  9.3017,  13.3978),
            loc("Maroua",    "Far North",  "Cameroon", 10.5910,  14.3195),
            loc("Bertoua",   "East",       "Cameroon",  4.5789,  13.6841),
            loc("Remote",    null,         "Remote",    0.0000,   0.0000)
        );
        locationRepository.saveAll(locations);
        log.info("[JobListingDataSeeder] Seeded {} locations.", locations.size());
    }

    private JobLocation loc(String city, String state, String country,
                            double lat, double lon) {
        return JobLocation.builder()
            .city(city).state(state).country(country)
            .latitude(lat).longitude(lon).build();
    }

    private void seedJobs() {
        if (jobListingRepository.count() > 0) {
            log.info("[JobListingDataSeeder] Jobs already seeded — skipping.");
            return;
        }

        List<Company> companies = companyRepository.findAll();
        if (companies.isEmpty()) {
            log.info("[JobListingDataSeeder] No companies found to associate jobs with — skipping jobs.");
            return;
        }

        List<JobCategory> categories = categoryRepository.findAll();
        List<JobLocation> locations = locationRepository.findAll();
        List<ListingSkill> skills = skillRepository.findAll();

        if (categories.isEmpty() || locations.isEmpty() || skills.isEmpty()) {
            return;
        }

        for (Company company : companies) {
            // Seed 2 jobs per company
            JobCategory cat = categories.get((int)(Math.random() * categories.size()));
            JobLocation loc = locations.get((int)(Math.random() * locations.size()));
            
            JobListing job1 = JobListing.builder()
                .employerId(company.getEmployer().getId())
                .companyId(company.getId())
                .category(cat)
                .location(loc)
                .title("Software Engineer - " + company.getName())
                .description("We are looking for a skilled Software Engineer to join our team at " + company.getName() + ". You will be responsible for developing high-quality applications.")
                .jobType(JobType.CDI)
                .salaryMin(new BigDecimal("300000"))
                .salaryMax(new BigDecimal("600000"))
                .experienceLevel(ExperienceLevel.MID)
                .deadline(LocalDate.now().plusDays(30))
                .status(PostingStatus.ACTIVE)
                .viewCount(0)
                .skills(new HashSet<>(skills.subList(0, 3)))
                .build();
                
            JobCategory cat2 = categories.get((int)(Math.random() * categories.size()));
            JobLocation loc2 = locations.get((int)(Math.random() * locations.size()));
            
            JobListing job2 = JobListing.builder()
                .employerId(company.getEmployer().getId())
                .companyId(company.getId())
                .category(cat2)
                .location(loc2)
                .title("Product Manager - " + company.getName())
                .description("Looking for an experienced Product Manager to lead product development at " + company.getName() + ". Must have excellent communication skills.")
                .jobType(JobType.CDD)
                .salaryMin(new BigDecimal("500000"))
                .salaryMax(new BigDecimal("800000"))
                .experienceLevel(ExperienceLevel.SENIOR)
                .deadline(LocalDate.now().plusDays(15))
                .status(PostingStatus.ACTIVE)
                .viewCount(0)
                .skills(new HashSet<>(skills.subList(3, 5)))
                .build();

            jobListingRepository.save(job1);
            jobListingRepository.save(job2);
        }
        log.info("[JobListingDataSeeder] Seeded {} jobs.", companies.size() * 2);
    }
}
