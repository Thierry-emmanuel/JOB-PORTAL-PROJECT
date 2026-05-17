package JobPortal.project.admin.Service;

import JobPortal.project.admin.DTO.DashboardStatsDTO;
import JobPortal.project.admin.DTO.UserManagementDTO;
import JobPortal.project.auth.Enum.Role;
import JobPortal.project.auth.Model.User;
import JobPortal.project.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalJobSeekers = userRepository.countByRole(Role.JOB_SEEKER);
        long totalEmployers = userRepository.countByRole(Role.EMPLOYER);
        long totalAdmins = userRepository.countByRole(Role.ADMIN);
        long activeUsers = userRepository.countByIsActive(true);

        return new DashboardStatsDTO(
                totalUsers,
                totalJobSeekers,
                totalEmployers,
                totalAdmins,
                activeUsers
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
}
