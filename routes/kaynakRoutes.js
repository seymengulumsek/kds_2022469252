
const express = require('express');
const router = express.Router();
const KaynakController = require('../controllers/kaynakController');

router.get('/historical', KaynakController.getHistorical);
router.post('/forecast', KaynakController.getForecast);
router.get('/kalite', KaynakController.getKaliteTrendi);
router.get('/scrap', KaynakController.getScrapTrendi);
router.get('/sapma', KaynakController.getSapmaTrendi);
router.get('/robot-bazli', KaynakController.getRobotBazli);
router.get('/performans', KaynakController.getPerformansDagilim);
router.get('/robot-scrap-trendi', KaynakController.getRobotScrapTrendi);
router.post('/scrap-senaryo', KaynakController.getScrapSenaryo);
router.get('/robot-listesi', KaynakController.getRobotListesi);
router.get('/kazanim-senaryo', KaynakController.getScrapKazanimSenaryo);
router.get('/yatirim-matrisi', KaynakController.getYatirimMatrisi);
router.get('/zarar-tahmini', KaynakController.getScrapZararTahmini);
router.get('/bakim-yatirim-analiz', KaynakController.getBakimYatirimAnaliz);
router.get('/bakim-yatirim-maliyetler', KaynakController.getBakimYatirimMaliyetler);
router.get('/robot-bakim-gecmisi', KaynakController.getRobotBakimGecmisi);

module.exports = router;

