/**
 * Hat Model - Üretim hattı tablosu işlemleri
 */
const BaseModel = require('./BaseModel');

class HatModel extends BaseModel {
    constructor() {
        super('hat', 'hat_id');
    }

    async getElektrikUyumlu() {
        return this.filter({ elektrik_uyum: true });
    }

    async getByTip(hatTipi) {
        return this.filter({ hat_tipi: hatTipi });
    }

    async getKapasiteler() {
        return this.query(`
            SELECT hat_id, hat_adi, kapasite_gun, elektrik_uyum
            FROM hat
            ORDER BY hat_adi
        `);
    }
}

module.exports = new HatModel();
