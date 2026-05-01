package JobPortal.project.auth.service;

import JobPortal.project.auth.Enum.Role;
import JobPortal.project.auth.Model.User;
import JobPortal.project.auth.Model.RoleEntity;
import JobPortal.project.auth.dto.LoginRequest;
import JobPortal.project.auth.dto.RegisterRequest;
import JobPortal.project.auth.repository.UserRepository;
import JobPortal.project.auth.repository.RoleRepository;
import JobPortal.project.userprofile.Model.Employer;
import JobPortal.project.userprofile.Model.JobSeeker;
import JobPortal.project.userprofile.Model.Admin;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user;
        Role roleEnum = Role.valueOf(request.getRole().toUpperCase());

        // Instantiate correct subclass
        switch (roleEnum) {
            case JOB_SEEKER:
                user = new JobSeeker();
                break;
            case EMPLOYER:
                user = new Employer();
                break;
            case ADMIN:
                user = new Admin();
                break;
            default:
                throw new RuntimeException("Error: Invalid Role!");
        }

        user.setFullName(request.getFirstName() + " " + request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(roleEnum);
        user.setIsActive(true);

        // Assign RoleEntity for RBAC
        String roleName = "ROLE_" + roleEnum.name();
        RoleEntity roleEntity = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Error: Role " + roleName + " not found in database."));
        
        Set<RoleEntity> roles = new HashSet<>();
        roles.add(roleEntity);
        user.setRoles(roles);

        return userRepository.save(user);
    }
}
