package JobPortal.project.admin.Service;

import JobPortal.project.admin.DTO.DashboardStatsDTO;
import JobPortal.project.admin.DTO.UserManagementDTO;
import JobPortal.project.admin.DTO.UserCreationDTO;
import JobPortal.project.admin.DTO.UserUpdateDTO;
import JobPortal.project.enums.Role;
import JobPortal.project.modules.auth.Model.User;
import JobPortal.project.modules.auth.Model.RoleEntity;
import JobPortal.project.modules.auth.repository.UserRepository;
import JobPortal.project.modules.auth.repository.RoleRepository;
import JobPortal.project.JobListing.repository.JobListingRepository;
import JobPortal.project.modules.application.repository.ApplicationRepository;
import JobPortal.project.modules.userprofile.Model.JobSeeker;
import JobPortal.project.modules.userprofile.Model.Employer;
import JobPortal.project.modules.userprofile.Model.Admin;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service("adminDashboardService")
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final JobListingRepository jobListingRepository;
    private final ApplicationRepository applicationRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;

    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalJobSeekers = userRepository.countByRole(Role.JOB_SEEKER);
        long totalEmployers = userRepository.countByRole(Role.EMPLOYER);
        long totalAdmins = userRepository.countByRole(Role.ADMIN);
        long activeUsers = userRepository.countByIsActive(true);

        // Fetch real-time job posting metrics
        long activeJobs = jobListingRepository.countByStatus(JobPortal.project.JobListing.enums.PostingStatus.ACTIVE);
        long expiredJobs = jobListingRepository.countByStatus(JobPortal.project.JobListing.enums.PostingStatus.EXPIRED);
        long deletedJobs = jobListingRepository.countByStatus(JobPortal.project.JobListing.enums.PostingStatus.DELETED);

        // Fetch real-time application metrics
        long totalApplications = applicationRepository.count();
        long hiredApplications = applicationRepository.countByStatus(JobPortal.project.modules.application.enums.ApplicationStatus.HIRED);
        int hireRate = totalApplications > 0 ? (int) Math.round((double) hiredApplications / totalApplications * 100) : 0;

        // Fetch application status breakdown
        java.util.Map<String, Long> statusBreakdown = new java.util.HashMap<>();
        for (JobPortal.project.modules.application.enums.ApplicationStatus status : JobPortal.project.modules.application.enums.ApplicationStatus.values()) {
            statusBreakdown.put(status.name(), applicationRepository.countByStatus(status));
        }

        // Fetch applications by category dynamically
        java.util.List<JobPortal.project.JobListing.entity.JobListing> allListings = jobListingRepository.findAll();
        java.util.Map<Long, String> listingIdToCategoryName = new java.util.HashMap<>();
        for (JobPortal.project.JobListing.entity.JobListing jl : allListings) {
            if (jl.getId() != null && jl.getCategory() != null) {
                try {
                    long idLong = Long.parseLong(jl.getId().toString().split("-")[0], 16);
                    listingIdToCategoryName.put(idLong, jl.getCategory().getName());
                } catch (Exception e) {
                    // fallback if UUID segment can't be parsed
                }
            }
        }

        java.util.Map<String, Long> appsByCategory = new java.util.HashMap<>();
        java.util.List<JobPortal.project.modules.application.model.Application> allApps = applicationRepository.findAll();
        for (JobPortal.project.modules.application.model.Application app : allApps) {
            String categoryName = listingIdToCategoryName.get(app.getJobPostingId());
            if (categoryName == null) {
                categoryName = "Other";
            }
            appsByCategory.put(categoryName, appsByCategory.getOrDefault(categoryName, 0L) + 1);
        }

        // Cumulative user growth over last 6 months
        java.util.List<String> labels = new java.util.ArrayList<>();
        java.util.List<Long> seekersGrowth = new java.util.ArrayList<>();
        java.util.List<Long> employersGrowth = new java.util.ArrayList<>();

        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("MMM", java.util.Locale.FRENCH);
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime sixMonthsAgo = now.minusMonths(6).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);

        java.util.List<JobPortal.project.modules.auth.Model.User> allUsers = userRepository.findAll();

        long seekersCount = 0;
        long employersCount = 0;

        for (JobPortal.project.modules.auth.Model.User u : allUsers) {
            if (u.getCreatedAt() != null && u.getCreatedAt().isBefore(sixMonthsAgo)) {
                if (u.getRole() == Role.JOB_SEEKER) {
                    seekersCount++;
                } else if (u.getRole() == Role.EMPLOYER) {
                    employersCount++;
                }
            }
        }

        for (int i = 5; i >= 0; i--) {
            java.time.LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            java.time.LocalDateTime monthEnd = monthStart.plusMonths(1);

            labels.add(monthStart.format(formatter));

            for (JobPortal.project.modules.auth.Model.User u : allUsers) {
                if (u.getCreatedAt() != null && !u.getCreatedAt().isBefore(monthStart) && u.getCreatedAt().isBefore(monthEnd)) {
                    if (u.getRole() == Role.JOB_SEEKER) {
                        seekersCount++;
                    } else if (u.getRole() == Role.EMPLOYER) {
                        employersCount++;
                    }
                }
            }
            seekersGrowth.add(seekersCount);
            employersGrowth.add(employersCount);
        }

        DashboardStatsDTO.UserGrowthDTO usersOverTime = new DashboardStatsDTO.UserGrowthDTO(labels, seekersGrowth, employersGrowth);

        return new DashboardStatsDTO(
                totalUsers,
                totalJobSeekers,
                totalEmployers,
                totalAdmins,
                activeUsers,
                activeJobs,
                expiredJobs,
                deletedJobs,
                totalApplications,
                hireRate,
                appsByCategory,
                statusBreakdown,
                usersOverTime
        );
    }

    @Transactional(readOnly = true)
    public List<UserManagementDTO> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserManagementDTO toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.setIsActive(!user.getIsActive());
        userRepository.save(user);

        return mapToDTO(user);
    }

    private UserManagementDTO mapToDTO(User user) {
        return new UserManagementDTO(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getIsActive(),
                user.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    @Transactional
    public User createUser(UserCreationDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user;
        switch (dto.getRole()) {
            case JOB_SEEKER:
                JobSeeker seeker = new JobSeeker();
                seeker.setPhone(dto.getPhone());
                seeker.setCity(dto.getCity());
                seeker.setRegion(dto.getRegion());
                seeker.setProfileSummary(dto.getProfileSummary());
                seeker.setLinkedInUrl(dto.getLinkedInUrl());
                seeker.setPortfolioUrl(dto.getPortfolioUrl());
                seeker.setIsOpenToWork(dto.getIsOpenToWork() != null ? dto.getIsOpenToWork() : true);
                seeker.computeProfileScore();
                user = seeker;
                break;
            case EMPLOYER:
                Employer emp = new Employer();
                emp.setPhone(dto.getPhone());
                emp.setCity(dto.getCity());
                emp.setRegion(dto.getRegion());
                emp.setJobTitle(dto.getJobTitle());
                emp.setBio(dto.getBio());
                emp.setIsApproved(dto.getIsApproved() != null ? dto.getIsApproved() : false);
                emp.computeProfileScore();
                user = emp;
                break;
            case ADMIN:
                Admin adm = new Admin();
                adm.setPhone(dto.getPhone());
                adm.setDepartment(dto.getDepartment());
                adm.setAdminLevel(dto.getAdminLevel() != null ? dto.getAdminLevel() : "STANDARD");
                user = adm;
                break;
            default:
                throw new RuntimeException("Error: Invalid role!");
        }

        user.setFullName(dto.getFullName());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRole(dto.getRole());
        user.setIsActive(true);

        String roleName = "ROLE_" + dto.getRole().name();
        RoleEntity roleEntity = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Error: Role " + roleName + " not found."));
        
        Set<RoleEntity> roles = new HashSet<>();
        roles.add(roleEntity);
        user.setRoles(roles);

        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long id, UserUpdateDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        user.setFullName(dto.getFullName());
        user.setEmail(dto.getEmail());
        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        if (dto.getIsActive() != null) {
            user.setIsActive(dto.getIsActive());
        }

        if (user instanceof JobSeeker) {
            JobSeeker seeker = (JobSeeker) user;
            seeker.setPhone(dto.getPhone());
            seeker.setCity(dto.getCity());
            seeker.setRegion(dto.getRegion());
            seeker.setProfileSummary(dto.getProfileSummary());
            seeker.setLinkedInUrl(dto.getLinkedInUrl());
            seeker.setPortfolioUrl(dto.getPortfolioUrl());
            if (dto.getIsOpenToWork() != null) {
                seeker.setIsOpenToWork(dto.getIsOpenToWork());
            }
            seeker.computeProfileScore();
        } else if (user instanceof Employer) {
            Employer emp = (Employer) user;
            emp.setPhone(dto.getPhone());
            emp.setCity(dto.getCity());
            emp.setRegion(dto.getRegion());
            emp.setJobTitle(dto.getJobTitle());
            emp.setBio(dto.getBio());
            if (dto.getIsApproved() != null) {
                emp.setIsApproved(dto.getIsApproved());
            }
            emp.computeProfileScore();
        } else if (user instanceof Admin) {
            Admin adm = (Admin) user;
            adm.setPhone(dto.getPhone());
            adm.setDepartment(dto.getDepartment());
            if (dto.getAdminLevel() != null) {
                adm.setAdminLevel(dto.getAdminLevel());
            }
        }

        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        userRepository.delete(user);
    }
}

