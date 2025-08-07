import crypto from 'crypto-js';
// --- 1. IMPORT YOUR SINGLETON PRISMA INSTANCE ---
import prisma from '../lib/prisma';
// --- 2. IMPORT THE PROVIDER REGISTRY ---
import { ProviderRegistry } from './providers/ProviderRegistry';

export class ApiKeyService {
  private static readonly encryptionKey = process.env.ENCRYPTION_KEY || 'default-fallback-key';

  // Your encrypt/decrypt logic is fine, but note the change to no longer encrypt new keys.
  static encryptApiKey(plainKey: string): string { return plainKey; }
  static decryptApiKey(keyValue: string): string {
    try {
      const decrypted = crypto.AES.decrypt(keyValue, this.encryptionKey).toString(crypto.enc.Utf8);
      if (decrypted) return decrypted;
    } catch (error) { /* Fall through */ }
    return keyValue;
  }

  static async getActiveApiKey(providerId: number, userId: string): Promise<{ keyValue: string } | null> {
    // --- FIX: Use the singleton prisma instance ---
    const apiKey = await prisma.apiKey.findFirst({
      where: { providerId, userId, isActive: true },
    });
    if (!apiKey) return null;
    return { keyValue: this.decryptApiKey(apiKey.keyValue) };
  }

  static async addApiKey(providerId: number, keyValue: string, name: string, userId: string) {
    // --- FIX: Use the singleton prisma instance ---
    const apiKey = await prisma.apiKey.create({
      data: { name, keyValue, providerId, userId, isActive: false },
    });
    return { id: apiKey.id, name: apiKey.name, isActive: apiKey.isActive, createdAt: apiKey.createdAt };
  }

  static async getApiKeys(providerId: number, userId: string) {
    // --- FIX: Use the singleton prisma instance ---
    const apiKeys = await prisma.apiKey.findMany({
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

  static async setActiveApiKey(keyId: string, userId: string) {
    // --- FIX: Use the singleton prisma instance ---
    const targetKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      include: { provider: true },
    });
    if (!targetKey || targetKey.userId !== userId) throw new Error('API key not found');

    // Perform database operations
    await prisma.$transaction([
      prisma.apiKey.updateMany({
        where: { providerId: targetKey.providerId, userId, id: { not: keyId } },
        data: { isActive: false },
      }),
      prisma.apiKey.update({
        where: { id: keyId },
        data: { isActive: true },
      })
    ]);

    // --- CLEAR THE CACHE ---
    ProviderRegistry.clearInstance(targetKey.provider.name, userId);
    
    return { id: targetKey.id, name: targetKey.name, isActive: true, providerId: targetKey.providerId };
  }

  static async deleteApiKey(keyId: string, userId: string) {
    // --- FIX: Use the singleton prisma instance ---
    const keyToDelete = await prisma.apiKey.findFirst({
      where: { id: keyId, userId },
      include: { provider: true },
    });
    if (!keyToDelete) throw new Error('API key not found or you do not have permission.');

    const result = await prisma.apiKey.deleteMany({ where: { id: keyId, userId } });

    // --- CLEAR THE CACHE ---
    ProviderRegistry.clearInstance(keyToDelete.provider.name, userId);

    return { deleted: result.count > 0 };
  }

  static async updateApiKey(keyId: string, keyValue: string, userId: string, name: string) {
    // --- FIX: Use the singleton prisma instance ---
    const keyToUpdate = await prisma.apiKey.findFirst({
        where: { id: keyId, userId },
        include: { provider: true },
    });
    if (!keyToUpdate) throw new Error('API key not found or you do not have permission.');

    const updatedKey = await prisma.apiKey.update({
      where: { id: keyId },
      data: { name, keyValue },
    });

    // --- CLEAR THE CACHE ---
    ProviderRegistry.clearInstance(keyToUpdate.provider.name, userId);

    return { id: updatedKey.id, name: updatedKey.name, isActive: updatedKey.isActive, updatedAt: updatedKey.updatedAt };
  }
}