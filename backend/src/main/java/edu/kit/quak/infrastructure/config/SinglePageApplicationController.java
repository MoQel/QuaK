package edu.kit.quak.infrastructure.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serves the React application for browser-history routes.
 *
 * <p>The frontend is bundled into Spring Boot's static resources in production. Requests made by
 * React Router after the initial load never reach this controller, but a browser refresh does. In
 * that case Spring must return the application shell instead of looking for a static file at the
 * client-side route.
 */
@Controller
public class SinglePageApplicationController {

    @GetMapping({ "/login", "/project/{projectId}", "/profile", "/settings" })
    public String forwardToApplication() {
        return "forward:/index.html";
    }
}
