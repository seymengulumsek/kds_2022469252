
const BaseModel = require('./BaseModel');

class RobotBakimModel extends BaseModel {
    constructor() {
        super('robot_bakim', 'bakim_id');
    }


    async getTrend(robotTipi = null) {
        let sql = `
            SELECT 
                t.yil,
                r.robot_kodu,
                r.robot_tipi,
                SUM(b.maliyet) AS toplam_maliyet,
                SUM(b.ariza_sayisi) AS toplam_ariza
            FROM robot_bakim b
            JOIN robot r ON b.robot_id = r.robot_id
            JOIN tarih t ON b.tarih_id = t.tarih_id
        `;

        const params = [];
        if (robotTipi && robotTipi !== 'all') {
            sql += ` WHERE r.robot_tipi = ?`;
            params.push(robotTipi);
        }

        sql += ` GROUP BY t.yil, r.robot_id ORDER BY t.yil, r.robot_kodu`;
        return this.query(sql, params);
    }


    async karsilastir(robotTipi = null) {
        let sql = `
            SELECT 
                r.robot_kodu,
                r.robot_tipi,
                AVG(b.maliyet) AS ort_maliyet,
                SUM(b.ariza_sayisi) AS toplam_ariza
            FROM robot_bakim b
            JOIN robot r ON b.robot_id = r.robot_id
        `;

        const params = [];
        if (robotTipi && robotTipi !== 'all') {
            sql += ` WHERE r.robot_tipi = ?`;
            params.push(robotTipi);
        }

        sql += ` GROUP BY r.robot_id ORDER BY ort_maliyet DESC`;
        return this.query(sql, params);
    }


    async getArizaTrend(robotTipi = null) {
        let sql = `
            SELECT 
                t.yil,
                SUM(b.ariza_sayisi) AS toplam_ariza
            FROM robot_bakim b
            JOIN robot r ON b.robot_id = r.robot_id
            JOIN tarih t ON b.tarih_id = t.tarih_id
        `;

        const params = [];
        if (robotTipi && robotTipi !== 'all') {
            sql += ` WHERE r.robot_tipi = ?`;
            params.push(robotTipi);
        }

        sql += ` GROUP BY t.yil ORDER BY t.yil`;
        return this.query(sql, params);
    }


    async getTipDagilim() {
        return this.query(`
            SELECT 
                r.robot_tipi,
                COUNT(DISTINCT r.robot_id) AS adet
            FROM robot r
            GROUP BY r.robot_tipi
        `);
    }


    async getMaliyetYillik(robotTipi = null) {
        let sql = `
            SELECT 
                t.yil,
                SUM(b.maliyet) AS toplam_maliyet
            FROM robot_bakim b
            JOIN robot r ON b.robot_id = r.robot_id
            JOIN tarih t ON b.tarih_id = t.tarih_id
        `;

        const params = [];
        if (robotTipi && robotTipi !== 'all') {
            sql += ` WHERE r.robot_tipi = ?`;
            params.push(robotTipi);
        }

        sql += ` GROUP BY t.yil ORDER BY t.yil`;
        return this.query(sql, params);
    }

    async getBakimGecmisi(robotTipi = null) {
        let sql = `
            SELECT DISTINCT
                r.robot_kodu,
                t.yil
            FROM robot_bakim b
            JOIN robot r ON b.robot_id = r.robot_id
            JOIN tarih t ON b.tarih_id = t.tarih_id
        `;

        const params = [];
        if (robotTipi) {
            sql += ` WHERE r.robot_tipi = ?`;
            params.push(robotTipi);
        }

        sql += ` ORDER BY r.robot_kodu ASC, t.yil DESC`;
        return this.query(sql, params);
    }
}

module.exports = new RobotBakimModel();
