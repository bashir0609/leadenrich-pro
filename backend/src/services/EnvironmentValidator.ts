import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class EnvironmentValidator {
  private static readonly ENV_FILES = ['.env.local', '.env', '.env.production'];
  
  static validateEncryptionConsistency(): string {
    const envPath = path.join(process.cwd(), '.env.local');
    
    // Ensure .env.local exists with consistent encryption key
    if (!fs.existsSync(envPath)) {
      const defaultKey = crypto.createHash('md5').update('leadenrich-pro-encryption').digest('hex');
      fs.writeFileSync(envPath, `ENCRYPTION_KEY=${defaultKey}\n`);
    }
    
    // Validate current environment key
    const currentKey = process.env.ENCRYPTION_KEY;
    if (!currentKey || currentKey.length !== 32) {
      throw new Error('Invalid ENCRYPTION_KEY in environment');
    }
    
    return currentKey;
  }
  
  static async cleanupConflictingEnvFiles(): Promise<void> {
    const baseDir = process.cwd();
    
    // Remove conflicting .env files (keep only .env.local)
    for (const file of this.ENV_FILES) {
      if (file !== '.env.local') {
        const filePath = path.join(baseDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Removed conflicting env file: ${file}`);
        }
      }
    }
  }
}
