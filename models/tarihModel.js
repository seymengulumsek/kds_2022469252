
const BaseModel = require('./BaseModel');

class TarihModel extends BaseModel {
    constructor() {
        super('tarih', 'tarih_id');
    }

    async getByYil(yil) {
        return this.filter({ yil });
    }

    async getByYilAy(yil, ay) {
        return this.query('SELECT * FROM tarih WHERE yil = ? AND ay = ?', [yil, ay]);
    }

    async getYillar() {
        return this.query('SELECT DISTINCT yil FROM tarih ORDER BY yil');
    }
}

module.exports = new TarihModel();
