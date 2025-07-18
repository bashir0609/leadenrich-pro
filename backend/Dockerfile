# ===== Stage 1: Build Stage =====
# This stage installs all dependencies and compiles the TypeScript code
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies) for the build step
RUN npm ci

COPY . .

# Generate the Prisma client from your schema
RUN npx prisma generate

# Compile the TypeScript project into JavaScript
RUN npm run build


# ===== Stage 2: Production Stage =====
# This stage creates a small, secure image to run the app
FROM node:18-alpine
WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy necessary files from the build stage
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/dist ./dist

# Install ONLY production dependencies for the final image
RUN npm ci --only=production

USER nodejs
EXPOSE 8000
    
# Command to start the compiled application
CMD [ "node", "dist/server.js" ]