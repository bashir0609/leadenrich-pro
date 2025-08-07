"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const errors_1 = require("../types/errors");
const validate = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.body);
            if (!result.success) {
                const errorMessage = result.error.errors
                    .map(err => `${err.path.join('.')}: ${err.message}`)
                    .join(', ');
                throw new errors_1.CustomError(errors_1.ErrorCode.VALIDATION_ERROR, `Validation failed: ${errorMessage}`, 400);
            }
            // Replace req.body with parsed and validated data
            req.body = result.data;
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validate = validate;
//# sourceMappingURL=validation.js.map