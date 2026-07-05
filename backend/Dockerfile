# Build Python LSP in an isolated virtual environment.
FROM eclipse-temurin:21-jre-jammy AS python-lsp-builder

ARG PIP_VERSION=26.1.2

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-venv && \
    rm -rf /var/lib/apt/lists/*

COPY backend/lsp/servers/python/requirements.txt /tmp/python-lsp-requirements.txt
RUN python3 -m venv /opt/lsp/python && \
    /opt/lsp/python/bin/pip install --no-cache-dir "pip==${PIP_VERSION}" && \
    /opt/lsp/python/bin/pip install --no-cache-dir -r /tmp/python-lsp-requirements.txt

# Build a static QASM LSP binary so the runtime image does not need Go.
FROM golang:1.24-bookworm AS qasm-lsp-builder

ARG QASMLSP_VERSION=v0.2.17
RUN CGO_ENABLED=0 go install "github.com/orangekame3/qasmtools/cmd/qasmlsp@${QASMLSP_VERSION}"

# Build stage - use Debian-based image for better multi-arch support
FROM eclipse-temurin:21-jdk-jammy AS builder

# Build argument to control frontend build (default: skip frontend for dev)
ARG SKIP_FRONTEND=true

# Install Node.js only when building frontend (prod mode)
RUN if [ "$SKIP_FRONTEND" = "false" ]; then \
    apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*; \
    fi

WORKDIR /app

# Use the checked-in wrapper so local, CI and Docker builds use the same Gradle version.
COPY backend/gradlew backend/build.gradle backend/settings.gradle backend/node.gradle ./
COPY backend/gradle ./gradle

# Copy source code
COPY backend/src ./src

# Copy frontend source code only for prod build
RUN mkdir -p /frontend
COPY frontend /frontend

# Build the application
# Dev mode: only build backend JAR (no frontend operations at all)
# Prod mode: build frontend and include in JAR
RUN if [ "$SKIP_FRONTEND" = "true" ]; then \
    ./gradlew bootJar --no-daemon -PbuildFrontend=false; \
    else \
    ./gradlew bootJar --no-daemon -PbuildFrontend=true; \
    fi

# Runtime stage - contains only Java, Python runtime and the built LSP servers.
FROM eclipse-temurin:21-jre-jammy

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd --gid 10001 quak && \
    useradd --uid 10001 --gid quak --create-home --shell /usr/sbin/nologin quak

WORKDIR /app

COPY --from=builder /app/build/libs/*.jar quak.jar
COPY --from=python-lsp-builder /opt/lsp/python /opt/lsp/python
COPY --from=qasm-lsp-builder /go/bin/qasmlsp /opt/lsp/qasm/qasmlsp

RUN mkdir -p /var/lib/quak/lsp-workspace && \
    chown -R quak:quak /app /var/lib/quak

ENV PATH="/opt/lsp/python/bin:/opt/lsp/qasm:${PATH}"

USER quak

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "quak.jar"]
