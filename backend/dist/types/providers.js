"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderOperation = exports.ProviderCategory = void 0;
var ProviderCategory;
(function (ProviderCategory) {
    ProviderCategory["MAJOR_DATABASE"] = "major-database";
    ProviderCategory["EMAIL_FINDER"] = "email-finder";
    ProviderCategory["COMPANY_INTELLIGENCE"] = "company-intelligence";
    ProviderCategory["AI_RESEARCH"] = "ai-research";
    ProviderCategory["SOCIAL_ENRICHMENT"] = "social-enrichment";
    ProviderCategory["VERIFICATION"] = "verification";
})(ProviderCategory || (exports.ProviderCategory = ProviderCategory = {}));
var ProviderOperation;
(function (ProviderOperation) {
    ProviderOperation["FIND_EMAIL"] = "find-email";
    ProviderOperation["ENRICH_PERSON"] = "enrich-person";
    ProviderOperation["ENRICH_COMPANY"] = "enrich-company";
    ProviderOperation["SEARCH_PEOPLE"] = "search-people";
    ProviderOperation["SEARCH_COMPANIES"] = "search-companies";
    ProviderOperation["FIND_LOOKALIKE"] = "find-lookalike";
})(ProviderOperation || (exports.ProviderOperation = ProviderOperation = {}));
//# sourceMappingURL=providers.js.map