"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProvider = exports.ProviderFactory = exports.ProviderRegistry = void 0;
// Import all provider implementations to ensure they register themselves
require("./implementations/SurfeProvider");
require("./implementations/ApolloProvider");
require("./implementations/BetterEnrichProvider");
require("./implementations/CompanyEnrichProvider");
// Export the registry and factory for use by other parts of the application
var ProviderRegistry_1 = require("./ProviderRegistry");
Object.defineProperty(exports, "ProviderRegistry", { enumerable: true, get: function () { return ProviderRegistry_1.ProviderRegistry; } });
var ProviderFactory_1 = require("./ProviderFactory");
Object.defineProperty(exports, "ProviderFactory", { enumerable: true, get: function () { return ProviderFactory_1.ProviderFactory; } });
var BaseProvider_1 = require("./base/BaseProvider");
Object.defineProperty(exports, "BaseProvider", { enumerable: true, get: function () { return BaseProvider_1.BaseProvider; } });
//# sourceMappingURL=index.js.map