package JobPortal.project.config;

import JobPortal.project.auth.Model.Permission;
import JobPortal.project.auth.Model.RoleEntity;
import JobPortal.project.auth.repository.RoleRepository;
import JobPortal.project.auth.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Override
    public void run(String... args) throws Exception {
        // 1. Create Permissions
        Permission createJob = createPermissionIfNotFound("CREATE_JOB");
        Permission updateJob = createPermissionIfNotFound("UPDATE_JOB");
        Permission applyJob = createPermissionIfNotFound("APPLY_JOB");
        Permission manageUsers = createPermissionIfNotFound("MANAGE_USERS");

        // 2. Create Roles and assign Permissions
        createRoleIfNotFound("ROLE_JOB_SEEKER", Set.of(applyJob));
        createRoleIfNotFound("ROLE_EMPLOYER", Set.of(createJob, updateJob));
        createRoleIfNotFound("ROLE_ADMIN", Set.of(createJob, updateJob, applyJob, manageUsers));
    }

    private Permission createPermissionIfNotFound(String name) {
        return permissionRepository.findByName(name)
                .orElseGet(() -> permissionRepository.save(new Permission(name)));
    }

    private void createRoleIfNotFound(String name, Set<Permission> permissions) {
        if (roleRepository.findByName(name).isEmpty()) {
            RoleEntity role = new RoleEntity(name);
            role.setPermissions(new HashSet<>(permissions));
            roleRepository.save(role);
        }
    }
}
