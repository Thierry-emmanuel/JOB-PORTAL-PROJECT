package JobPortal.project.config;

import JobPortal.project.modules.auth.Model.Permission;
import JobPortal.project.modules.auth.Model.RoleEntity;
import JobPortal.project.modules.auth.repository.RoleRepository;
import JobPortal.project.modules.auth.repository.PermissionRepository;
import JobPortal.project.modules.auth.repository.UserRepository;
import JobPortal.project.modules.userprofile.Model.Employer;
import JobPortal.project.modules.userprofile.Model.JobSeeker;
import JobPortal.project.modules.userprofile.Model.Admin;
import JobPortal.project.enums.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository        roleRepository;
    private final PermissionRepository  permissionRepository;
    private final UserRepository        userRepository;
    private final PasswordEncoder       passwordEncoder;

    private static final String TEST_PASSWORD = "kora@2026#";

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // 1. Create Permissions
        Permission createJob   = createPermissionIfNotFound("CREATE_JOB");
        Permission updateJob   = createPermissionIfNotFound("UPDATE_JOB");
        Permission applyJob    = createPermissionIfNotFound("APPLY_JOB");
        Permission manageUsers = createPermissionIfNotFound("MANAGE_USERS");

        // 2. Create Roles and assign Permissions
        RoleEntity seekerRole   = createRoleIfNotFound("ROLE_JOB_SEEKER", Set.of(applyJob));
        RoleEntity employerRole = createRoleIfNotFound("ROLE_EMPLOYER",   Set.of(createJob, updateJob));
        RoleEntity adminRole    = createRoleIfNotFound("ROLE_ADMIN",      Set.of(createJob, updateJob, applyJob, manageUsers));

        // 3. Create guaranteed test users (programmatically encoded password = always correct)
        createTestUserIfNotFound("test.employer@kora.cm", "Test Employer", Role.EMPLOYER, employerRole, Employer.class);
        createTestUserIfNotFound("test.seeker@kora.cm",   "Test Seeker",   Role.JOB_SEEKER, seekerRole,   JobSeeker.class);
        createTestUserIfNotFound("test.admin@kora.cm",    "Test Admin",    Role.ADMIN,      adminRole,    Admin.class);
    }

    private Permission createPermissionIfNotFound(String name) {
        return permissionRepository.findByName(name)
                .orElseGet(() -> permissionRepository.save(new Permission(name)));
    }

    private RoleEntity createRoleIfNotFound(String name, Set<Permission> permissions) {
        return roleRepository.findByName(name).orElseGet(() -> {
            RoleEntity role = new RoleEntity(name);
            role.setPermissions(new HashSet<>(permissions));
            return roleRepository.save(role);
        });
    }

    private <T extends JobPortal.project.modules.auth.Model.User> void createTestUserIfNotFound(
            String email, String fullName, Role role, RoleEntity roleEntity, Class<T> type) {
        if (userRepository.existsByEmail(email)) {
            return; // already exists — skip
        }
        try {
            T user = type.getDeclaredConstructor().newInstance();
            user.setEmail(email);
            user.setFullName(fullName);
            user.setPassword(passwordEncoder.encode(TEST_PASSWORD));
            user.setRole(role);
            user.setIsActive(true);
            user.setRoles(new HashSet<>(Set.of(roleEntity)));
            userRepository.save(user);
            log.info("[DataInitializer] Created test user: {} / {}", email, TEST_PASSWORD);
        } catch (Exception e) {
            log.error("[DataInitializer] Could not create test user {}: {}", email, e.getMessage());
        }
    }
}



