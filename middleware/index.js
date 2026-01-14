/**
 * Middleware Index - Tüm middleware'leri export eder
 */

const { authMiddleware, requireRole } = require('./authMiddleware');
const { errorHandler, notFoundHandler, asyncHandler, AppError } = require('./errorMiddleware');
const {
    validateNumeric,
    validateRequired,
    validateRange,
    validateEnum,
    validateProductionParams,
    validateSupplierParams,
    sanitizeParams
} = require('./validateParams');

module.exports = {
    // Auth
    authMiddleware,
    requireRole,

    // Error handling
    errorHandler,
    notFoundHandler,
    asyncHandler,
    AppError,

    // Validation
    validateNumeric,
    validateRequired,
    validateRange,
    validateEnum,
    validateProductionParams,
    validateSupplierParams,
    sanitizeParams
};
