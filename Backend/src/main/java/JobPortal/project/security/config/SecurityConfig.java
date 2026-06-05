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

    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origin:http://localhost:5173}")
    private String frontendUrl;

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
        http.cors(org.springframework.security.config.Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            // OAuth2 login requires a session for the state param; we keep JWT stateless for the API
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .exceptionHandling(ex -> ex.authenticationEntryPoint(apiAuthenticationEntryPoint()))

            .authorizeHttpRequests(auth ->
                auth.requestMatchers(
                        "/api/auth/**",
                        "/oauth2/**",               // initiate OAuth2 login
                        "/login/oauth2/**",         // Spring OAuth2 callback
                        "/login/**",                // permit login error paths
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
                .failureHandler((request, response, exception) -> {
                    org.slf4j.LoggerFactory.getLogger(SecurityConfig.class).error("OAuth2 Login Failed: ", exception);
                    String targetUrl = frontendUrl + "/login?error=" + java.net.URLEncoder.encode(exception.getLocalizedMessage(), java.nio.charset.StandardCharsets.UTF_8);
                    response.sendRedirect(targetUrl);
                })
            )
            .addFilterBefore(new JobPortal.project.security.oauth2.OAuth2RoleRequestFilter(), org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
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

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        configuration.setAllowedOrigins(java.util.List.of(
            frontendUrl,
            "https://job-portal-project-bay.vercel.app",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175"
        ));
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(java.util.List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}




