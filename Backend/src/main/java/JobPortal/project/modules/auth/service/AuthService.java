package JobPortal.project.modules.auth.service;

import JobPortal.project.enums.Role;
import JobPortal.project.modules.auth.Model.User;
import JobPortal.project.modules.auth.Model.RoleEntity;
import JobPortal.project.modules.auth.dto.LoginRequest;
import JobPortal.project.modules.auth.dto.RegisterRequest;
import JobPortal.project.modules.auth.dto.AuthResponse;
import JobPortal.project.modules.auth.repository.UserRepository;
import JobPortal.project.modules.auth.repository.RoleRepository;
import JobPortal.project.security.jwt.JwtUtils;
import JobPortal.project.modules.userprofile.Model.Employer;
import JobPortal.project.modules.userprofile.Model.JobSeeker;
import JobPortal.project.modules.userprofile.Model.Admin;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import org.springframework.context.ApplicationEventPublisher;
import JobPortal.project.modules.notification.Event.NotificationEvent;
import JobPortal.project.enums.NotificationType;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public User registerUser(RegisterRequest request) {
        log.info("Attempting to register user with email: {}", request.getEmail());
        
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed: Email {} already exists", request.getEmail());
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user;
        Role roleEnum = Role.valueOf(request.getRole().toUpperCase());

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

        String roleName = "ROLE_" + roleEnum.name();
        RoleEntity roleEntity = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Error: Role " + roleName + " not found."));
        
        Set<RoleEntity> roles = new HashSet<>();
        roles.add(roleEntity);
        user.setRoles(roles);

        User saved = userRepository.save(user);

        eventPublisher.publishEvent(new NotificationEvent(
                this,
                saved,
                "Welcome to Kora Job Portal",
                "Hello " + saved.getFullName() + ",\n\nWelcome to Kora Job Portal! Your account has been successfully created as a " + request.getRole() + ".\n\nPlease verify your email address by clicking the link below:\nhttps://job-portal-project-bay.vercel.app/verify?email=" + saved.getEmail() + "\n\n(Note: Your account is already pre-verified and active for your convenience!)",
                NotificationType.WELCOME
        ));

        return saved;
    }

    public AuthResponse authenticateUser(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String role = userDetails.getAuthorities().iterator().next().getAuthority();

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

        eventPublisher.publishEvent(new NotificationEvent(
                this,
                user,
                "Security Alert: New Login",
                "Hello " + user.getFullName() + ",\n\nYou have successfully logged into your account. If this wasn't you, please secure your account immediately.",
                NotificationType.SYSTEM
        ));

        return new AuthResponse(jwt, userDetails.getUsername(), role, user.getId(), user.getFullName());
    }

    public AuthResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

        String role = "ROLE_" + user.getRole().name();
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            role = user.getRoles().iterator().next().getName();
        }

        return new AuthResponse(null, user.getEmail(), role, user.getId(), user.getFullName());
    }
}



