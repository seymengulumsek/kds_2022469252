
const models = require('../models');
const { asyncHandler } = require('../middleware');
const { createResponse, createEmptyResponse } = require('../utils/responseHelper');
const ForecastHelper = require('../utils/forecastHelper');

const UretimController = {

    getHistorical: asyncHandler(async (req, res) => {
        const startYear = parseInt(req.query.startYear) || 2016;
        const endYear = parseInt(req.query.endYear) || 2025;
        const gucTipi = req.query.gucTipi || 'all';

        let data;
        if (gucTipi === 'all') {
            data = await models.uretimTalep.getTrendByYakitTipi();
        } else {
            data = await models.uretimTalep.getTrendByYakitTipi();
            data = data.filter(d => d.guc_tipi === gucTipi);
        }


        data = data.filter(d => d.yil >= startYear && d.yil <= endYear);

        if (!data || data.length === 0) {
            return res.json({
                success: true,
                data: [],
                meta: ForecastHelper.createMeta(0, 0, { startYear, endYear, gucTipi })
            });
        }

        res.json({
            success: true,
            data,
            meta: ForecastHelper.createMeta(data.length, 0, { startYear, endYear, gucTipi })
        });
    }),


    getForecast: asyncHandler(async (req, res) => {
        const {
            months = 12,
            iceChangePercent = -5,
            evChangePercent = 15,
            scenario = 'realistic'
        } = req.body;


        const latestData = await models.uretimTalep.getTrendByYakitTipi();
        if (!latestData || latestData.length === 0) {
            return res.json({
                success: true,
                data: { ice: [], ev: [] },
                meta: ForecastHelper.createMeta(0, months, req.body)
            });
        }


        const lastYear = Math.max(...latestData.map(d => d.yil));
        const lastYearData = latestData.filter(d => d.yil === lastYear);


        const iceData = lastYearData.filter(d => d.guc_tipi === 'ICE');
        const evData = lastYearData.filter(d => d.guc_tipi === 'EV');

        const iceBase = iceData.reduce((sum, d) => sum + parseFloat(d.toplam_uretim || 0), 0);
        const evBase = evData.reduce((sum, d) => sum + parseFloat(d.toplam_uretim || 0), 0);


        const iceForecast = ForecastHelper.compound(iceBase, iceChangePercent, months);
        const evForecast = ForecastHelper.compound(evBase, evChangePercent, months);

        res.json({
            success: true,
            data: {
                baseYear: lastYear,
                iceBase,
                evBase,
                ice: iceForecast,
                ev: evForecast
            },
            meta: ForecastHelper.createMeta(lastYearData.length, months, {
                iceChangePercent, evChangePercent, scenario, months
            })
        });
    }),


    getTrend: asyncHandler(async (req, res) => {
        const data = await models.uretimTalep.getTrendByYakitTipi();
        if (!data || data.length === 0) {
            return res.json(createEmptyResponse(['uretim_talep', 'model', 'tarih']));
        }
        res.json(createResponse(data, ['uretim_talep', 'model', 'tarih']));
    }),


    getKapasite: asyncHandler(async (req, res) => {
        const data = await models.uretimTalep.getKapasiteKullanimi();
        if (!data || data.length === 0) {
            return res.json(createEmptyResponse(['uretim_talep', 'hat', 'tarih']));
        }
        res.json(createResponse(data, ['uretim_talep', 'hat', 'tarih']));
    }),


    getSonYil: asyncHandler(async (req, res) => {
        const yil = parseInt(req.query.yil) || 2025;
        const data = await models.uretimTalep.getSonYil(yil);
        if (!data || data.length === 0) {
            return res.json(createEmptyResponse(['uretim_talep']));
        }
        res.json(createResponse(data, ['uretim_talep']));
    }),


    getModelBazli: asyncHandler(async (req, res) => {
        const yil = parseInt(req.query.yil) || 2025;
        const data = await models.uretimTalep.getModelBazli(yil);
        if (!data || data.length === 0) {
            return res.json(createEmptyResponse(['uretim_talep', 'model']));
        }
        res.json(createResponse(data, ['uretim_talep', 'model']));
    }),


    getHatBazli: asyncHandler(async (req, res) => {
        const yil = parseInt(req.query.yil) || 2025;
        const data = await models.uretimTalep.getHatBazli(yil);
        if (!data || data.length === 0) {
            return res.json(createEmptyResponse(['uretim_talep', 'hat']));
        }
        res.json(createResponse(data, ['uretim_talep', 'hat']));
    }),


    getYillikKarsilastirma: asyncHandler(async (req, res) => {
        const data = await models.uretimTalep.getYillikKarsilastirma();
        if (!data || data.length === 0) {
            return res.json(createEmptyResponse(['uretim_talep', 'tarih']));
        }
        res.json(createResponse(data, ['uretim_talep', 'tarih']));
    }),


    getKapasiteYeterlilik: asyncHandler(async (req, res) => {
        const yil = parseInt(req.query.yil) || 2025;
        const data = await models.uretimTalep.getKapasiteYeterlilik(yil);
        if (!data || data.length === 0) {
            return res.json(createEmptyResponse(['uretim_talep', 'hat', 'tarih']));
        }
        res.json(createResponse(data, ['uretim_talep', 'hat', 'tarih']));
    }),


    getHatAracDagilim: asyncHandler(async (req, res) => {
        const yil = parseInt(req.query.yil) || 2025;
        const data = await models.uretimTalep.getHatAracTipiDagilim(yil);
        if (!data || data.length === 0) {
            return res.json(createEmptyResponse(['uretim_talep', 'hat', 'model', 'tarih']));
        }
        res.json(createResponse(data, ['uretim_talep', 'hat', 'model', 'tarih']));
    }),



    getTrendOzet: asyncHandler(async (req, res) => {
        const startYear = parseInt(req.query.startYear) || 2016;
        const endYear = parseInt(req.query.endYear) || 2025;


        let data = await models.uretimTalep.getTrendByYakitTipi();

        if (!data || data.length === 0) {
            return res.json({
                success: true,
                data: {
                    ice: { yilSayisi: 0, ortUretimDegisim: 0 },
                    ev: { yilSayisi: 0, ortUretimDegisim: 0 }
                },
                meta: { startYear, endYear }
            });
        }


        data = data.filter(d => d.yil >= startYear && d.yil <= endYear);


        const calculateChange = (gucTipi) => {
            const filtered = data.filter(d => d.guc_tipi === gucTipi);
            const years = [...new Set(filtered.map(d => d.yil))].sort((a, b) => a - b);

            if (years.length < 2) return { yilSayisi: years.length, ortUretimDegisim: 0 };

            const changes = [];
            for (let i = 1; i < years.length; i++) {
                const prevYear = years[i - 1];
                const currYear = years[i];

                const prevData = filtered.filter(d => d.yil === prevYear);
                const currData = filtered.filter(d => d.yil === currYear);

                const prevUretim = prevData.reduce((sum, d) => sum + parseFloat(d.toplam_uretim || 0), 0);
                const currUretim = currData.reduce((sum, d) => sum + parseFloat(d.toplam_uretim || 0), 0);

                if (prevUretim > 0) {
                    const change = ((currUretim - prevUretim) / prevUretim) * 100;
                    changes.push(change);
                }
            }

            const ortDegisim = changes.length > 0
                ? changes.reduce((a, b) => a + b, 0) / changes.length
                : 0;

            return {
                yilSayisi: years.length,
                ortUretimDegisim: Math.round(ortDegisim * 100) / 100
            };
        };

        res.json({
            success: true,
            data: {
                ice: calculateChange('ICE'),
                ev: calculateChange('EV')
            },
            meta: { startYear, endYear, source: 'uretim_talep' }
        });
    }),


    getYilListesi: asyncHandler(async (req, res) => {
        const yillar = await models.tarih.query(`
            SELECT DISTINCT yil FROM tarih ORDER BY yil
        `);
        res.json({ success: true, data: yillar.map(y => y.yil) });
    })
};

module.exports = UretimController;
