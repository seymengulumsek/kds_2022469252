
const models = require('../models');
const { asyncHandler } = require('../middleware');
const { createResponse, createEmptyResponse } = require('../utils/responseHelper');
const ForecastHelper = require('../utils/forecastHelper');

const KaynakController = {
    getHistorical: asyncHandler(async (req, res) => {
        const startYear = parseInt(req.query.startYear) || 2016;
        const endYear = parseInt(req.query.endYear) || 2025;

        let data = await models.kaynakKalitesi.getTrend();
        data = data.filter(d => d.yil >= startYear && d.yil <= endYear);

        res.json({ success: true, data, meta: ForecastHelper.createMeta(data.length, 0, { startYear, endYear }) });
    }),

    getForecast: asyncHandler(async (req, res) => {
        const { months = 12, scrapChangePercent = 5 } = req.body;

        const latestData = await models.kaynakKalitesi.getScrapTrend();
        const lastYear = Math.max(...latestData.map(d => d.yil));
        const lastData = latestData.find(d => d.yil === lastYear);

        const scrapBase = parseFloat(lastData?.ort_scrap || 0.005);
        const scrapForecast = ForecastHelper.compound(scrapBase, scrapChangePercent, months);

        res.json({ success: true, data: { baseYear: lastYear, scrapBase, scrap: scrapForecast }, meta: ForecastHelper.createMeta(latestData.length, months, { scrapChangePercent, months }) });
    }),

    getKaliteTrendi: asyncHandler(async (req, res) => {
        const data = await models.kaynakKalitesi.getTrend();
        if (!data?.length) return res.json(createEmptyResponse(['kaynak_kalitesi']));
        res.json(createResponse(data, ['kaynak_kalitesi', 'robot', 'tarih']));
    }),

    getScrapTrendi: asyncHandler(async (req, res) => {
        const data = await models.kaynakKalitesi.getScrapTrend();
        if (!data?.length) return res.json(createEmptyResponse(['kaynak_kalitesi']));
        res.json(createResponse(data, ['kaynak_kalitesi', 'tarih']));
    }),

    getSapmaTrendi: asyncHandler(async (req, res) => {
        const data = await models.kaynakKalitesi.getSapmaTrend();
        if (!data?.length) return res.json(createEmptyResponse(['kaynak_kalitesi']));
        res.json(createResponse(data, ['kaynak_kalitesi', 'tarih']));
    }),

    getRobotBazli: asyncHandler(async (req, res) => {
        const data = await models.kaynakKalitesi.getRobotBazli();
        if (!data?.length) return res.json(createEmptyResponse(['kaynak_kalitesi', 'robot']));
        res.json(createResponse(data, ['kaynak_kalitesi', 'robot']));
    }),

    getPerformansDagilim: asyncHandler(async (req, res) => {
        const yil = parseInt(req.query.yil) || 2025;
        const data = await models.kaynakKalitesi.getPerformansDagilim(yil);
        if (!data?.length) return res.json(createEmptyResponse(['kaynak_kalitesi']));
        res.json(createResponse(data, ['kaynak_kalitesi']));
    }),



    getRobotScrapTrendi: asyncHandler(async (req, res) => {
        const startYear = parseInt(req.query.startYear) || 2016;
        const endYear = parseInt(req.query.endYear) || 2025;

        const data = await models.kaynakKalitesi.getRobotScrapTrendi(startYear, endYear);
        if (!data?.length) return res.json(createEmptyResponse(['kaynak_kalitesi', 'robot', 'tarih']));


        const yillar = [...new Set(data.map(d => d.yil))].sort();
        const robotlar = [...new Set(data.map(d => d.robot_kodu))].sort();


        const seriler = {};
        const degisimler = {};

        robotlar.forEach(robot => {
            const robotVerileri = data.filter(d => d.robot_kodu === robot);
            seriler[robot] = yillar.map(yil => {
                const row = robotVerileri.find(d => d.yil === yil);

                return row ? parseFloat(row.ort_scrap_orani) || 0 : 0;
            });


            const scraplar = seriler[robot].filter(s => s > 0);
            if (scraplar.length >= 2) {
                let toplamDegisim = 0;
                let sayac = 0;
                for (let i = 1; i < scraplar.length; i++) {
                    if (scraplar[i - 1] > 0) {
                        toplamDegisim += ((scraplar[i] - scraplar[i - 1]) / scraplar[i - 1]) * 100;
                        sayac++;
                    }
                }
                degisimler[robot] = sayac > 0 ? Math.round(toplamDegisim / sayac * 100) / 100 : 0;
            } else {
                degisimler[robot] = 0;
            }
        });

        res.json({
            success: true,
            data: {
                yillar,
                robotlar,
                seriler,
                degisimler
            },
            tables: ['kaynak_kalitesi', 'robot', 'tarih']
        });
    }),


    getScrapSenaryo: asyncHandler(async (req, res) => {
        const { robotOranlar = {} } = req.body;


        const sonYilData = await models.kaynakKalitesi.getSonYilScrap();
        if (!sonYilData?.length) return res.json(createEmptyResponse(['kaynak_kalitesi']));


        const sonuclar = sonYilData.map(robot => {
            const mevcutScrap = parseFloat(robot.son_scrap) || 0;
            const oran = robotOranlar[robot.robot_kodu] || 0;
            const tahminiScrap = mevcutScrap * (1 + oran / 100);

            return {
                robot_kodu: robot.robot_kodu,
                mevcut_scrap: Math.round(mevcutScrap * 10000) / 10000,
                oran: oran,
                tahmini_scrap: Math.round(tahminiScrap * 10000) / 10000,
                fark: Math.round((tahminiScrap - mevcutScrap) * 10000) / 10000
            };
        });


        const toplamMevcut = sonuclar.reduce((a, b) => a + b.mevcut_scrap, 0);
        const toplamTahmini = sonuclar.reduce((a, b) => a + b.tahmini_scrap, 0);

        res.json({
            success: true,
            data: {
                robotlar: sonuclar,
                ozet: {
                    toplamMevcut: Math.round(toplamMevcut * 10000) / 10000,
                    toplamTahmini: Math.round(toplamTahmini * 10000) / 10000,
                    toplamFark: Math.round((toplamTahmini - toplamMevcut) * 10000) / 10000,
                    yuzdelik: toplamMevcut > 0 ? Math.round(((toplamTahmini - toplamMevcut) / toplamMevcut) * 10000) / 100 : 0
                }
            },
            tables: ['kaynak_kalitesi', 'robot']
        });
    }),


    getRobotListesi: asyncHandler(async (req, res) => {
        const data = await models.kaynakKalitesi.getRobotListesi();
        if (!data?.length) return res.json(createEmptyResponse(['robot']));
        res.json(createResponse(data, ['robot']));
    }),


    getScrapKazanimSenaryo: asyncHandler(async (req, res) => {
        const data = await models.kaynakKalitesi.getRobotScrapMaliyeti();
        if (!data?.length) return res.json(createEmptyResponse(['kaynak_kalitesi']));


        const toplamMaliyet = data.reduce((a, b) => a + parseFloat(b.toplam_maliyet || 0), 0);


        const senaryolar = [
            { oran: 5, kazanim: Math.round(toplamMaliyet * 0.05) },
            { oran: 10, kazanim: Math.round(toplamMaliyet * 0.10) },
            { oran: 15, kazanim: Math.round(toplamMaliyet * 0.15) }
        ];


        const robotlar = data.map(robot => ({
            robot_kodu: robot.robot_kodu,
            toplam_maliyet: parseFloat(robot.toplam_maliyet) || 0,
            kazanim_5: Math.round(parseFloat(robot.toplam_maliyet) * 0.05),
            kazanim_10: Math.round(parseFloat(robot.toplam_maliyet) * 0.10),
            kazanim_15: Math.round(parseFloat(robot.toplam_maliyet) * 0.15)
        }));

        res.json({
            success: true,
            data: { toplamMaliyet, senaryolar, robotlar },
            tables: ['kaynak_kalitesi']
        });
    }),


    getYatirimMatrisi: asyncHandler(async (req, res) => {
        const startYear = parseInt(req.query.startYear) || 2020;
        const endYear = parseInt(req.query.endYear) || 2025;


        const data = await models.kaynakKalitesi.getRobotYatirimMatrisi(startYear, endYear);
        if (!data?.length) return res.json(createEmptyResponse(['kaynak_kalitesi']));


        let servisData = [];
        try {
            servisData = await models.tarih.query(`
                SELECT r.robot_kodu, SUM(rb.maliyet) as servis_maliyet
                FROM robot_bakim rb
                JOIN robot r ON rb.robot_id = r.robot_id
                JOIN tarih t ON rb.tarih_id = t.tarih_id
                WHERE t.yil BETWEEN ? AND ?
                GROUP BY r.robot_id, r.robot_kodu
            `, [startYear, endYear]);
        } catch (e) {
            console.log('Servis verisi alınamadı:', e.message);
        }


        const robotlar = [...new Set(data.map(d => d.robot_kodu))].sort();
        const hesaplamalar = robotlar.map(robot => {
            const robotVerileri = data.filter(d => d.robot_kodu === robot).sort((a, b) => a.yil - b.yil);


            const sonYilVeri = robotVerileri[robotVerileri.length - 1];
            const scrapMaliyet = parseFloat(sonYilVeri?.toplam_maliyet || 0);


            const servisKayit = servisData.find(s => s.robot_kodu === robot);
            const servisMaliyet = parseFloat(servisKayit?.servis_maliyet || 0);


            const toplamMaliyet = scrapMaliyet + servisMaliyet;


            let toplamDegisim = 0, sayac = 0;
            for (let i = 1; i < robotVerileri.length; i++) {
                const onceki = parseFloat(robotVerileri[i - 1].toplam_scrap) || 0;
                const simdiki = parseFloat(robotVerileri[i].toplam_scrap) || 0;
                if (onceki > 0) {
                    toplamDegisim += ((simdiki - onceki) / onceki) * 100;
                    sayac++;
                }
            }
            const scrapArtisOrani = sayac > 0 ? Math.round(toplamDegisim / sayac * 100) / 100 : 0;

            return {
                robot_kodu: robot,
                scrap_artis_orani: scrapArtisOrani,
                toplam_maliyet: Math.round(toplamMaliyet),
                scrap_maliyet: Math.round(scrapMaliyet),
                servis_maliyet: Math.round(servisMaliyet)
            };
        });


        const maliyetler = hesaplamalar.map(h => h.toplam_maliyet).sort((a, b) => a - b);
        const artislar = hesaplamalar.map(h => h.scrap_artis_orani).sort((a, b) => a - b);

        const maliyetMedian = maliyetler.length > 0 ? maliyetler[Math.floor(maliyetler.length / 2)] : 500000;
        const artisMedian = artislar.length > 0 ? artislar[Math.floor(artislar.length / 2)] : 5;


        const sonuc = hesaplamalar.map(h => {
            let bolge = '', oneri = '', renk = '';

            if (h.scrap_artis_orani < artisMedian && h.toplam_maliyet < maliyetMedian) {
                bolge = 'STABİL';
                oneri = 'Sistem stabil - Rutin takip yeterli';
                renk = '#28A745';
            } else if (h.scrap_artis_orani >= artisMedian && h.toplam_maliyet < maliyetMedian) {
                bolge = 'BAKIM & SÜREÇ İYİLEŞTİRME';
                oneri = 'Bakım planlaması ve süreç iyileştirme önerilir';
                renk = '#FFC107';
            } else if (h.scrap_artis_orani < artisMedian && h.toplam_maliyet >= maliyetMedian) {
                bolge = 'MALİYET TAKİBİ';
                oneri = 'Maliyet yüksek ama stabil - Veri takibi gerekli';
                renk = '#17A2B8';
            } else {
                bolge = 'YATIRIM / YENİLEME';
                oneri = 'Robot yenileme veya büyük yatırım değerlendirilmeli';
                renk = '#DC3545';
            }

            return {
                ...h,
                bolge,
                oneri,
                renk
            };
        });


        const ozet = {
            stabil: sonuc.filter(r => r.bolge === 'STABİL').length,
            bakim: sonuc.filter(r => r.bolge === 'BAKIM & SÜREÇ İYİLEŞTİRME').length,
            takip: sonuc.filter(r => r.bolge === 'MALİYET TAKİBİ').length,
            yatirim: sonuc.filter(r => r.bolge === 'YATIRIM / YENİLEME').length
        };

        res.json({
            success: true,
            data: {
                robotlar: sonuc,
                esikler: {
                    maliyet: Math.round(maliyetMedian),
                    artis: Math.round(artisMedian * 100) / 100
                },
                ozet
            },
            tables: ['kaynak_kalitesi', 'robot_bakim']
        });
    }),


    getScrapZararTahmini: asyncHandler(async (req, res) => {
        const degisimOrani = parseInt(req.query.degisimOrani) || 0;

        const data = await models.kaynakKalitesi.getSonYilScrapDetay();
        if (!data?.length) return res.json(createEmptyResponse(['kaynak_kalitesi']));


        const robotlar = data.map(robot => {
            const mevcutScrapAdet = parseInt(robot.mevcut_scrap_adet) || 0;
            const birimMaliyet = parseFloat(robot.birim_maliyet) || 0;
            const mevcutToplam = parseFloat(robot.mevcut_toplam_maliyet) || 0;


            const tahminiScrapAdet = Math.round(mevcutScrapAdet * (1 + degisimOrani / 100));


            const tahminiYillikZarar = Math.round(tahminiScrapAdet * birimMaliyet * 100) / 100;


            const fark = Math.round((tahminiYillikZarar - mevcutToplam) * 100) / 100;

            return {
                robot_id: robot.robot_id,
                robot_kodu: robot.robot_kodu,
                mevcut_scrap_adet: mevcutScrapAdet,
                birim_maliyet: birimMaliyet,
                mevcut_toplam_maliyet: mevcutToplam,
                tahmini_scrap_adet: tahminiScrapAdet,
                tahmini_yillik_zarar: tahminiYillikZarar,
                fark: fark
            };
        });


        const toplamMevcutZarar = robotlar.reduce((a, b) => a + b.mevcut_toplam_maliyet, 0);
        const toplamTahminiZarar = robotlar.reduce((a, b) => a + b.tahmini_yillik_zarar, 0);
        const toplamFark = Math.round((toplamTahminiZarar - toplamMevcutZarar) * 100) / 100;

        res.json({
            success: true,
            data: {
                degisimOrani,
                robotlar,
                ozet: {
                    toplamMevcutZarar: Math.round(toplamMevcutZarar * 100) / 100,
                    toplamTahminiZarar: Math.round(toplamTahminiZarar * 100) / 100,
                    toplamFark
                }
            },
            tables: ['kaynak_kalitesi', 'robot']
        });
    }),


    getBakimYatirimAnaliz: asyncHandler(async (req, res) => {
        const data = await models.kaynakKalitesi.getBakimYatirimAnaliz();
        if (!data?.length) return res.json(createEmptyResponse(['robot_bakim', 'kaynak_kalitesi']));


        const robotlar = data.map(robot => ({
            robot_id: robot.robot_id,
            robot_kodu: robot.robot_kodu,

            bakim_maliyeti: parseFloat(robot.bakim_maliyeti) || 0,
            ort_bakim_maliyeti: parseFloat(robot.ort_bakim_maliyeti) || 0,
            ariza_sayisi: parseInt(robot.ariza_sayisi) || 0,

            yatirim_maliyeti: parseFloat(robot.yatirim_maliyeti) || 0,

            yillik_scrap_adet: parseInt(robot.yillik_scrap_adet) || 0,
            yillik_scrap_maliyeti: parseFloat(robot.yillik_scrap_maliyeti) || 0,

            bakim_iyilesme_orani: parseInt(robot.bakim_iyilesme_orani) || 15,
            yatirim_iyilesme_orani: parseInt(robot.yatirim_iyilesme_orani) || 35
        }));


        const ozet = {
            toplamBakimMaliyeti: robotlar.reduce((a, b) => a + b.bakim_maliyeti, 0),
            toplamYatirimMaliyeti: robotlar.reduce((a, b) => a + b.yatirim_maliyeti, 0),
            ortBakimIyilesme: robotlar.reduce((a, b) => a + b.bakim_iyilesme_orani, 0) / robotlar.length,
            ortYatirimIyilesme: robotlar.reduce((a, b) => a + b.yatirim_iyilesme_orani, 0) / robotlar.length,
            toplamYillikScrapMaliyet: robotlar.reduce((a, b) => a + b.yillik_scrap_maliyeti, 0)
        };

        res.json({
            success: true,
            data: { robotlar, ozet },
            tables: ['robot_bakim', 'kaynak_kalitesi', 'robot']
        });
    }),


    getRobotBakimGecmisi: asyncHandler(async (req, res) => {

        const rawData = await models.robotBakim.getBakimGecmisi('KAYNAK');


        const grouped = {};
        rawData.forEach(item => {
            if (!grouped[item.robot_kodu]) {
                grouped[item.robot_kodu] = [];
            }

            if (!grouped[item.robot_kodu].includes(item.yil) && grouped[item.robot_kodu].length < 3) {
                grouped[item.robot_kodu].push(item.yil);
            }
        });






        const robotList = Object.keys(grouped).sort();
        const datasets = [{
            label: 'Bakım Yapılan Yıllar',
            data: [],
            backgroundColor: '#FFC107',
            borderColor: '#FFC107',
            pointRadius: 6,
            pointHoverRadius: 8
        }];

        robotList.forEach((robot, index) => {
            const years = grouped[robot];
            years.forEach(year => {
                datasets[0].data.push({
                    x: year,
                    y: robot
                });
            });
        });

        res.json({
            success: true,
            data: {
                datasets,
                labels: robotList
            }
        });
    }),

    getBakimYatirimMaliyetler: asyncHandler(async (req, res) => {
        const data = await models.kaynakKalitesi.getBakimYatirimAnaliz();
        if (!data?.length) return res.json(createEmptyResponse(['robot_bakim', 'kaynak_kalitesi']));

        const robotlar = data.map(robot => {
            const bakimMaliyet = parseFloat(robot.bakim_maliyeti) || 50000;
            const yatirimMaliyet = parseFloat(robot.yatirim_maliyeti) || 200000;
            const yillikScrapMaliyet = parseFloat(robot.yillik_scrap_maliyeti) || 100000;
            const bakimIyilesme = parseFloat(robot.bakim_iyilesme_orani) || 15;
            const yatirimIyilesme = parseFloat(robot.yatirim_iyilesme_orani) || 35;

            return {
                robot_kodu: robot.robot_kodu,
                bakim_maliyet: Math.round(bakimMaliyet),
                yatirim_maliyet: Math.round(yatirimMaliyet),
                bakim_kazanc_3yil: Math.round(yillikScrapMaliyet * (bakimIyilesme / 100) * 3),
                yatirim_kazanc_3yil: Math.round(yillikScrapMaliyet * (yatirimIyilesme / 100) * 3)
            };
        });

        res.json({
            success: true,
            data: robotlar,
            tables: ['robot_bakim', 'kaynak_kalitesi']
        });
    })
};

module.exports = KaynakController;

