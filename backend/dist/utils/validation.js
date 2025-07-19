"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.schemas = void 0;
const zod_1 = require("zod");
const errors_1 = require("../types/errors");
// Common validation schemas
exports.schemas = {
    id: zod_1.z.string().cuid(),
    email: zod_1.z.string().email(),
    url: zod_1.z.string().url(),
    pagination: zod_1.z.object({
        page: zod_1.z.coerce.number().int().positive().default(1),
        limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    }),
};
// Validation middleware factory
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                next((0, errors_1.BadRequestError)('Validation failed', { errors: error.errors }));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validate = validate;
//# sourceMappingURL=validation.js.map