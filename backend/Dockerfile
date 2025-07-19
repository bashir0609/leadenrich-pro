# ===== Stage 1: Build Stage =====
# This stage installs dependencies and compiles the TypeScript code.
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package.json package-lock.json* ./

# Install dependencies using npm ci for consistency
RUN npm ci

# Copy the Prisma schema to generate the client
# This layer is only invalidated if the schema changes
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# Make the wait-for-it script executable
RUN chmod +x ./scripts/wait-for-it.sh

# Compile the TypeScript project
RUN npm run build

# Install tsc-alias globally within the build stage to resolve path aliases
# This is run after the build to process the output files
RUN npm install -g tsc-alias
RUN tsc-alias -p tsconfig.json


# ===== Stage 2: Production Stage =====
# This stage creates a lean production image with only necessary files.
FROM node:18-alpine
WORKDIR /app

# Add bash for the wait-for-it script and openssl for Prisma
RUN apk add --no-cache bash openssl

# Create a non-root user for better security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy compiled code and necessary assets from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Copy package files to install only production dependencies
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json

# Install only production dependencies to keep the image small
RUN npm ci --only=production

# Change ownership of the app directory to the non-root user
RUN chown -R nodejs:nodejs /app

# Switch to the non-root user
USER nodejs

# Expose the application port
EXPOSE 3001

# The default command to run the application
CMD [ "node", "dist/app.js" ]
