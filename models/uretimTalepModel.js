/**
 * Üretim Talep Model - Üretim ve talep verileri
 * mercedes_kds veritabanı şemasına uyumlu
 */
const BaseModel = require('./BaseModel');

class UretimTalepModel extends BaseModel {
    constructor() {
        super('uretim_talep', 'talep_id');
    }

    // Yıllık trend (ICE vs EV)
    async getTrendByYakitTipi() {
        return this.query(`
            SELECT 
                t.yil,
                m.guc_tipi,
                SUM(u.talep_miktari) AS toplam_talep,
                SUM(u.gerceklesen_miktar) AS toplam_uretim,
                ROUND(AVG(u.kapasite_kullanimi), 2) AS ort_kapasite
            FROM uretim_talep u
            JOIN model m ON u.model_id = m.model_id
            JOIN tarih t ON u.tarih_id = t.tarih_id
            GROUP BY t.yil, m.guc_tipi
            ORDER BY t.yil, m.guc_tipi
        `);
    }

    // Model bazlı trend
    async getTrendByModel(modelId) {
        return this.query(`
            SELECT t.yil, t.ay, u.talep_miktari, u.gerceklesen_miktar
            FROM uretim_talep u
            JOIN tarih t ON u.tarih_id = t.tarih_id
            WHERE u.model_id = ?
            ORDER BY t.yil, t.ay
        `, [modelId]);
    }

    // Son yıl verileri
    async getSonYil(yil = 2024) {
        return this.query(`
            SELECT u.*, m.model_adi, m.guc_tipi, t.yil, t.ay
            FROM uretim_talep u
            JOIN model m ON u.model_id = m.model_id
            JOIN tarih t ON u.tarih_id = t.tarih_id
            WHERE t.yil = ?
        `, [yil]);
    }

    // Kapasite kullanımı
    async getKapasiteKullanimi() {
        return this.query(`
            SELECT 
                t.yil,
                h.hat_kodu,
                SUM(u.gerceklesen_miktar) AS toplam_uretim,
                ROUND(AVG(u.kapasite_kullanimi), 2) AS kullanim_orani
            FROM uretim_talep u
            JOIN tarih t ON u.tarih_id = t.tarih_id
            JOIN hat h ON u.hat_id = h.hat_id
            GROUP BY t.yil, h.hat_kodu
            ORDER BY t.yil, h.hat_kodu
        `);
    }

    // Model bazlı üretim
    async getModelBazli(yil = 2025) {
        return this.query(`
            SELECT 
                m.model_kodu,
                m.model_adi,
                m.guc_tipi,
                SUM(u.gerceklesen_miktar) AS toplam_uretim
            FROM uretim_talep u
            JOIN model m ON u.model_id = m.model_id
            JOIN tarih t ON u.tarih_id = t.tarih_id
            WHERE t.yil = ?
            GROUP BY m.model_id
            ORDER BY toplam_uretim DESC
        `, [yil]);
    }

    // Hat bazlı üretim
    async getHatBazli(yil = 2025) {
        return this.query(`
            SELECT 
                h.hat_kodu,
                h.hat_adi,
                SUM(u.gerceklesen_miktar) AS toplam_uretim,
                ROUND(AVG(u.kapasite_kullanimi), 2) AS ort_kapasite
            FROM uretim_talep u
            JOIN hat h ON u.hat_id = h.hat_id
            JOIN tarih t ON u.tarih_id = t.tarih_id
            WHERE t.yil = ?
            GROUP BY h.hat_id
            ORDER BY h.hat_kodu
        `, [yil]);
    }

    // Yıllık karşılaştırma
    async getYillikKarsilastirma() {
        return this.query(`
            SELECT 
                t.yil,
                SUM(u.talep_miktari) AS toplam_talep,
                SUM(u.gerceklesen_miktar) AS toplam_uretim
            FROM uretim_talep u
            JOIN tarih t ON u.tarih_id = t.tarih_id
            GROUP BY t.yil
            ORDER BY t.yil
        `);
    }

    // Kapasite yeterlilik analizi
    async getKapasiteYeterlilik(yil = 2025) {
        return this.query(`
            SELECT 
                h.hat_kodu,
                h.hat_adi,
                h.kapasite AS max_kapasite,
                SUM(u.talep_miktari) AS talep,
                SUM(u.gerceklesen_miktar) AS uretim,
                (h.kapasite - SUM(u.talep_miktari)) AS kapasite_farki
            FROM uretim_talep u
            JOIN hat h ON u.hat_id = h.hat_id
            JOIN tarih t ON u.tarih_id = t.tarih_id
            WHERE t.yil = ?
            GROUP BY h.hat_id
            ORDER BY h.hat_kodu
        `, [yil]);
    }

    // Hat / Araç tipi dağılımı
    async getHatAracTipiDagilim(yil = 2025) {
        return this.query(`
            SELECT 
                h.hat_kodu,
                m.guc_tipi,
                SUM(u.gerceklesen_miktar) AS uretim,
                ROUND(SUM(u.gerceklesen_miktar) * 100.0 / 
                    (SELECT SUM(gerceklesen_miktar) FROM uretim_talep u2 
                     JOIN tarih t2 ON u2.tarih_id = t2.tarih_id 
                     WHERE t2.yil = ?), 2) AS yuzde
            FROM uretim_talep u
            JOIN hat h ON u.hat_id = h.hat_id
            JOIN model m ON u.model_id = m.model_id
            JOIN tarih t ON u.tarih_id = t.tarih_id
            WHERE t.yil = ?
            GROUP BY h.hat_id, m.guc_tipi
            ORDER BY h.hat_kodu, m.guc_tipi
        `, [yil, yil]);
    }

    // ===== YIL BAZLI DEĞİŞİM HESAPLAMA (Grafik altı özet için) =====
    // MySQL 5.7 uyumlu (LAG() yerine self-join kullanılıyor)

    // ICE ve EV ayrı ayrı trend özeti - MySQL 5.7 uyumlu
    async getGucTipiBazliTrendOzet(startYear, endYear) {
        return this.query(`
            SELECT 
                sub.guc_tipi,
                COUNT(*) AS yil_sayisi,
                ROUND(AVG(
                    CASE 
                        WHEN sub.onceki_uretim > 0 
                        THEN ((sub.toplam_uretim - sub.onceki_uretim) / sub.onceki_uretim) * 100 
                        ELSE NULL 
                    END
                ), 2) AS ort_yillik_uretim_degisim,
                ROUND(AVG(
                    CASE 
                        WHEN sub.onceki_talep > 0 
                        THEN ((sub.toplam_talep - sub.onceki_talep) / sub.onceki_talep) * 100 
                        ELSE NULL 
                    END
                ), 2) AS ort_yillik_talep_degisim
            FROM (
                SELECT 
                    curr.guc_tipi,
                    curr.yil,
                    curr.toplam_uretim,
                    curr.toplam_talep,
                    prev.toplam_uretim AS onceki_uretim,
                    prev.toplam_talep AS onceki_talep
                FROM (
                    SELECT 
                        m.guc_tipi,
                        t.yil,
                        SUM(u.gerceklesen_miktar) AS toplam_uretim,
                        SUM(u.talep_miktari) AS toplam_talep
                    FROM uretim_talep u
                    JOIN model m ON u.model_id = m.model_id
                    JOIN tarih t ON u.tarih_id = t.tarih_id
                    WHERE t.yil BETWEEN ? AND ?
                    GROUP BY m.guc_tipi, t.yil
                ) AS curr
                LEFT JOIN (
                    SELECT 
                        m.guc_tipi,
                        t.yil,
                        SUM(u.gerceklesen_miktar) AS toplam_uretim,
                        SUM(u.talep_miktari) AS toplam_talep
                    FROM uretim_talep u
                    JOIN model m ON u.model_id = m.model_id
                    JOIN tarih t ON u.tarih_id = t.tarih_id
                    WHERE t.yil BETWEEN ? AND ?
                    GROUP BY m.guc_tipi, t.yil
                ) AS prev ON curr.guc_tipi = prev.guc_tipi AND curr.yil = prev.yil + 1
            ) AS sub
            WHERE sub.onceki_uretim IS NOT NULL
            GROUP BY sub.guc_tipi
        `, [startYear, endYear, startYear, endYear]);
    }
}

module.exports = new UretimTalepModel();
