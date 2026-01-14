
const express = require('express');
const router = express.Router();
const TedarikciController = require('../controllers/tedarikciController');


router.get('/historical', TedarikciController.getHistorical);
router.post('/forecast', TedarikciController.getForecast);


router.get('/kalite', TedarikciController.getKaliteTrendi);
router.get('/maliyet', TedarikciController.getMaliyetTrendi);
router.get('/karsilastir', TedarikciController.getKarsilastirma);
router.get('/celik-endeks', TedarikciController.getCelikEndeks);
router.get('/son-durum', TedarikciController.getSonDurum);


router.get('/liste', TedarikciController.getListe);
router.get('/kalite-trendi/:id', TedarikciController.getKaliteTrendiById);
router.get('/ppm-trendi/:id', TedarikciController.getPPMTrendiById);
router.get('/servis-analizi/:id', TedarikciController.getServisAnaliziById);
router.get('/teslimat-gecikme/:id', TedarikciController.getTeslimatGecikmeById);
router.get('/ozet/:id', TedarikciController.getOzetById);

module.exports = router;
