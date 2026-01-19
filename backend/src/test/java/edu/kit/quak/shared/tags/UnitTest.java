package edu.kit.quak.shared.tags;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.junit.jupiter.api.Tag;

/**
 * Marker annotation for unit tests.
 *
 * <p>Can be applied to classes or methods. Adds the JUnit 5 tag "unit", allowing selective
 * execution or filtering of unit tests.
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Tag("unit")
public @interface UnitTest {}
