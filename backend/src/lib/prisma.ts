import { PrismaClient } from '@prisma/client';

// This helps us avoid instantiating Prisma Client multiple times in development.
declare global {
  // We allow a global var for prisma, but only in development.
  var prisma: PrismaClient | undefined;
}

// If we're in production, we always create a new client.
// In development, we check if a client is already on the global object.
// If it is, we use it. If not, we create a new one and attach it.
const prisma = global.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Optional: for better logging
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;