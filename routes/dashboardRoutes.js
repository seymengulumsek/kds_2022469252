
const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');


router.get('/overview', DashboardController.getOverview);


router.get('/saglik-haritasi', DashboardController.getSaglikHaritasi);


router.get('/kayip-ekonomisi', DashboardController.getKayipEkonomisi);


router.get('/kayip-kaynak', DashboardController.getKayipKaynak);


router.get('/kritik-noktalar', DashboardController.getKritikNoktalar);


router.get('/veri-guveni', DashboardController.getVeriGuveni);


router.get('/hedef-gerceklesen', DashboardController.getHedefGerceklesen);


router.get('/trend', DashboardController.getTrend);
router.get('/kayip-dagilim', DashboardController.getKayipDagilim);
router.get('/veri-guncellik', DashboardController.getVeriGuncellik);
router.get('/hedef-tahmin', DashboardController.getHedefTahmin);

module.exports = router;
