package edu.kit.quak.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger configuration for the QuaK API documentation. This class configures the API
 * metadata displayed in Swagger UI.
 *
 * <p>In development mode (dev profile), use HTTP Basic Auth with: - Username: admin - Password:
 * admin
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI quakOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("QuaK API")
                        .description("""
                                                RESTful API for the QuaK application - A quantum computing project management platform.

                                                ## Authentication

                                                **Development Mode** (`dev` profile): Use HTTP Basic Auth
                                                - Username: `admin`
                                                - Password: `admin`

                                                **Production Mode**: OAuth2/OIDC via Google
                                                """)
                        .version("0.0.1-SNAPSHOT")
                        .contact(new Contact().name("QuaK Development Team").email("quak@kit.edu"))
                        .license(new License().name("MIT License").url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Local Development Server")))
                // Add security scheme for HTTP Basic Auth (used in dev mode)
                .components(new Components()
                        .addSecuritySchemes(
                                "basicAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("basic")
                                        .description("HTTP Basic Authentication (dev mode:" + " admin/admin)")))
                // Apply security globally
                .addSecurityItem(new SecurityRequirement().addList("basicAuth"))
                .tags(List.of(
                        new Tag()
                                .name("Authentication")
                                .description("Authentication and user session management" + " endpoints"),
                        new Tag().name("Projects").description("Project management operations"),
                        new Tag().name("Files").description("File and directory management operations"),
                        new Tag().name("Gates").description("Quantum gate operations")));
    }
}
