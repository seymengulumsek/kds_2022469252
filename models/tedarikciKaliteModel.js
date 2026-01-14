/**
 * Tedarikçi Kalite Model - Kalite metrikleri
 * Veritabanı şemasına tam uyumlu
 */
const BaseModel = require('./BaseModel');

class TedarikciKaliteModel extends BaseModel {
    constructor() {
        super('tedarikci_kalite', 'kalite_id');
    }

    // Yıllık kalite trendi
    async getTrend() {
        return this.query(`
            SELECT 
                t.yil,
                td.tedarikci_kodu,
                td.tedarikci_adi,
                AVG(k.kalite_skoru) AS ort_kalite,
                AVG(k.ppm_orani) AS ort_ppm,
                AVG(k.teslimat_suresi) AS ort_teslimat
            FROM tedarikci_kalite k
            JOIN tedarikci td ON k.tedarikci_id = td.tedarikci_id
            JOIN tarih t ON k.tarih_id = t.tarih_id
            GROUP BY t.yil, td.tedarikci_id
            ORDER BY t.yil, td.tedarikci_adi
        `);
    }

    // PPM trendi
    async getPPMTrend() {
        return this.query(`
            SELECT 
                t.yil,
                AVG(k.ppm_orani) AS ort_ppm
            FROM tedarikci_kalite k
            JOIN tarih t ON k.tarih_id = t.tarih_id
            GROUP BY t.yil
            ORDER BY t.yil
        `);
    }

    // Teslimat trendi
    async getTeslimatTrend() {
        return this.query(`
            SELECT 
                td.tedarikci_kodu,
                AVG(k.teslimat_suresi) AS ort_teslimat
            FROM tedarikci_kalite k
            JOIN tedarikci td ON k.tedarikci_id = td.tedarikci_id
            GROUP BY td.tedarikci_id
            ORDER BY ort_teslimat
        `);
    }

    // Dağılım
    async getDagilim(yil = 2025) {
        return this.query(`
            SELECT 
                td.tedarikci_kodu,
                AVG(k.kalite_skoru) AS ort_kalite
            FROM tedarikci_kalite k
            JOIN tedarikci td ON k.tedarikci_id = td.tedarikci_id
            JOIN tarih t ON k.tarih_id = t.tarih_id
            WHERE t.yil = ?
            GROUP BY td.tedarikci_id
        `, [yil]);
    }

    // Karşılaştırma
    async karsilastir(t1, t2) {
        return this.query(`
            SELECT 
                t.yil,
                td.tedarikci_kodu,
                AVG(k.kalite_skoru) AS ort_kalite
            FROM tedarikci_kalite k
            JOIN tedarikci td ON k.tedarikci_id = td.tedarikci_id
            JOIN tarih t ON k.tarih_id = t.tarih_id
            WHERE td.tedarikci_kodu IN (?, ?)
            GROUP BY t.yil, td.tedarikci_id
            ORDER BY t.yil
        `, [t1, t2]);
    }

    // Kategori bazlı
    async getByKategori(kategori) {
        return this.query(`
            SELECT 
                t.yil,
                td.tedarikci_kodu,
                td.tedarikci_adi,
                AVG(k.kalite_skoru) AS ort_kalite,
                AVG(k.ppm_orani) AS ort_ppm
            FROM tedarikci_kalite k
            JOIN tedarikci td ON k.tedarikci_id = td.tedarikci_id
            JOIN tarih t ON k.tarih_id = t.tarih_id
            GROUP BY t.yil, td.tedarikci_id
            ORDER BY t.yil, td.tedarikci_adi
        `);
    }

    // Son durum
    async getSonDurum(yil = 2025) {
        return this.query(`
            SELECT 
                td.tedarikci_kodu,
                td.tedarikci_adi, 
                AVG(k.kalite_skoru) AS kalite_skoru, 
                AVG(k.ppm_orani) AS ppm_orani, 
                AVG(k.teslimat_suresi) AS teslimat_suresi
            FROM tedarikci_kalite k
            JOIN tedarikci td ON k.tedarikci_id = td.tedarikci_id
            JOIN tarih t ON k.tarih_id = t.tarih_id
            WHERE t.yil = ?
            GROUP BY td.tedarikci_id
            ORDER BY kalite_skoru DESC
        `, [yil]);
    }

    // ===== TEK TEDARİKÇİ BAZLI SORGULAR =====

    // Tedarikçi listesi (dropdown için)
    async getTedarikciListesi() {
        return this.query(`
            SELECT tedarikci_id, tedarikci_kodu, tedarikci_adi, ulke
            FROM tedarikci
            ORDER BY tedarikci_kodu
        `);
    }

    // Tek tedarikçi kalite trendi + ortalama değişim
    async getKaliteTrendiByTedarikci(tedarikciId, startYear = 2016, endYear = 2025) {
        return this.query(`
            SELECT 
                t.yil,
                ROUND(AVG(k.kalite_skoru), 2) AS kalite_skoru
            FROM tedarikci_kalite k
            JOIN tarih t ON k.tarih_id = t.tarih_id
            WHERE k.tedarikci_id = ? AND t.yil BETWEEN ? AND ?
            GROUP BY t.yil
            ORDER BY t.yil
        `, [tedarikciId, startYear, endYear]);
    }

    // Tek tedarikçi PPM trendi
    async getPPMTrendiByTedarikci(tedarikciId, startYear = 2016, endYear = 2025) {
        return this.query(`
            SELECT 
                t.yil,
                ROUND(AVG(k.ppm_orani), 2) AS ppm_orani
            FROM tedarikci_kalite k
            JOIN tarih t ON k.tarih_id = t.tarih_id
            WHERE k.tedarikci_id = ? AND t.yil BETWEEN ? AND ?
            GROUP BY t.yil
            ORDER BY t.yil
        `, [tedarikciId, startYear, endYear]);
    }

    // Tek tedarikçi servis/garanti analizi
    async getServisAnaliziByTedarikci(tedarikciId, startYear = 2016, endYear = 2025) {
        return this.query(`
            SELECT 
                t.yil,
                s.garanti_durumu,
                SUM(s.ariza_sayisi) AS toplam_ariza,
                SUM(s.servis_maliyeti) AS toplam_maliyet
            FROM servis_kayitlari s
            JOIN tarih t ON s.tarih_id = t.tarih_id
            WHERE s.tedarikci_id = ? AND t.yil BETWEEN ? AND ?
            GROUP BY t.yil, s.garanti_durumu
            ORDER BY t.yil, s.garanti_durumu
        `, [tedarikciId, startYear, endYear]);
    }

    // Tek tedarikçi teslimat gecikme analizi
    async getTeslimatGecikmeByTedarikci(tedarikciId, startYear = 2016, endYear = 2025) {
        return this.query(`
            SELECT 
                t.yil,
                ROUND(AVG(k.planlanan_teslimat_suresi), 2) AS planlanan_sure,
                ROUND(AVG(k.teslimat_suresi), 2) AS gerceklesen_sure,
                ROUND(AVG(k.teslimat_suresi - k.planlanan_teslimat_suresi), 2) AS gecikme
            FROM tedarikci_kalite k
            JOIN tarih t ON k.tarih_id = t.tarih_id
            WHERE k.tedarikci_id = ? AND t.yil BETWEEN ? AND ?
            GROUP BY t.yil
            ORDER BY t.yil
        `, [tedarikciId, startYear, endYear]);
    }

    // Tek tedarikçi özet (KPI için)
    async getTedarikciOzet(tedarikciId, yil = 2025) {
        return this.query(`
            SELECT 
                td.tedarikci_kodu,
                td.tedarikci_adi,
                ROUND(AVG(k.kalite_skoru), 2) AS ort_kalite,
                ROUND(AVG(k.ppm_orani), 2) AS ort_ppm,
                ROUND(AVG(k.teslimat_suresi), 2) AS ort_teslimat,
                ROUND(AVG(k.teslimat_suresi - k.planlanan_teslimat_suresi), 2) AS ort_gecikme
            FROM tedarikci_kalite k
            JOIN tedarikci td ON k.tedarikci_id = td.tedarikci_id
            JOIN tarih t ON k.tarih_id = t.tarih_id
            WHERE k.tedarikci_id = ? AND t.yil = ?
            GROUP BY td.tedarikci_id
        `, [tedarikciId, yil]);
    }
}

module.exports = new TedarikciKaliteModel();
