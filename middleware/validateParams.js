/**
 * Validate Params Middleware - Parametre Doğrulama
 * Frontend'den gelen parametrelerin doğru formatta olup olmadığını kontrol eder
 */

const { AppError } = require('./errorMiddleware');

// Sayısal parametre doğrulama
const validateNumeric = (fields) => {
    return (req, res, next) => {
        const params = { ...req.query, ...req.body };
        const errors = [];

        fields.forEach(field => {
            if (params[field] !== undefined) {
                const value = parseFloat(params[field]);
                if (isNaN(value)) {
                    errors.push(`${field} sayısal bir değer olmalıdır`);
                }
            }
        });

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Parametre doğrulama hatası',
                details: errors
            });
        }

        next();
    };
};

// Zorunlu parametre doğrulama
const validateRequired = (fields) => {
    return (req, res, next) => {
        const params = { ...req.query, ...req.body };
        const missing = [];

        fields.forEach(field => {
            if (params[field] === undefined || params[field] === null || params[field] === '') {
                missing.push(field);
            }
        });

        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Eksik parametre',
                message: `Şu parametreler gerekli: ${missing.join(', ')}`
            });
        }

        next();
    };
};

// Aralık doğrulama
const validateRange = (field, min, max) => {
    return (req, res, next) => {
        const params = { ...req.query, ...req.body };
        const value = parseFloat(params[field]);

        if (params[field] !== undefined && !isNaN(value)) {
            if (value < min || value > max) {
                return res.status(400).json({
                    success: false,
                    error: 'Parametre aralık hatası',
                    message: `${field} değeri ${min} ile ${max} arasında olmalıdır`
                });
            }
        }

        next();
    };
};

// Enum doğrulama
const validateEnum = (field, allowedValues) => {
    return (req, res, next) => {
        const params = { ...req.query, ...req.body };
        const value = params[field];

        if (value !== undefined && !allowedValues.includes(value)) {
            return res.status(400).json({
                success: false,
                error: 'Geçersiz parametre değeri',
                message: `${field} şu değerlerden biri olmalıdır: ${allowedValues.join(', ')}`
            });
        }

        next();
    };
};

// Üretim parametreleri doğrulama
const validateProductionParams = (req, res, next) => {
    const { ice_decline, ev_growth, months } = { ...req.query, ...req.body };
    const errors = [];

    if (ice_decline !== undefined) {
        const val = parseFloat(ice_decline);
        if (isNaN(val) || val < -50 || val > 0) {
            errors.push('ice_decline -50 ile 0 arasında olmalı');
        }
    }

    if (ev_growth !== undefined) {
        const val = parseFloat(ev_growth);
        if (isNaN(val) || val < 0 || val > 100) {
            errors.push('ev_growth 0 ile 100 arasında olmalı');
        }
    }

    if (months !== undefined) {
        const val = parseInt(months);
        if (isNaN(val) || val < 1 || val > 36) {
            errors.push('months 1 ile 36 arasında olmalı');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Üretim parametre hatası',
            details: errors
        });
    }

    next();
};

// Tedarikçi parametreleri doğrulama
const validateSupplierParams = (req, res, next) => {
    const { quality_score, ppm_rate, price_diff } = { ...req.query, ...req.body };
    const errors = [];

    if (quality_score !== undefined) {
        const val = parseFloat(quality_score);
        if (isNaN(val) || val < 0 || val > 100) {
            errors.push('quality_score 0 ile 100 arasında olmalı');
        }
    }

    if (ppm_rate !== undefined) {
        const val = parseFloat(ppm_rate);
        if (isNaN(val) || val < 0) {
            errors.push('ppm_rate pozitif olmalı');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Tedarikçi parametre hatası',
            details: errors
        });
    }

    next();
};

// Genel parametre sanitizasyonu
const sanitizeParams = (req, res, next) => {
    // Query params
    Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
            req.query[key] = req.query[key].trim();
        }
    });

    // Body params
    if (req.body && typeof req.body === 'object') {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        });
    }

    next();
};

module.exports = {
    validateNumeric,
    validateRequired,
    validateRange,
    validateEnum,
    validateProductionParams,
    validateSupplierParams,
    sanitizeParams
};
