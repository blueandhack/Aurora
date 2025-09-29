# Use multi-architecture Node.js base image
FROM --platform=$BUILDPLATFORM node:18-alpine

# Set build arguments for cross-platform builds
ARG BUILDPLATFORM
ARG TARGETPLATFORM

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create directories for audio processing
RUN mkdir -p /tmp/audio

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S aurora -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R aurora:nodejs /usr/src/app /tmp/audio

# Switch to non-root user
USER aurora

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3000, path: '/health', timeout: 2000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();"

# Start the application
CMD ["node", "server.js"]