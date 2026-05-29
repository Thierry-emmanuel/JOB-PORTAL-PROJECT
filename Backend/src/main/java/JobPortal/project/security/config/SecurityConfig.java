package JobPortal.project.security.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@Configuration
@EnableMethodSecurity
@lombok.RequiredArgsConstructor
public class SecurityConfig {

    private final JobPortal.project.security.jwt.AuthTokenFilter authTokenFilter;
    private final JobPortal.project.security.oauth2.CustomOAuth2UserService customOAuth2UserService;
    private final JobPortal.project.security.oauth2.OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    /**
     * Returns 401 JSON instead of redirecting to /login.
     * Prevents CORS errors caused by Spring's default form-login redirect
     * when an API request lacks a valid JWT token.
     */
    @Bean
    public AuthenticationEntryPoint apiAuthenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"" + authException.getMessage() + "\"}");
        };
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
            // OAuth2 login requires a session for the state param; we keep JWT stateless for the API
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .exceptionHandling(ex -> ex.authenticationEntryPoint(apiAuthenticationEntryPoint()))

            .authorizeHttpRequests(auth ->
                auth.requestMatchers(
                        "/api/auth/**",
                        "/oauth2/**",               // initiate OAuth2 login
                        "/login/oauth2/**",         // Spring OAuth2 callback
                        "/swagger-ui/**", "/v3/api-docs/**",
                        "/api/v1/jobs/**", "/api/jobs/**",
                        "/api/ai/**", "/api/v1/insights/**",
                        "/api/v1/companies/**", "/api/v1/companies",
                        "/api/public/hero",
                        "/ws/**"
                    ).permitAll()
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")
                    .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                .successHandler(oAuth2AuthenticationSuccessHandler)
            )
            .addFilterBefore(authTokenFilter, org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public org.springframework.security.authentication.AuthenticationManager authenticationManager(org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}




