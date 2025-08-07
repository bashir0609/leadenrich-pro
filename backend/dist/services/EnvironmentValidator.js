"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentValidator = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
class EnvironmentValidator {
    static validateEncryptionConsistency() {
        const envPath = path_1.default.join(process.cwd(), '.env.local');
        // Ensure .env.local exists with consistent encryption key
        if (!fs_1.default.existsSync(envPath)) {
            const defaultKey = crypto_1.default.createHash('md5').update('leadenrich-pro-encryption').digest('hex');
            fs_1.default.writeFileSync(envPath, `ENCRYPTION_KEY=${defaultKey}\n`);
        }
        // Validate current environment key
        const currentKey = process.env.ENCRYPTION_KEY;
        if (!currentKey || currentKey.length !== 32) {
            throw new Error('Invalid ENCRYPTION_KEY in environment');
        }
        return currentKey;
    }
    static async cleanupConflictingEnvFiles() {
        const baseDir = process.cwd();
        // Remove conflicting .env files (keep only .env.local)
        for (const file of this.ENV_FILES) {
            if (file !== '.env.local') {
                const filePath = path_1.default.join(baseDir, file);
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                    console.log(`🗑️ Removed conflicting env file: ${file}`);
                }
            }
        }
    }
}
exports.EnvironmentValidator = EnvironmentValidator;
EnvironmentValidator.ENV_FILES = ['.env.local', '.env', '.env.production'];
//# sourceMappingURL=EnvironmentValidator.js.map