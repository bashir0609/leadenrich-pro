"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyService = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
// --- 1. IMPORT YOUR SINGLETON PRISMA INSTANCE ---
const prisma_1 = __importDefault(require("../lib/prisma"));
// --- 2. IMPORT THE PROVIDER REGISTRY ---
const ProviderRegistry_1 = require("./providers/ProviderRegistry");
class ApiKeyService {
    // Your encrypt/decrypt logic is fine, but note the change to no longer encrypt new keys.
    static encryptApiKey(plainKey) { return plainKey; }
    static decryptApiKey(keyValue) {
        try {
            const decrypted = crypto_js_1.default.AES.decrypt(keyValue, this.encryptionKey).toString(crypto_js_1.default.enc.Utf8);
            if (decrypted)
                return decrypted;
        }
        catch (error) { /* Fall through */ }
        return keyValue;
    }
    static async getActiveApiKey(providerId, userId) {
        // --- FIX: Use the singleton prisma instance ---
        const apiKey = await prisma_1.default.apiKey.findFirst({
            where: { providerId, userId, isActive: true },
        });
        if (!apiKey)
            return null;
        return { keyValue: this.decryptApiKey(apiKey.keyValue) };
    }
    static async addApiKey(providerId, keyValue, name, userId) {
        // --- FIX: Use the singleton prisma instance ---
        const apiKey = await prisma_1.default.apiKey.create({
            data: { name, keyValue, providerId, userId, isActive: false },
        });
        return { id: apiKey.id, name: apiKey.name, isActive: apiKey.isActive, createdAt: apiKey.createdAt };
    }
    static async getApiKeys(providerId, userId) {
        // --- FIX: Use the singleton prisma instance ---
        const apiKeys = await prisma_1.default.apiKey.findMany({
            where: { providerId, userId },
            select: { id: true, name: true, keyValue: true, isActive: true, createdAt: true, updatedAt: true },
        });
        // Decrypt the key values before returning
        return apiKeys.map(key => ({
            ...key,
            keyValue: this.decryptApiKey(key.keyValue)
        }));
    }
    // --- 3. IMPLEMENT CACHE INVALIDATION LOGIC ---
    static async setActiveApiKey(keyId, userId) {
        // --- FIX: Use the singleton prisma instance ---
        const targetKey = await prisma_1.default.apiKey.findUnique({
            where: { id: keyId },
            include: { provider: true },
        });
        if (!targetKey || targetKey.userId !== userId)
            throw new Error('API key not found');
        // Perform database operations
        await prisma_1.default.$transaction([
            prisma_1.default.apiKey.updateMany({
                where: { providerId: targetKey.providerId, userId, id: { not: keyId } },
                data: { isActive: false },
            }),
            prisma_1.default.apiKey.update({
                where: { id: keyId },
                data: { isActive: true },
            })
        ]);
        // --- CLEAR THE CACHE ---
        ProviderRegistry_1.ProviderRegistry.clearInstance(targetKey.provider.name, userId);
        return { id: targetKey.id, name: targetKey.name, isActive: true, providerId: targetKey.providerId };
    }
    static async deleteApiKey(keyId, userId) {
        // --- FIX: Use the singleton prisma instance ---
        const keyToDelete = await prisma_1.default.apiKey.findFirst({
            where: { id: keyId, userId },
            include: { provider: true },
        });
        if (!keyToDelete)
            throw new Error('API key not found or you do not have permission.');
        const result = await prisma_1.default.apiKey.deleteMany({ where: { id: keyId, userId } });
        // --- CLEAR THE CACHE ---
        ProviderRegistry_1.ProviderRegistry.clearInstance(keyToDelete.provider.name, userId);
        return { deleted: result.count > 0 };
    }
    static async updateApiKey(keyId, keyValue, userId, name) {
        // --- FIX: Use the singleton prisma instance ---
        const keyToUpdate = await prisma_1.default.apiKey.findFirst({
            where: { id: keyId, userId },
            include: { provider: true },
        });
        if (!keyToUpdate)
            throw new Error('API key not found or you do not have permission.');
        const updatedKey = await prisma_1.default.apiKey.update({
            where: { id: keyId },
            data: { name, keyValue },
        });
        // --- CLEAR THE CACHE ---
        ProviderRegistry_1.ProviderRegistry.clearInstance(keyToUpdate.provider.name, userId);
        return { id: updatedKey.id, name: updatedKey.name, isActive: updatedKey.isActive, updatedAt: updatedKey.updatedAt };
    }
}
exports.ApiKeyService = ApiKeyService;
ApiKeyService.encryptionKey = process.env.ENCRYPTION_KEY || 'default-fallback-key';
//# sourceMappingURL=ApiKeyService.js.map