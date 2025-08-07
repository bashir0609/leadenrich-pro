export declare class ApiKeyService {
    private static readonly encryptionKey;
    static encryptApiKey(plainKey: string): string;
    static decryptApiKey(keyValue: string): string;
    static getActiveApiKey(providerId: number, userId: string): Promise<{
        keyValue: string;
    } | null>;
    static addApiKey(providerId: number, keyValue: string, name: string, userId: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
    }>;
    static getApiKeys(providerId: number, userId: string): Promise<{
        keyValue: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
    }[]>;
    static setActiveApiKey(keyId: string, userId: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        providerId: number;
    }>;
    static deleteApiKey(keyId: string, userId: string): Promise<{
        deleted: boolean;
    }>;
    static updateApiKey(keyId: string, keyValue: string, userId: string, name: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        updatedAt: Date;
    }>;
}
//# sourceMappingURL=ApiKeyService.d.ts.map