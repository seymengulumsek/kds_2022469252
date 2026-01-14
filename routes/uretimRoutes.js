/**
 * Üretim Routes - Historical + Forecast
 */
const express = require('express');
const router = express.Router();
const UretimController = require('../controllers/uretimController');

// Historical & Forecast
router.get('/historical', UretimController.getHistorical);
router.post('/forecast', UretimController.getForecast);

// Legacy endpoints
router.get('/trend', UretimController.getTrend);
router.get('/kapasite', UretimController.getKapasite);
router.get('/son', UretimController.getSonYil);
router.get('/model-bazli', UretimController.getModelBazli);
router.get('/hat-bazli', UretimController.getHatBazli);
router.get('/yillik-karsilastirma', UretimController.getYillikKarsilastirma);

// Yeni endpoint'ler
router.get('/kapasite-yeterlilik', UretimController.getKapasiteYeterlilik);
router.get('/hat-arac-dagilim', UretimController.getHatAracDagilim);
router.get('/trend-ozet', UretimController.getTrendOzet);
router.get('/yil-listesi', UretimController.getYilListesi);

module.exports = router;
