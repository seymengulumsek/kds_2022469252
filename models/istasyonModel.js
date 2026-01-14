
const BaseModel = require('./BaseModel');

class IstasyonModel extends BaseModel {
    constructor() {
        super('istasyon', 'istasyon_id');
    }

    async getByHat(hatId) {
        return this.filter({ hat_id: hatId });
    }

    async getKritikIstasyonlar() {
        return this.query(`
            SELECT i.*, h.hat_adi
            FROM istasyon i
            JOIN hat h ON i.hat_id = h.hat_id
            WHERE i.risk_seviyesi IN ('YUKSEK', 'KRITIK')
            ORDER BY FIELD(i.risk_seviyesi, 'KRITIK', 'YUKSEK')
        `);
    }

    async getByRiskSeviyesi(seviye) {
        return this.filter({ risk_seviyesi: seviye });
    }
}

module.exports = new IstasyonModel();
