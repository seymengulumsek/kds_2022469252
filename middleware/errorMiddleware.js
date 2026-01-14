/**
 * Error Middleware - Merkezi Hata Yönetimi
 * Tüm API hatalarını tek noktadan yönetir
 */

// Hata yakalama middleware
const errorHandler = (err, req, res, next) => {
    console.error('❌ HATA:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Veritabanı hataları
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR') {
        return res.status(500).json({
            success: false,
            error: 'Veritabanı hatası',
            message: 'Veritabanı tablosu veya alanı bulunamadı. Lütfen schema.sql dosyasını çalıştırın.',
            code: err.code
        });
    }

    if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({
            success: false,
            error: 'Veritabanı bağlantı hatası',
            message: 'MySQL sunucusuna bağlanılamıyor. Lütfen MySQL servisinin çalıştığından emin olun.'
        });
    }

    // Validation hataları
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Doğrulama hatası',
            message: err.message,
            details: err.details
        });
    }

    // Genel hata
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: err.name || 'Sunucu Hatası',
        message: err.message || 'Beklenmeyen bir hata oluştu',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// 404 handler
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint bulunamadı',
        message: `${req.method} ${req.url} yolu bulunamadı`,
        availableEndpoints: [
            'GET /api/kpi',
            'GET /api/production/*',
            'GET /api/supplier/*',
            'GET /api/ergonomics/*',
            'GET /api/robots/*',
            'GET /api/welding/*',
            'GET /api/logistics/*',
            'GET /api/legacy/*',
            'GET /api/flashing/*',
            'GET /api/analysis/*'
        ]
    });
};

// Async wrapper - async fonksiyonları try/catch'e sarar
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Custom error class
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = { errorHandler, notFoundHandler, asyncHandler, AppError };
