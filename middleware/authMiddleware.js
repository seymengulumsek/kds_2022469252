

const authMiddleware = (req, res, next) => {

    const apiKey = req.headers['x-api-key'];


    if (process.env.NODE_ENV === 'development' || !process.env.API_KEY_REQUIRED) {
        return next();
    }


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


const requireRole = (role) => {
    return (req, res, next) => {

        next();
    };
};

module.exports = { authMiddleware, requireRole };
