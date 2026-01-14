/**
 * Model Model - Araç model tablosu işlemleri
 */
const BaseModel = require('./BaseModel');

class ModelModel extends BaseModel {
    constructor() {
        super('model', 'model_id');
    }

    async getByYakitTipi(yakitTipi) {
        return this.filter({ yakit_tipi: yakitTipi });
    }

    async getAktifModeller() {
        return this.filter({ aktif: true });
    }

    async getBySegment(segment) {
        return this.filter({ segment });
    }
}

module.exports = new ModelModel();
