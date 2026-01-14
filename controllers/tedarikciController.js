
const models = require('../models');
const { asyncHandler } = require('../middleware');
const { createResponse, createEmptyResponse } = require('../utils/responseHelper');
const ForecastHelper = require('../utils/forecastHelper');

const TedarikciController = {

    getHistorical: asyncHandler(async (req, res) => {
        const startYear = parseInt(req.query.startYear) || 2016;
        const endYear = parseInt(req.query.endYear) || 2025;

        let data = await models.tedarikciKalite.getTrend();


        data = data.filter(d => d.yil >= startYear && d.yil <= endYear);

        if (!data || data.length === 0) {
            return res.json({
                success: true,
                data: [],
                meta: ForecastHelper.createMeta(0, 0, { startYear, endYear })
            });
        }

        res.json({
            success: true,
            data,
            meta: ForecastHelper.createMeta(data.length, 0, { startYear, endYear })
        });
    }),


    getForecast: asyncHandler(async (req, res) => {
        const {
            months = 12,
            qualityChangePercent = 2,
            ppmChangePercent = -5
        } = req.body;


        const latestData = await models.tedarikciKalite.getTrend();
        if (!latestData || latestData.length === 0) {
            return res.json({
                success: true,
                data: { quality: [], ppm: [] },
                meta: ForecastHelper.createMeta(0, months, req.body)
            });
        }


        const lastYear = Math.max(...latestData.map(d => d.yil));
        const lastYearData = latestData.filter(d => d.yil === lastYear);

        const avgQuality = lastYearData.reduce((sum, d) => sum + parseFloat(d.ort_kalite || 0), 0) / lastYearData.length;
        const avgPPM = lastYearData.reduce((sum, d) => sum + parseFloat(d.ort_ppm || 0), 0) / lastYearData.length;


        const qualityForecast = ForecastHelper.compound(avgQuality, qualityChangePercent, months);
        const ppmForecast = ForecastHelper.compound(avgPPM, ppmChangePercent, months);

        res.json({
            success: true,
            data: {
                baseYear: lastYear,
                qualityBase: avgQuality,
                ppmBase: avgPPM,
                quality: qualityForecast,
                ppm: ppmForecast
            },
            meta: ForecastHelper.createMeta(lastYearData.length, months, { qualityChangePercent, ppmChangePercent, months })
        });
    }),


    getKaliteTrendi: asyncHandler(async (req, res) => {
        const data = await models.tedarikciKalite.getTrend();
        if (!data || data.length === 0) {
            return res.json(createEmptyResponse(['tedarikci_kalite', 'tedarikci', 'tarih']));
        }
        res.json(createResponse(data, ['tedarikci_kalite', 'tedarikci', 'tarih']));
    }),


    getMaliyetTrendi: asyncHandler(async (req, res) => {
        const data = await models.tedarikciMaliyet.getTrend();
        if (!data || data.length === 0) {
            return res.json(createEmptyResponse(['tedarikci_maliyet', 'tedarikci', 'tarih']));
        }
        res.json(createResponse(data, ['tedarikci_maliyet', 'tedarikci', 'tarih']));
    }),


    getKarsilastirma: asyncHandler(async (req, res) => {
        const kategori = req.query.kategori || 'Çelik';
        const data = await models.tedarikciKalite.getByKategori(kategori);
        if (!data || data.length === 0) {
            return res.json(createEmptyResponse(['tedarikci_kalite', 'tedarikci']));
        }
        res.json(createResponse(data, ['tedarikci_kalite', 'tedarikci']));
    }),


    getCelikEndeks: asyncHandler(async (req, res) => {
        const data = await models.tedarikciMaliyet.getTrend();
        if (!data || data.length === 0) {
            return res.json(createEmptyResponse(['tedarikci_maliyet']));
        }
        res.json(createResponse(data, ['tedarikci_maliyet']));
    }),


    getSonDurum: asyncHandler(async (req, res) => {
        const yil = parseInt(req.query.yil) || 2025;
        const data = await models.tedarikciKalite.getSonDurum(yil);
        if (!data || data.length === 0) {
            return res.json(createEmptyResponse(['tedarikci_kalite', 'tedarikci']));
        }
        res.json(createResponse(data, ['tedarikci_kalite', 'tedarikci']));
    }),




    getListe: asyncHandler(async (req, res) => {
        const data = await models.tedarikciKalite.getTedarikciListesi();
        if (!data || data.length === 0) {
            return res.json({ success: true, data: [] });
        }
        res.json({ success: true, data });
    }),


    getKaliteTrendiById: asyncHandler(async (req, res) => {
        const tedarikciId = parseInt(req.params.id);
        const startYear = parseInt(req.query.startYear) || 2016;
        const endYear = parseInt(req.query.endYear) || 2025;

        if (!tedarikciId) {
            return res.status(400).json({ success: false, error: 'Tedarikçi ID gerekli' });
        }

        const data = await models.tedarikciKalite.getKaliteTrendiByTedarikci(tedarikciId, startYear, endYear);

        if (!data || data.length === 0) {
            return res.json({ success: true, data: [], ozet: { yilSayisi: 0, ortDegisim: 0 } });
        }


        const changes = [];
        for (let i = 1; i < data.length; i++) {
            const prev = parseFloat(data[i - 1].kalite_skoru);
            const curr = parseFloat(data[i].kalite_skoru);
            if (prev > 0) {
                changes.push(((curr - prev) / prev) * 100);
            }
        }
        const ortDegisim = changes.length > 0
            ? Math.round((changes.reduce((a, b) => a + b, 0) / changes.length) * 100) / 100
            : 0;

        res.json({
            success: true,
            data,
            ozet: {
                yilSayisi: data.length,
                ortDegisim
            }
        });
    }),


    getPPMTrendiById: asyncHandler(async (req, res) => {
        const tedarikciId = parseInt(req.params.id);
        const startYear = parseInt(req.query.startYear) || 2016;
        const endYear = parseInt(req.query.endYear) || 2025;

        if (!tedarikciId) {
            return res.status(400).json({ success: false, error: 'Tedarikçi ID gerekli' });
        }

        const data = await models.tedarikciKalite.getPPMTrendiByTedarikci(tedarikciId, startYear, endYear);

        if (!data || data.length === 0) {
            return res.json({ success: true, data: [], ozet: { yilSayisi: 0, ortDegisim: 0 } });
        }


        const changes = [];
        for (let i = 1; i < data.length; i++) {
            const prev = parseFloat(data[i - 1].ppm_orani);
            const curr = parseFloat(data[i].ppm_orani);
            if (prev > 0) {
                changes.push(((curr - prev) / prev) * 100);
            }
        }
        const ortDegisim = changes.length > 0
            ? Math.round((changes.reduce((a, b) => a + b, 0) / changes.length) * 100) / 100
            : 0;

        res.json({
            success: true,
            data,
            ozet: {
                yilSayisi: data.length,
                ortDegisim
            }
        });
    }),


    getServisAnaliziById: asyncHandler(async (req, res) => {
        const tedarikciId = parseInt(req.params.id);
        const startYear = parseInt(req.query.startYear) || 2016;
        const endYear = parseInt(req.query.endYear) || 2025;

        if (!tedarikciId) {
            return res.status(400).json({ success: false, error: 'Tedarikçi ID gerekli' });
        }

        const data = await models.tedarikciKalite.getServisAnaliziByTedarikci(tedarikciId, startYear, endYear);

        if (!data || data.length === 0) {
            return res.json({ success: true, data: [], ozet: { garantiIciToplam: 0, garantiDisiToplam: 0 } });
        }


        let garantiIciToplam = 0;
        let garantiDisiToplam = 0;
        data.forEach(d => {
            if (d.garanti_durumu === 'GARANTI_ICI') {
                garantiIciToplam += parseInt(d.toplam_ariza || 0);
            } else {
                garantiDisiToplam += parseInt(d.toplam_ariza || 0);
            }
        });

        res.json({
            success: true,
            data,
            ozet: {
                garantiIciToplam,
                garantiDisiToplam,
                toplamAriza: garantiIciToplam + garantiDisiToplam
            }
        });
    }),


    getTeslimatGecikmeById: asyncHandler(async (req, res) => {
        const tedarikciId = parseInt(req.params.id);
        const startYear = parseInt(req.query.startYear) || 2016;
        const endYear = parseInt(req.query.endYear) || 2025;

        if (!tedarikciId) {
            return res.status(400).json({ success: false, error: 'Tedarikçi ID gerekli' });
        }

        const data = await models.tedarikciKalite.getTeslimatGecikmeByTedarikci(tedarikciId, startYear, endYear);

        if (!data || data.length === 0) {
            return res.json({ success: true, data: [], ozet: { ortGecikme: 0 } });
        }


        const gecikmeler = data.map(d => parseFloat(d.gecikme || 0));
        const ortGecikme = gecikmeler.length > 0
            ? Math.round((gecikmeler.reduce((a, b) => a + b, 0) / gecikmeler.length) * 100) / 100
            : 0;

        res.json({
            success: true,
            data,
            ozet: {
                ortGecikme,
                yilSayisi: data.length
            }
        });
    }),


    getOzetById: asyncHandler(async (req, res) => {
        const tedarikciId = parseInt(req.params.id);
        const yil = parseInt(req.query.yil) || 2025;

        if (!tedarikciId) {
            return res.status(400).json({ success: false, error: 'Tedarikçi ID gerekli' });
        }

        const data = await models.tedarikciKalite.getTedarikciOzet(tedarikciId, yil);

        if (!data || data.length === 0) {
            return res.json({ success: true, data: null });
        }

        res.json({ success: true, data: data[0] });
    })
};

module.exports = TedarikciController;
