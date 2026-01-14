
const BaseModel = require('./BaseModel');

class TedarikciKaliteModel extends BaseModel {
    constructor() {
        super('tedarikci_kalite', 'kalite_id');
    }


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




    async getTedarikciListesi() {
        return this.query(`
            SELECT tedarikci_id, tedarikci_kodu, tedarikci_adi, ulke
            FROM tedarikci
            ORDER BY tedarikci_kodu
        `);
    }


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
