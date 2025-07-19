"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProviders = void 0;
const ProviderRegistry_1 = require("../services/providers/ProviderRegistry");
const getProviders = (_req, res) => {
    const providers = ProviderRegistry_1.ProviderRegistry.getRegisteredProviders();
    res.status(200).json({ providers });
};
exports.getProviders = getProviders;
//# sourceMappingURL=providersController.js.map