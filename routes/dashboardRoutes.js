/**
 * Dashboard Routes - Gelişmiş Kurumsal Panel v2
 */
const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');

// YÖNETİCİ ÖZET ŞERİDİ
router.get('/overview', DashboardController.getOverview);

// OPERASYON SAĞLIK HARİTASI
router.get('/saglik-haritasi', DashboardController.getSaglikHaritasi);

// KAYIP EKONOMİSİ PANELİ
router.get('/kayip-ekonomisi', DashboardController.getKayipEkonomisi);

// KAYIP KAYNAĞI DERİNLİĞİ
router.get('/kayip-kaynak', DashboardController.getKayipKaynak);

// KRİTİK NOKTA LİSTESİ
router.get('/kritik-noktalar', DashboardController.getKritikNoktalar);

// VERİ GÜVENİ PANELİ
router.get('/veri-guveni', DashboardController.getVeriGuveni);

// HEDEF – GERÇEKLEŞEN – GELECEK
router.get('/hedef-gerceklesen', DashboardController.getHedefGerceklesen);

// Eski endpoint uyumluluk
router.get('/trend', DashboardController.getTrend);
router.get('/kayip-dagilim', DashboardController.getKayipDagilim);
router.get('/veri-guncellik', DashboardController.getVeriGuncellik);
router.get('/hedef-tahmin', DashboardController.getHedefTahmin);

module.exports = router;
