const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const db = require('./config/database');


const {
    errorHandler,
    notFoundHandler,
    sanitizeParams
} = require('./middleware');



const app = express();
const PORT = process.env.PORT || 3000;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(sanitizeParams);


app.use(express.static(path.join(__dirname, 'public')));




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


app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = await db.testConnection();
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


app.use(notFoundHandler);
app.use(errorHandler);


app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
