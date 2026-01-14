
const models = require('../models');
const { asyncHandler } = require('../middleware');
const { createResponse, createEmptyResponse } = require('../utils/responseHelper');
const ForecastHelper = require('../utils/forecastHelper');

const LojistikController = {
    getHistorical: asyncHandler(async (req, res) => {
        const startYear = parseInt(req.query.startYear) || 2016;
        const endYear = parseInt(req.query.endYear) || 2025;

        let data = await models.intralojistik.getKazaTrendi();
        data = data.filter(d => d.yil >= startYear && d.yil <= endYear);

        res.json({ success: true, data, meta: ForecastHelper.createMeta(data.length, 0, { startYear, endYear }) });
    }),

    getForecast: asyncHandler(async (req, res) => {
        const { months = 12, forkliftChangePercent = 5, agvChangePercent = -20 } = req.body;

        const latestData = await models.intralojistik.getKazaTrendi();
        const lastYear = Math.max(...latestData.map(d => d.yil));
        const forkData = latestData.find(d => d.yil === lastYear && d.tasima_tipi === 'FORKLIFT');
        const agvData = latestData.find(d => d.yil === lastYear && d.tasima_tipi === 'AGV');

        const forkBase = parseFloat(forkData?.toplam_kaza || 10);
        const agvBase = parseFloat(agvData?.toplam_kaza || 1);

        res.json({
            success: true,
            data: {
                baseYear: lastYear,
                forklift: ForecastHelper.compound(forkBase, forkliftChangePercent, months),
                agv: ForecastHelper.compound(agvBase, agvChangePercent, months)
            },
            meta: ForecastHelper.createMeta(latestData.length, months, { forkliftChangePercent, agvChangePercent, months })
        });
    }),

    getKazaTrendi: asyncHandler(async (req, res) => {
        const data = await models.intralojistik.getKazaTrendi();
        if (!data?.length) return res.json(createEmptyResponse(['intralojistik']));
        res.json(createResponse(data, ['intralojistik', 'tarih']));
    }),

    getBeklemeSuresi: asyncHandler(async (req, res) => {
        const data = await models.intralojistik.getBeklemeTrend();
        if (!data?.length) return res.json(createEmptyResponse(['intralojistik']));
        res.json(createResponse(data, ['intralojistik', 'tarih']));
    }),

    getMaliyetKarsilastirma: asyncHandler(async (req, res) => {
        const data = await models.intralojistik.getMaliyetKarsilastir();
        if (!data?.length) return res.json(createEmptyResponse(['intralojistik']));
        res.json(createResponse(data, ['intralojistik', 'tarih']));
    }),

    getTipDagilim: asyncHandler(async (req, res) => {
        const yil = parseInt(req.query.yil) || 2025;
        const data = await models.intralojistik.getTipDagilim(yil);
        if (!data?.length) return res.json(createEmptyResponse(['intralojistik']));
        res.json(createResponse(data, ['intralojistik']));
    }),

    getYillikTrend: asyncHandler(async (req, res) => {
        const data = await models.intralojistik.getYillikTrend();
        if (!data?.length) return res.json(createEmptyResponse(['intralojistik']));
        res.json(createResponse(data, ['intralojistik', 'tarih']));
    }),


    getAgvKazancAnalizi: asyncHandler(async (req, res) => {
        const data = await models.intralojistik.getAgvKazancAnalizi();

        res.json({
            success: true,
            data,
            tables: ['intralojistik', 'tarih']
        });
    }),


    getSenaryo: asyncHandler(async (req, res) => {
        const params = {
            forkliftSayisi: parseInt(req.body.forkliftSayisi) || 10,
            agvSayisi: parseInt(req.body.agvSayisi) || 5,
            agvVerimlilik: parseFloat(req.body.agvVerimlilik) || 1.2,
            kazaMaliyeti: parseInt(req.body.kazaMaliyeti) || 15000,
            beklemeMaliyeti: parseInt(req.body.beklemeMaliyeti) || 50,
            forkliftBakimCarpan: parseFloat(req.body.forkliftBakimCarpan) || 1.0,
            agvBakimCarpan: parseFloat(req.body.agvBakimCarpan) || 1.0
        };

        const data = await models.intralojistik.getSenaryoAnaliz(params);

        res.json({
            success: true,
            data,
            tables: ['intralojistik', 'tarih']
        });
    })
};

module.exports = LojistikController;

