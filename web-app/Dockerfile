FROM node:20-alpine3.18 AS builder

# Set working directory
WORKDIR /app

# Install pnpm using npm
RUN npm install -g pnpm

# Copy all source files
COPY . .

# Install dependencies (with lockfile integrity check)
RUN pnpm install

# Pass environment variables at build time
ARG NEXT_PUBLIC_AI_WEB_SOCKET_URL
ENV NEXT_PUBLIC_AI_WEB_SOCKET_URL=${NEXT_PUBLIC_AI_WEB_SOCKET_URL}

# Generate Prisma client
RUN pnpm exec prisma generate --schema ./data-core/database 

# Build the project (this will replace NEXT_PUBLIC_ variables in the built files)
RUN pnpm build

# Expose the necessary port (if needed)
EXPOSE 3000

# Command to run the app
CMD ["pnpm", "run", "start"]
