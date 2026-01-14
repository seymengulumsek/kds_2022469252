
const express = require('express');
const router = express.Router();
const LojistikController = require('../controllers/lojistikController');

router.get('/historical', LojistikController.getHistorical);
router.post('/forecast', LojistikController.getForecast);
router.get('/kaza', LojistikController.getKazaTrendi);
router.get('/bekleme', LojistikController.getBeklemeSuresi);
router.get('/maliyet', LojistikController.getMaliyetKarsilastirma);
router.get('/tip-dagilim', LojistikController.getTipDagilim);
router.get('/yillik', LojistikController.getYillikTrend);


router.get('/yillik-trend', LojistikController.getYillikTrend);
router.get('/tasima-tip-dagilim', LojistikController.getTipDagilim);
router.get('/agv-karsilastirma', LojistikController.getAgvKazancAnalizi);


router.get('/agv-kazanc', LojistikController.getAgvKazancAnalizi);


router.post('/senaryo', LojistikController.getSenaryo);

module.exports = router;


