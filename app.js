/**
 * Mercedes-Benz Karar Destek Sistemi (KDS)
 * Ana Uygulama Dosyası - Express Server
 * v3.0 - 3NF Veritabanı Yapısı
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Database Config
const db = require('./config/database');

// Middleware
const {
    errorHandler,
    notFoundHandler,
    sanitizeParams
} = require('./middleware');

// Routes - Yeni 3NF yapısına göre (Merkezi Router)
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(sanitizeParams);

// Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

// ===== API ROUTES (3NF) =====
// Tüm API istekleri routes/index.js üzerinden yönetilir
app.use('/api', apiRoutes);

// ===== PAGE ROUTES =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'pages', 'dashboard.html'));
});

app.get('/production', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'pages', 'production.html'));
});

app.get('/supplier', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'pages', 'supplier.html'));
});

app.get('/welding', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'pages', 'welding.html'));
});

app.get('/logistics', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'pages', 'logistics.html'));
});

// ===== HEALTH CHECK =====
app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = await db.testConnection();
        res.json({
            success: true,
            status: 'OK',
            database: dbStatus ? 'Bağlı' : 'Bağlantı yok',
            version: '3.0',
            architecture: '3NF OLTP',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            success: false,
            status: 'ERROR',
            database: 'Bağlantı hatası',
            error: error.message
        });
    }
});

// ===== ERROR HANDLING =====
app.use(notFoundHandler);
app.use(errorHandler);

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log('server başladı port:${PORT}');

});

module.exports = app;
