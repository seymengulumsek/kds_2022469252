/**
 * Auth Middleware - Kimlik Doğrulama
 * Şimdilik basit bir yapı, ileride JWT entegrasyonu yapılabilir
 */

const authMiddleware = (req, res, next) => {
    // Basit API key kontrolü (opsiyonel)
    const apiKey = req.headers['x-api-key'];

    // Geliştirme ortamında her zaman geçir
    if (process.env.NODE_ENV === 'development' || !process.env.API_KEY_REQUIRED) {
        return next();
    }

    // API key kontrolü gerekiyorsa
    if (process.env.API_KEY_REQUIRED === 'true') {
        if (!apiKey || apiKey !== process.env.API_KEY) {
            return res.status(401).json({
                success: false,
                error: 'Yetkisiz erişim',
                message: 'Geçerli bir API anahtarı gerekli'
            });
        }
    }

    next();
};

// Role-based access (ileride kullanılabilir)
const requireRole = (role) => {
    return (req, res, next) => {
        // Şimdilik hep geçir
        next();
    };
};

module.exports = { authMiddleware, requireRole };
