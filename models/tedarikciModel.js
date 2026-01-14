
const BaseModel = require('./BaseModel');

class TedarikciModel extends BaseModel {
    constructor() {
        super('tedarikci', 'tedarikci_id');
    }

    async getByKategori(kategori) {
        return this.filter({ kategori });
    }

    async getByUlke(ulke) {
        return this.filter({ ulke });
    }

    async getCelikTedarikçileri() {
        return this.filter({ kategori: 'Çelik' });
    }
}

module.exports = new TedarikciModel();
