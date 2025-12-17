# Build stage - use Debian-based image for better multi-arch support
FROM eclipse-temurin:21-jdk-jammy AS builder

# Build argument to control frontend build (default: skip frontend for dev)
ARG SKIP_FRONTEND=true

# Install Gradle (always needed)
RUN apt-get update && \
    apt-get install -y wget unzip && \
    wget https://services.gradle.org/distributions/gradle-8.5-bin.zip && \
    unzip gradle-8.5-bin.zip && \
    mv gradle-8.5 /opt/gradle && \
    rm gradle-8.5-bin.zip && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js only when building frontend (prod mode)
RUN if [ "$SKIP_FRONTEND" = "false" ]; then \
    apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*; \
    fi

ENV GRADLE_HOME=/opt/gradle
ENV PATH=$PATH:$GRADLE_HOME/bin

WORKDIR /app

# Copy gradle files (expecting root build context)
COPY backend/build.gradle backend/settings.gradle backend/node.gradle ./

# Copy source code
COPY backend/src ./src

# Copy frontend source code only for prod build
RUN mkdir -p /frontend
COPY frontend /frontend

# Build the application
# Dev mode: only build backend JAR (no frontend operations at all)
# Prod mode: build frontend and include in JAR
RUN if [ "$SKIP_FRONTEND" = "true" ]; then \
    gradle bootJar --no-daemon -PbuildFrontend=false; \
    else \
    gradle bootJar --no-daemon -PbuildFrontend=true; \
    fi

# Runtime stage - use Debian-based for consistency
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy the built JAR from builder stage
COPY --from=builder /app/build/libs/*.jar quak.jar

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "quak.jar"]