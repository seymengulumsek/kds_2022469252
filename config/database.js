/**
 * MySQL Database Configuration
 * WAMP Server Ayarları
 */

const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mercedes_kds',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ MySQL Bağlantısı Başarılı');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL Bağlantı Hatası:', error.message);
        return false;
    }
};

module.exports = {
    pool: promisePool,
    testConnection
};
