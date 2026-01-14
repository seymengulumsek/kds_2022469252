/**
 * Model Index - Tüm modelleri export eder
 */

module.exports = {
    // Temel tablolar
    tarih: require('./tarihModel'),
    model: require('./modelModel'),
    hat: require('./hatModel'),
    istasyon: require('./istasyonModel'),
    tedarikci: require('./tedarikciModel'),
    robot: require('./robotModel'),

    // Ölçüm tabloları
    uretimTalep: require('./uretimTalepModel'),
    tedarikciKalite: require('./tedarikciKaliteModel'),
    tedarikciMaliyet: require('./tedarikciMaliyetModel'),
    robotBakim: require('./robotBakimModel'),
    kaynakKalitesi: require('./kaynakKalitesiModel'),
    intralojistik: require('./intralojistikModel')
};
