# Build stage
FROM gradle:8.5-jdk21-alpine AS builder

WORKDIR /app

# Copy gradle files
COPY build.gradle settings.gradle node.gradle ./

# Copy source code
COPY src ./src

# Build the application (skip frontend build as we handle it separately in docker-compose)
RUN gradle bootJar --no-daemon -x getFrontend -x cleanFrontendFiles -x npm_run_build

# Runtime stage
FROM amazoncorretto:21-alpine3.21

WORKDIR /app

# Copy the built JAR from builder stage
COPY --from=builder /app/build/libs/*.jar quak.jar

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "quak.jar"]