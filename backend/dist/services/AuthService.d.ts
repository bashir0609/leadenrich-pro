export interface AuthTokenPayload {
    userId: string;
    email: string;
    role: string;
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface RegisterData extends LoginCredentials {
    name: string;
    company?: string;
}
export declare class AuthService {
    private static readonly JWT_SECRET;
    private static readonly JWT_EXPIRES_IN;
    private static readonly SALT_ROUNDS;
    static register(data: RegisterData): Promise<{
        user: any;
        token: string;
    }>;
    static login(credentials: LoginCredentials): Promise<{
        user: any;
        token: string;
    }>;
    static verifyToken(token: string): Promise<AuthTokenPayload>;
    static refreshToken(oldToken: string): Promise<string>;
    static generateApiKey(userId: string): Promise<string>;
    static validateApiKey(apiKey: string): Promise<AuthTokenPayload>;
    private static generateToken;
    private static generateSecureKey;
    private static sanitizeUser;
}
