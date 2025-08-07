// backend/src/services/ApiKeyRecovery.ts
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto-js';

export class ApiKeyRecovery {
  static async handleDecryptionError(userId: string, providerId: number): Promise<void> {
    const prisma = new PrismaClient();
    
    // Mark corrupted keys as inactive
    await prisma.apiKey.updateMany({
      where: { userId, providerId, isActive: true },
      data: { isActive: false }
    });
    
    console.log(`🔧 Deactivated corrupted API keys for user ${userId}`);
    await prisma.$disconnect();
  }
}