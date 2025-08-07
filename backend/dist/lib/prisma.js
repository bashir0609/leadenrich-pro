"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// If we're in production, we always create a new client.
// In development, we check if a client is already on the global object.
// If it is, we use it. If not, we create a new one and attach it.
const prisma = global.prisma || new client_1.PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // Optional: for better logging
});
if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
exports.default = prisma;
//# sourceMappingURL=prisma.js.map