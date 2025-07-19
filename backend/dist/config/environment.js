"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']),
    PORT: zod_1.z.coerce.number().default(3001),
    HOST: zod_1.z.string().default('localhost'),
    DATABASE_URL: zod_1.z.string().url(),
    REDIS_URL: zod_1.z.string().url(),
    JWT_SECRET: zod_1.z.string().min(1),
    ENCRYPTION_KEY: zod_1.z.string().length(32),
    CORS_ORIGIN: zod_1.z.string().url(),
    SURFE_API_KEY: zod_1.z.string().default(''),
});
exports.env = envSchema.parse(process.env);
//# sourceMappingURL=environment.js.map