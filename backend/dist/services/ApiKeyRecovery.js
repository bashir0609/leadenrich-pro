"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyRecovery = void 0;
// backend/src/services/ApiKeyRecovery.ts
const client_1 = require("@prisma/client");
class ApiKeyRecovery {
    static async handleDecryptionError(userId, providerId) {
        const prisma = new client_1.PrismaClient();
        // Mark corrupted keys as inactive
        await prisma.apiKey.updateMany({
            where: { userId, providerId, isActive: true },
            data: { isActive: false }
        });
        console.log(`🔧 Deactivated corrupted API keys for user ${userId}`);
        await prisma.$disconnect();
    }
}
exports.ApiKeyRecovery = ApiKeyRecovery;
//# sourceMappingURL=ApiKeyRecovery.js.map