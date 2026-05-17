package JobPortal.project.security.service;

import JobPortal.project.modules.auth.Model.User;
import JobPortal.project.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with email: " + email));

        // Build authorities from the roles join table.
        // Falls back to the role enum column on the users table so that
        // users seeded directly via SQL (without user_role_entities rows) can still log in.
        java.util.List<org.springframework.security.core.GrantedAuthority> authorities;

        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            authorities = user.getRoles().stream()
                    .map(role -> new SimpleGrantedAuthority(role.getName()))
                    .collect(Collectors.toList());
        } else if (user.getRole() != null) {
            // Fallback: derive authority name from the Role enum (e.g. JOB_SEEKER → ROLE_JOB_SEEKER)
            String fallbackRole = "ROLE_" + user.getRole().name();
            authorities = java.util.List.of(new SimpleGrantedAuthority(fallbackRole));
        } else {
            authorities = java.util.List.of();
        }

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(authorities)
                .disabled(!user.getIsActive())
                .build();
    }
}



