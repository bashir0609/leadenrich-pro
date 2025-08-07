"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyController = void 0;
const ApiKeyService_1 = require("../services/ApiKeyService");
class ApiKeyController {
    static async addApiKey(req, res) {
        try {
            const { providerId } = req.params; // Get from URL params
            const { keyValue, name } = req.body; // Get from request body
            const userId = req.user.userId;
            // ADD THESE DEBUG LOGS:
            console.log('📝 Storing API Key - Raw keyValue:', keyValue);
            console.log('📝 keyValue length:', keyValue.length);
            console.log('📝 keyValue type:', typeof keyValue);
            if (!providerId || !keyValue || !name) {
                return res.status(400).json({
                    success: false,
                    error: 'providerId (in URL), keyValue, and name are required'
                });
            }
            const result = await ApiKeyService_1.ApiKeyService.addApiKey(parseInt(providerId), keyValue, name, userId);
            // LOG WHAT WAS ACTUALLY STORED:
            console.log('💾 Stored result:', result);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            console.error('Error adding API key:', error);
            res.status(500).json({ success: false, error: 'Failed to add API key' });
        }
    }
    static async getApiKeys(req, res) {
        try {
            const { providerId } = req.params;
            const userId = req.user.userId;
            if (!providerId) {
                return res.status(400).json({
                    success: false,
                    error: 'providerId is required'
                });
            }
            const keys = await ApiKeyService_1.ApiKeyService.getApiKeys(parseInt(providerId), userId);
            res.status(200).json({ success: true, data: keys });
        }
        catch (error) {
            console.error('Error getting API keys:', error);
            res.status(500).json({ success: false, error: 'Failed to get API keys' });
        }
    }
    static async setActiveApiKey(req, res) {
        try {
            const { keyId } = req.params;
            const userId = req.user.userId;
            if (!keyId) {
                return res.status(400).json({
                    success: false,
                    error: 'keyId is required'
                });
            }
            const result = await ApiKeyService_1.ApiKeyService.setActiveApiKey(keyId, userId);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            console.error('Error setting active API key:', error);
            res.status(500).json({ success: false, error: 'Failed to set active API key' });
        }
    }
    static async deleteApiKey(req, res) {
        try {
            const { keyId } = req.params;
            const userId = req.user.userId;
            if (!keyId) {
                return res.status(400).json({
                    success: false,
                    error: 'keyId is required'
                });
            }
            const result = await ApiKeyService_1.ApiKeyService.deleteApiKey(keyId, userId);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            console.error('Error deleting API key:', error);
            res.status(500).json({ success: false, error: 'Failed to delete API key' });
        }
    }
    static async updateApiKey(req, res) {
        try {
            const { keyId } = req.params;
            const { keyValue, name } = req.body;
            const userId = req.user.userId;
            if (!keyId || !keyValue) {
                return res.status(400).json({
                    success: false,
                    error: 'keyId and keyValue are required'
                });
            }
            const result = await ApiKeyService_1.ApiKeyService.updateApiKey(keyId, keyValue, userId, name);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            console.error('Error updating API key:', error);
            res.status(500).json({ success: false, error: 'Failed to update API key' });
        }
    }
}
exports.ApiKeyController = ApiKeyController;
//# sourceMappingURL=apiKeyController.js.map