package edu.kit.quak.infrastructure.user.in.web.rest;

import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller to handle favicon requests and prevent noisy 404 logs. Since this
 * is a REST-only
 * backend, we don't need an actual icon.
 */
@Hidden
@RestController
public class FaviconController {

    @GetMapping("favicon.ico")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void returnNoFavicon() {
        // Just return 204 No Content
    }
}
