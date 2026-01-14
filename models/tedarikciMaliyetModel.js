
const BaseModel = require('./BaseModel');

class TedarikciMaliyetModel extends BaseModel {
    constructor() {
        super('tedarikci_maliyet', 'maliyet_id');
    }


    async getTrend() {
        return this.query(`
            SELECT 
                t.yil,
                td.tedarikci_adi,
                AVG(m.birim_fiyat) AS ort_fiyat,
                AVG(m.celik_fiyat_endeksi) AS ort_endeks
            FROM tedarikci_maliyet m
            JOIN tedarikci td ON m.tedarikci_id = td.tedarikci_id
            JOIN tarih t ON m.tarih_id = t.tarih_id
            GROUP BY t.yil, td.tedarikci_id
            ORDER BY t.yil, td.tedarikci_adi
        `);
    }


    async getFiyatKarsilastirma(yil = 2024) {
        return this.query(`
            SELECT 
                td.tedarikci_adi,
                m.birim_fiyat,
                m.celik_fiyat_endeksi
            FROM tedarikci_maliyet m
            JOIN tedarikci td ON m.tedarikci_id = td.tedarikci_id
            JOIN tarih t ON m.tarih_id = t.tarih_id
            WHERE t.yil = ? AND td.kategori = 'Çelik'
            ORDER BY m.birim_fiyat
        `, [yil]);
    }


    async getCelikEndeksTrendi() {
        return this.query(`
            SELECT t.yil, t.ay, AVG(m.celik_fiyat_endeksi) AS endeks
            FROM tedarikci_maliyet m
            JOIN tarih t ON m.tarih_id = t.tarih_id
            GROUP BY t.yil, t.ay
            ORDER BY t.yil, t.ay
        `);
    }
}

module.exports = new TedarikciMaliyetModel();
