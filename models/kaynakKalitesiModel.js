/**
 * Kaynak Kalitesi Model - Kaynak kalitesi verileri
 * Veritabanı şemasına tam uyumlu: olcum_degeri, sapma_orani, scrap_orani
 */
const BaseModel = require('./BaseModel');

class KaynakKalitesiModel extends BaseModel {
    constructor() {
        super('kaynak_kalitesi', 'kaynak_id');
    }

    // Kalite trendi
    async getTrend() {
        return this.query(`
            SELECT 
                t.yil,
                r.robot_kodu,
                AVG(k.sapma_orani) AS ort_sapma,
                AVG(k.scrap_orani) AS ort_scrap,
                AVG(k.olcum_degeri) AS ort_olcum
            FROM kaynak_kalitesi k
            JOIN robot r ON k.robot_id = r.robot_id
            JOIN tarih t ON k.tarih_id = t.tarih_id
            GROUP BY t.yil, r.robot_id
            ORDER BY t.yil, r.robot_kodu
        `);
    }

    // Scrap trendi
    async getScrapTrend() {
        return this.query(`
            SELECT 
                t.yil,
                AVG(k.scrap_orani) AS ort_scrap
            FROM kaynak_kalitesi k
            JOIN tarih t ON k.tarih_id = t.tarih_id
            GROUP BY t.yil
            ORDER BY t.yil
        `);
    }

    // Sapma trendi
    async getSapmaTrend() {
        return this.query(`
            SELECT 
                t.yil,
                AVG(k.sapma_orani) AS ort_sapma
            FROM kaynak_kalitesi k
            JOIN tarih t ON k.tarih_id = t.tarih_id
            GROUP BY t.yil
            ORDER BY t.yil
        `);
    }

    // Robot bazlı
    async getRobotBazli() {
        return this.query(`
            SELECT 
                r.robot_kodu,
                AVG(k.olcum_degeri) AS ort_olcum,
                AVG(k.sapma_orani) AS ort_sapma,
                AVG(k.scrap_orani) AS ort_scrap
            FROM kaynak_kalitesi k
            JOIN robot r ON k.robot_id = r.robot_id
            GROUP BY r.robot_id
            ORDER BY r.robot_kodu
        `);
    }

    // Performans dağılımı
    async getPerformansDagilim(yil = 2025) {
        return this.query(`
            SELECT 
                r.robot_kodu,
                AVG(k.olcum_degeri) AS ort_kalite
            FROM kaynak_kalitesi k
            JOIN robot r ON k.robot_id = r.robot_id
            JOIN tarih t ON k.tarih_id = t.tarih_id
            WHERE t.yil = ?
            GROUP BY r.robot_id
        `, [yil]);
    }

    // Robot bazlı scrap trendi - Çoklu çizgi grafik için
    // SCRAP ORANI DEĞERLERİ (0.25%, 0.20% gibi)
    async getRobotScrapTrendi(startYear = 2016, endYear = 2025) {
        return this.query(`
            SELECT 
                t.yil,
                r.robot_id,
                r.robot_kodu,
                AVG(k.scrap_orani) AS ort_scrap_orani
            FROM kaynak_kalitesi k
            JOIN robot r ON k.robot_id = r.robot_id
            JOIN tarih t ON k.tarih_id = t.tarih_id
            WHERE t.yil BETWEEN ? AND ?
            GROUP BY t.yil, r.robot_id
            ORDER BY r.robot_kodu, t.yil
        `, [startYear, endYear]);
    }

    // Robot listesi (senaryo için)
    async getRobotListesi() {
        return this.query(`
            SELECT DISTINCT 
                r.robot_id,
                r.robot_kodu
            FROM kaynak_kalitesi k
            JOIN robot r ON k.robot_id = r.robot_id
            ORDER BY r.robot_kodu
        `);
    }

    // Son yıl scrap ortalamaları (senaryo baz değeri)
    async getSonYilScrap() {
        return this.query(`
            SELECT 
                r.robot_id,
                r.robot_kodu,
                AVG(k.scrap_orani) AS son_scrap
            FROM kaynak_kalitesi k
            JOIN robot r ON k.robot_id = r.robot_id
            JOIN tarih t ON k.tarih_id = t.tarih_id
            WHERE t.yil = (SELECT MAX(yil) FROM tarih)
            GROUP BY r.robot_id
            ORDER BY r.robot_kodu
        `);
    }

    // Robot bazlı yıllık toplam scrap maliyeti (kazanım senaryosu için)
    async getRobotScrapMaliyeti() {
        return this.query(`
            SELECT 
                r.robot_id,
                r.robot_kodu,
                SUM(k.scrap_maliyeti) AS toplam_maliyet
            FROM kaynak_kalitesi k
            JOIN robot r ON k.robot_id = r.robot_id
            JOIN tarih t ON k.tarih_id = t.tarih_id
            WHERE t.yil = (SELECT MAX(yil) FROM tarih)
            GROUP BY r.robot_id
            ORDER BY r.robot_kodu
        `);
    }

    // Robot bazlı scrap artış hızı ve maliyet (yatırım matrisi için)
    async getRobotYatirimMatrisi(startYear = 2016, endYear = 2025) {
        return this.query(`
            SELECT 
                r.robot_id,
                r.robot_kodu,
                t.yil,
                SUM(k.scrap_adet) AS toplam_scrap,
                SUM(k.scrap_maliyeti) AS toplam_maliyet
            FROM kaynak_kalitesi k
            JOIN robot r ON k.robot_id = r.robot_id
            JOIN tarih t ON k.tarih_id = t.tarih_id
            WHERE t.yil BETWEEN ? AND ?
            GROUP BY r.robot_id, t.yil
            ORDER BY r.robot_kodu, t.yil
        `, [startYear, endYear]);
    }

    // Önümüzdeki yıl scrap kaynaklı zarar tahmini için veri
    async getSonYilScrapDetay() {
        return this.query(`
            SELECT 
                r.robot_id,
                r.robot_kodu,
                SUM(k.scrap_adet) AS mevcut_scrap_adet,
                SUM(k.scrap_maliyeti) AS mevcut_toplam_maliyet,
                ROUND(SUM(k.scrap_maliyeti) / NULLIF(SUM(k.scrap_adet), 0), 2) AS birim_maliyet
            FROM kaynak_kalitesi k
            JOIN robot r ON k.robot_id = r.robot_id
            JOIN tarih t ON k.tarih_id = t.tarih_id
            WHERE t.yil = (SELECT MAX(yil) FROM tarih)
            GROUP BY r.robot_id
            ORDER BY r.robot_kodu
        `);
    }

    // Robot bazlı bakım maliyetleri (robot_bakim tablosundan)
    async getRobotBakimMaliyetleri() {
        return this.query(`
            SELECT 
                r.robot_id,
                r.robot_kodu,
                SUM(b.maliyet) AS toplam_bakim_maliyeti,
                AVG(b.maliyet) AS ort_bakim_maliyeti,
                SUM(b.ariza_sayisi) AS toplam_ariza,
                SUM(b.bakim_suresi) AS toplam_bakim_suresi
            FROM robot_bakim b
            JOIN robot r ON b.robot_id = r.robot_id
            JOIN tarih t ON b.tarih_id = t.tarih_id
            WHERE t.yil = (SELECT MAX(yil) FROM tarih)
            GROUP BY r.robot_id
            ORDER BY r.robot_kodu
        `);
    }

    // Robot bazlı beklenen iyileşme oranları (scrap azalma trendi analizi)
    async getRobotIyilesmeVerisi() {
        return this.query(`
            SELECT 
                r.robot_id,
                r.robot_kodu,
                -- Son yıl scrap
                SUM(CASE WHEN t.yil = (SELECT MAX(yil) FROM tarih) THEN k.scrap_adet ELSE 0 END) AS son_yil_scrap,
                -- Önceki yıl scrap
                SUM(CASE WHEN t.yil = (SELECT MAX(yil) - 1 FROM tarih) THEN k.scrap_adet ELSE 0 END) AS onceki_yil_scrap,
                -- Yıllık toplam scrap maliyeti
                SUM(CASE WHEN t.yil = (SELECT MAX(yil) FROM tarih) THEN k.scrap_maliyeti ELSE 0 END) AS yillik_scrap_maliyeti
            FROM kaynak_kalitesi k
            JOIN robot r ON k.robot_id = r.robot_id
            JOIN tarih t ON k.tarih_id = t.tarih_id
            GROUP BY r.robot_id
            ORDER BY r.robot_kodu
        `);
    }

    // Robot bazlı yatırım maliyeti tahmini (bakım maliyetinin 4-6 katı olarak hesaplanır)
    async getRobotYatirimMaliyetleri() {
        return this.query(`
            SELECT 
                r.robot_id,
                r.robot_kodu,
                SUM(b.maliyet) AS toplam_bakim_maliyeti,
                ROUND(SUM(b.maliyet) * 5, 0) AS tahmini_yatirim_maliyeti,
                SUM(b.ariza_sayisi) AS toplam_ariza
            FROM robot_bakim b
            JOIN robot r ON b.robot_id = r.robot_id
            JOIN tarih t ON b.tarih_id = t.tarih_id
            WHERE t.yil BETWEEN (SELECT MAX(yil) - 2 FROM tarih) AND (SELECT MAX(yil) FROM tarih)
            GROUP BY r.robot_id
            ORDER BY r.robot_kodu
        `);
    }

    // Tam bakım/yatırım analiz verisi (frontend için tek endpoint)
    async getBakimYatirimAnaliz() {
        return this.query(`
            SELECT 
                r.robot_id,
                r.robot_kodu,
                -- Bakım verileri
                COALESCE(SUM(b.maliyet), 0) AS bakim_maliyeti,
                COALESCE(AVG(b.maliyet), 0) AS ort_bakim_maliyeti,
                COALESCE(SUM(b.ariza_sayisi), 0) AS ariza_sayisi,
                -- Yatırım tahmini (bakım maliyetinin 5 katı)
                ROUND(COALESCE(SUM(b.maliyet), 0) * 5, 0) AS yatirim_maliyeti,
                -- Scrap verileri
                COALESCE(SUM(k.scrap_adet), 0) AS yillik_scrap_adet,
                COALESCE(SUM(k.scrap_maliyeti), 0) AS yillik_scrap_maliyeti,
                -- Bakım sonrası beklenen iyileşme (Bakım sayısına göre)
                -- K-20: %25
                -- K-14: %15
                -- Diğerleri: >= 2 Bakım yapıldıysa %10, aksi halde %25
                CASE 
                    WHEN r.robot_kodu = 'K-20' THEN 25
                    WHEN r.robot_kodu = 'K-14' THEN 15
                    WHEN COUNT(b.bakim_id) >= 2 THEN 10
                    ELSE 25
                END AS bakim_iyilesme_orani,

                -- Yatırım sonrası beklenen iyileşme
                -- K-20: %35
                -- Diğerleri: %40
                CASE 
                    WHEN r.robot_kodu = 'K-20' THEN 35
                    ELSE 40
                END AS yatirim_iyilesme_orani
            FROM robot r
            LEFT JOIN robot_bakim b ON r.robot_id = b.robot_id
            LEFT JOIN tarih tb ON b.tarih_id = tb.tarih_id AND tb.yil = (SELECT MAX(yil) FROM tarih)
            LEFT JOIN kaynak_kalitesi k ON r.robot_id = k.robot_id
            LEFT JOIN tarih tk ON k.tarih_id = tk.tarih_id AND tk.yil = (SELECT MAX(yil) FROM tarih)
            WHERE r.robot_tipi = 'Kaynak'
            GROUP BY r.robot_id
            ORDER BY r.robot_kodu
        `);
    }
}

module.exports = new KaynakKalitesiModel();
