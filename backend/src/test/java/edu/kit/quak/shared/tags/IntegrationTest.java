package edu.kit.quak.shared.tags;

import org.junit.jupiter.api.Tag;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marker annotation for integration tests.
 * <p>
 * Can be applied to classes or methods. Adds the JUnit 5 tag "integration",
 * allowing selective execution or filtering of integration tests.
 * </p>
 */
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Tag("integration")
public @interface IntegrationTest {}
