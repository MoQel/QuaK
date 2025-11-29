# Build stage
FROM gradle:8.5-jdk21-alpine AS builder

# Install Node.js and npm (needed for frontend build)
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Copy gradle files (expecting root build context)
COPY backend/build.gradle backend/settings.gradle backend/node.gradle ./

# Copy source code
COPY backend/src ./src

# Copy frontend source code (for prod build)
COPY frontend /frontend

# Build the application
# Default to skipping frontend (Dev mode), set to false for Prod
ARG SKIP_FRONTEND=true
RUN if [ "$SKIP_FRONTEND" = "true" ]; then \
    gradle cleanFrontendFiles bootJar --no-daemon -PbuildFrontend=false; \
    else \
    gradle bootJar --no-daemon -PbuildFrontend=true; \
    fi

# Runtime stage
FROM amazoncorretto:21-alpine3.21

WORKDIR /app

# Copy the built JAR from builder stage
COPY --from=builder /app/build/libs/*.jar quak.jar

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "quak.jar"]