package JobPortal.project.modules.joblisting.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI 3.0 configuration for the Kora Job Portal — Job Listing module.
 *
 * <p>Swagger UI: {@code http://localhost:8080/swagger-ui/index.html}<br>
 * OpenAPI JSON: {@code http://localhost:8080/v3/api-docs}
 *
 * <p>A global {@code bearerAuth} security scheme is registered so every
 * authenticated endpoint shows a "Authorize" padlock in Swagger UI.
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER_AUTH = "bearerAuth";

    @Bean
    public OpenAPI jobPortalOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Kora Job Portal API — Job Listing Module")
                .description("""
                    REST API for the Job Listing module (Sprint 2).
                    
                    **Actor groups:**
                    - **Employer** (`ROLE_EMPLOYER`) — create, update, delete, and toggle listings.
                    - **Job Seeker / Public** — browse, search, and view listings (no token required).
                    - **Admin** (`ROLE_ADMIN`) — view all listings, approve, flag, or force-remove.
                    
                    **Authentication:** JWT Bearer token. Obtain a token from `POST /api/v1/auth/login`
                    then click **Authorize** and paste the token.
                    """)
                .version("2.0.0")
                .contact(new Contact()
                    .name("Kora Team — ISI Engineer Branch")
                    .email("info@institutsaintjean.org"))
                .license(new License()
                    .name("Academic — ISI3196 Java Web Programming")
                    .url("https://www.institutsaintjean.org")))
            .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
            .components(new Components()
                .addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
                    .name(BEARER_AUTH)
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Paste your JWT access token here. "
                        + "Obtain it from POST /api/v1/auth/login")));
    }
}
