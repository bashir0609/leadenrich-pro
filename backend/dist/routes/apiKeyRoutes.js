"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyRouter = void 0;
// src/routes/apiKeyRoutes.ts
const express_1 = require("express");
const apiKeyController_1 = require("../controllers/apiKeyController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.apiKeyRouter = router;
// Get all keys for a provider
router.get('/providers/:providerId/keys', auth_1.authenticate, apiKeyController_1.ApiKeyController.getApiKeys);
// Add a new key to a provider
router.post('/providers/:providerId/keys', auth_1.authenticate, apiKeyController_1.ApiKeyController.addApiKey);
// Set a key as active
router.put('/providers/:providerId/keys/:keyId/activate', auth_1.authenticate, apiKeyController_1.ApiKeyController.setActiveApiKey);
// Update an existing API key
router.put('/providers/:providerId/keys/:keyId', auth_1.authenticate, apiKeyController_1.ApiKeyController.updateApiKey);
// Delete a key
router.delete('/providers/:providerId/keys/:keyId', auth_1.authenticate, apiKeyController_1.ApiKeyController.deleteApiKey);
//# sourceMappingURL=apiKeyRoutes.js.map