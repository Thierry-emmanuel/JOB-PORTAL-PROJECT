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

import java.util.List;


@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class JobListingDataSeeder implements ApplicationRunner {

    private final JobCategoryRepository  categoryRepository;
    private final ListingSkillRepository skillRepository;
    private final JobLocationRepository  locationRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedCategories();
        seedSkills();
        seedLocations();
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
}
