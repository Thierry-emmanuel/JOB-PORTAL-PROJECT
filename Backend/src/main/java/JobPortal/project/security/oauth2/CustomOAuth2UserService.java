package JobPortal.project.security.oauth2;

import JobPortal.project.enums.Role;
import JobPortal.project.modules.auth.Model.User;
import JobPortal.project.modules.auth.Model.RoleEntity;
import JobPortal.project.modules.auth.repository.UserRepository;
import JobPortal.project.modules.auth.repository.RoleRepository;
import JobPortal.project.modules.userprofile.Model.JobSeeker;
import JobPortal.project.modules.userprofile.Model.Employer;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        
        return processOAuth2User(registrationId, oAuth2User);
    }

    private OAuth2User processOAuth2User(String registrationId, OAuth2User oAuth2User) {
        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String providerId = (String) attributes.get("sub"); // Google uses 'sub', Facebook uses 'id'
        if (registrationId.equals("facebook")) {
            providerId = (String) attributes.get("id");
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;

        if (userOptional.isPresent()) {
            user = userOptional.get();
            // Update provider info if needed
            user.setProvider(User.Provider.valueOf(registrationId.toUpperCase()));
            user.setProviderId(providerId);
        } else {
            String selectedRole = null;
            org.springframework.web.context.request.RequestAttributes attributesRef = 
                    org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributesRef instanceof org.springframework.web.context.request.ServletRequestAttributes) {
                jakarta.servlet.http.HttpServletRequest req = 
                        ((org.springframework.web.context.request.ServletRequestAttributes) attributesRef).getRequest();
                jakarta.servlet.http.HttpSession sess = req.getSession(false);
                if (sess != null) {
                    selectedRole = (String) sess.getAttribute("oauth2_role");
                }
            }

            if (selectedRole != null && selectedRole.equalsIgnoreCase("EMPLOYER")) {
                Employer employer = new Employer();
                employer.setEmail(email);
                employer.setFullName(name);
                employer.setProvider(User.Provider.valueOf(registrationId.toUpperCase()));
                employer.setProviderId(providerId);
                employer.setRole(Role.EMPLOYER);
                employer.setIsActive(true);
                employer.setIsApproved(false);

                RoleEntity roleEntity = roleRepository.findByName("ROLE_EMPLOYER")
                        .orElseThrow(() -> new RuntimeException("Default Role ROLE_EMPLOYER not found"));

                Set<RoleEntity> roles = new HashSet<>();
                roles.add(roleEntity);
                employer.setRoles(roles);
                user = employer;
            } else {
                user = new JobSeeker();
                user.setEmail(email);
                user.setFullName(name);
                user.setProvider(User.Provider.valueOf(registrationId.toUpperCase()));
                user.setProviderId(providerId);
                user.setRole(Role.JOB_SEEKER);
                user.setIsActive(true);

                RoleEntity roleEntity = roleRepository.findByName("ROLE_JOB_SEEKER")
                        .orElseThrow(() -> new RuntimeException("Default Role ROLE_JOB_SEEKER not found"));

                Set<RoleEntity> roles = new HashSet<>();
                roles.add(roleEntity);
                user.setRoles(roles);
            }
        }

        userRepository.save(user);
        return oAuth2User;
    }
}



