CMD ["http-server", "dist", "-p", "5173", "--cors"]
# Serve the application

EXPOSE 5173
# Expose port

COPY --from=builder /app/dist ./dist
# Copy built files from builder stage

RUN npm install -g http-server
# Install a simple HTTP server to serve the built files

WORKDIR /app

FROM node:20-alpine
# Production stage

RUN npm run build
# Build the application

COPY . .
# Copy source code

RUN npm ci
# Install dependencies

COPY package.json package-lock.json ./
# Copy package files

WORKDIR /app

FROM node:20-alpine as builder

