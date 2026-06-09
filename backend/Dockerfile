# Stage 1: Build frontend with native Node.js toolchain
FROM node:22-slim AS frontend-builder
WORKDIR /frontend

# Install dependencies first (layer caching: only re-runs when deps change)
COPY frontend/package.json frontend/package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
  npm ci --no-audit --no-fund; \
  else \
  npm install --no-audit --no-fund; \
  fi

# Copy remaining source and build (this layer invalidates when any source changes)
COPY frontend ./
RUN npm run build
# Output: /frontend/dist/

# Stage 2: Build backend Spring Boot JAR (Java only, no Node.js)
FROM eclipse-temurin:21-jdk-jammy AS builder

# Build argument to control frontend build (default: skip frontend for dev)
ARG SKIP_FRONTEND=true

# Install Gradle
RUN apt-get update && \
  apt-get install -y wget unzip && \
  wget https://services.gradle.org/distributions/gradle-8.5-bin.zip && \
  unzip gradle-8.5-bin.zip && \
  mv gradle-8.5 /opt/gradle && \
  rm gradle-8.5-bin.zip && \
  rm -rf /var/lib/apt/lists/*

ENV GRADLE_HOME=/opt/gradle
ENV PATH=$PATH:$GRADLE_HOME/bin

WORKDIR /app

# Copy Gradle build files (expecting root build context)
COPY backend/build.gradle backend/settings.gradle backend/node.gradle ./

# Copy backend source
COPY backend/src ./src

# Import pre-built frontend dist from stage 1
COPY --from=frontend-builder /frontend/dist /frontend-dist

# Prod: place frontend into static resources so Spring Boot serves it.
# Dev (SKIP_FRONTEND=true): leave static empty — prepareDevStatic creates a placeholder.
RUN if [ "$SKIP_FRONTEND" = "false" ]; then \
  mkdir -p ./src/main/resources/static && \
  cp -r /frontend-dist/* ./src/main/resources/static/; \
  fi

# Build the Spring Boot JAR (frontend is already in static/, so buildFrontend=false)
# --console=plain ensures task output is visible line-by-line in CI logs
RUN gradle bootJar --no-daemon -PbuildFrontend=false --console=plain

# Stage 3: Minimal runtime image
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar quak.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "quak.jar"]
