/**
 * Robot Model - Robot tablosu işlemleri
 */
const BaseModel = require('./BaseModel');

class RobotModel extends BaseModel {
    constructor() {
        super('robot', 'robot_id');
    }

    async getByHat(hatId) {
        return this.filter({ hat_id: hatId });
    }

    async getByTip(robotTipi) {
        return this.filter({ robot_tipi: robotTipi });
    }

    async getEskiRobotlar(yil = 2018) {
        return this.query('SELECT * FROM robot WHERE kurulum_yili < ?', [yil]);
    }

    async getYeniRobotlar(yil = 2018) {
        return this.query('SELECT * FROM robot WHERE kurulum_yili >= ?', [yil]);
    }

    async getKaynakRobotlari() {
        return this.filter({ robot_tipi: 'KAYNAK' });
    }
}

module.exports = new RobotModel();
