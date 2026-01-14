
const BaseModel = require('./BaseModel');

class IntralojistikModel extends BaseModel {
    constructor() {
        super('intralojistik', 'lojistik_id');
    }


    async getKazaTrendi() {
        return this.query(`
            SELECT 
                t.yil,
                l.tasima_tipi,
                SUM(l.kaza_sayisi) AS toplam_kaza
            FROM intralojistik l
            JOIN tarih t ON l.tarih_id = t.tarih_id
            GROUP BY t.yil, l.tasima_tipi
            ORDER BY t.yil, l.tasima_tipi
        `);
    }


    async getBeklemeTrend() {
        return this.query(`
            SELECT 
                t.yil,
                l.tasima_tipi,
                AVG(l.bekleme_suresi) AS ort_bekleme
            FROM intralojistik l
            JOIN tarih t ON l.tarih_id = t.tarih_id
            GROUP BY t.yil, l.tasima_tipi
            ORDER BY t.yil, l.tasima_tipi
        `);
    }


    async getMaliyetKarsilastir() {
        return this.query(`
            SELECT 
                t.yil,
                l.tasima_tipi,
                SUM(l.maliyet) AS toplam_maliyet
            FROM intralojistik l
            JOIN tarih t ON l.tarih_id = t.tarih_id
            GROUP BY t.yil, l.tasima_tipi
            ORDER BY t.yil, l.tasima_tipi
        `);
    }


    async getTipDagilim(yil = 2025) {
        return this.query(`
            SELECT 
                l.tasima_tipi,
                SUM(l.kaza_sayisi) AS toplam_kaza,
                SUM(l.maliyet) AS toplam_maliyet
            FROM intralojistik l
            JOIN tarih t ON l.tarih_id = t.tarih_id
            WHERE t.yil = ?
            GROUP BY l.tasima_tipi
        `, [yil]);
    }


    async getYillikTrend() {
        return this.query(`
            SELECT 
                t.yil,
                SUM(l.kaza_sayisi) AS toplam_kaza,
                SUM(l.maliyet) AS toplam_maliyet,
                AVG(l.bekleme_suresi) AS ort_bekleme
            FROM intralojistik l
            JOIN tarih t ON l.tarih_id = t.tarih_id
            GROUP BY t.yil
            ORDER BY t.yil
        `);
    }






    async getAgvKazancAnalizi() {

        const sonYilData = await this.query(`
            SELECT 
                l.tasima_tipi,
                SUM(l.kaza_sayisi) AS toplam_kaza,
                SUM(l.maliyet) AS toplam_maliyet,
                AVG(l.bekleme_suresi) AS ort_bekleme,
                COUNT(*) AS islem_sayisi
            FROM intralojistik l
            JOIN tarih t ON l.tarih_id = t.tarih_id
            WHERE t.yil = (SELECT MAX(yil) FROM tarih)
            GROUP BY l.tasima_tipi
        `);


        const KAZA_BASI_MALIYET = 15000;
        const DAKIKA_BASI_BEKLEME_MALIYET = 50;
        const FORKLIFT_ISCILIK_YILLIK = 180000;
        const AGV_GOZETIM_YILLIK = 30000;
        const FORKLIFT_ENERJI_YILLIK = 20000;
        const AGV_ENERJI_YILLIK = 8000;
        const AGV_YATIRIM_MALIYETI = 350000;
        const AGV_VERIMLILIK_KATSAYISI = 1.5;


        const forkliftData = sonYilData.find(d => d.tasima_tipi === 'FORKLIFT') || {};
        const agvData = sonYilData.find(d => d.tasima_tipi === 'AGV') || {};


        const forkliftKaza = parseInt(forkliftData.toplam_kaza) || 12;
        const forkliftBekleme = parseFloat(forkliftData.ort_bekleme) || 8.5;
        const forkliftIslem = parseInt(forkliftData.islem_sayisi) || 500;

        const forkliftKazaMaliyet = forkliftKaza * KAZA_BASI_MALIYET;
        const forkliftBeklemeMaliyet = forkliftBekleme * forkliftIslem * DAKIKA_BASI_BEKLEME_MALIYET;

        const forkliftToplam = {
            iscilik: FORKLIFT_ISCILIK_YILLIK,
            kazaMaliyet: forkliftKazaMaliyet,
            beklemeMaliyet: Math.round(forkliftBeklemeMaliyet),
            enerjiMaliyet: FORKLIFT_ENERJI_YILLIK,
            toplam: 0
        };
        forkliftToplam.toplam = forkliftToplam.iscilik + forkliftToplam.kazaMaliyet +
            forkliftToplam.beklemeMaliyet + forkliftToplam.enerjiMaliyet;


        const agvKaza = parseInt(agvData.toplam_kaza) || Math.round(forkliftKaza * 0.25);
        const agvBekleme = parseFloat(agvData.ort_bekleme) || forkliftBekleme * 0.4;
        const agvIslem = parseInt(agvData.islem_sayisi) || forkliftIslem;

        const agvKazaMaliyet = agvKaza * KAZA_BASI_MALIYET;
        const agvBeklemeMaliyet = agvBekleme * agvIslem * DAKIKA_BASI_BEKLEME_MALIYET;

        const agvToplam = {
            iscilik: AGV_GOZETIM_YILLIK,
            kazaMaliyet: agvKazaMaliyet,
            beklemeMaliyet: Math.round(agvBeklemeMaliyet),
            enerjiMaliyet: AGV_ENERJI_YILLIK,
            toplam: 0
        };
        agvToplam.toplam = agvToplam.iscilik + agvToplam.kazaMaliyet +
            agvToplam.beklemeMaliyet + agvToplam.enerjiMaliyet;


        const yillikKazanc = forkliftToplam.toplam - agvToplam.toplam;
        const amortismanSuresi = yillikKazanc > 0 ? AGV_YATIRIM_MALIYETI / yillikKazanc : 0;


        const birimKarlar = {
            iscilikKar: FORKLIFT_ISCILIK_YILLIK - AGV_GOZETIM_YILLIK,
            kazaKar: (forkliftKaza - agvKaza) * KAZA_BASI_MALIYET,
            beklemeKar: Math.round((forkliftBekleme - agvBekleme) * DAKIKA_BASI_BEKLEME_MALIYET * 250),
            enerjiKar: FORKLIFT_ENERJI_YILLIK - AGV_ENERJI_YILLIK
        };


        const forkliftSayisi = 10;
        const gerekliAgvSayisi = Math.ceil(forkliftSayisi / AGV_VERIMLILIK_KATSAYISI);
        const verimlilik = {
            forkliftSayisi,
            gerekliAgvSayisi,
            verimlilikKatsayisi: AGV_VERIMLILIK_KATSAYISI,
            isletmeKari: yillikKazanc * forkliftSayisi / gerekliAgvSayisi
        };

        return {
            forklift: forkliftToplam,
            agv: agvToplam,
            karsilastirma: {
                yillikKazanc: Math.round(yillikKazanc),
                amortismanSuresi: Math.round(amortismanSuresi * 10) / 10,
                yatirimMaliyeti: AGV_YATIRIM_MALIYETI
            },
            birimKarlar,
            verimlilik,
            detay: {
                forkliftKaza,
                agvKaza,
                forkliftBekleme: Math.round(forkliftBekleme * 10) / 10,
                agvBekleme: Math.round(agvBekleme * 10) / 10,
                forkliftIslem,
                agvIslem
            }
        };
    }




    async getSenaryoAnaliz(params = {}) {

        const {
            forkliftSayisi = 10,
            agvSayisi = 5,
            agvVerimlilik = 1.2,
            kazaMaliyeti = 15000,
            beklemeMaliyeti = 50,
            forkliftBakimCarpan = 1.0,
            agvBakimCarpan = 1.0
        } = params;


        const sonYilData = await this.query(`
            SELECT 
                l.tasima_tipi,
                SUM(l.kaza_sayisi) AS toplam_kaza,
                SUM(l.maliyet) AS toplam_maliyet,
                AVG(l.bekleme_suresi) AS ort_bekleme,
                COUNT(*) AS islem_sayisi
            FROM intralojistik l
            JOIN tarih t ON l.tarih_id = t.tarih_id
            WHERE t.yil = (SELECT MAX(yil) FROM tarih)
            GROUP BY l.tasima_tipi
        `);

        const forkliftData = sonYilData.find(d => d.tasima_tipi === 'FORKLIFT') || {};
        const agvData = sonYilData.find(d => d.tasima_tipi === 'AGV') || {};


        const dbForkliftKaza = parseInt(forkliftData.toplam_kaza) || 12;
        const dbAgvKaza = parseInt(agvData.toplam_kaza) || 2;
        const dbForkliftBekleme = parseFloat(forkliftData.ort_bekleme) || 8.5;
        const dbAgvBekleme = parseFloat(agvData.ort_bekleme) || 3.5;
        const dbForkliftMaliyet = parseFloat(forkliftData.toplam_maliyet) || 200000;
        const dbAgvMaliyet = parseFloat(agvData.toplam_maliyet) || 80000;


        const mevcutForklift = 10;
        const mevcutAgv = 5;


        const forkliftOran = forkliftSayisi / mevcutForklift;
        const agvOran = agvSayisi / mevcutAgv;


        const FORKLIFT_ISCILIK = 180000 * forkliftBakimCarpan;
        const AGV_GOZETIM = 30000 * agvBakimCarpan;
        const FORKLIFT_ENERJI = 20000 * forkliftBakimCarpan;
        const AGV_ENERJI = 8000 * agvBakimCarpan;
        const AGV_YATIRIM = 350000;


        const senaryoForkliftKaza = Math.round(dbForkliftKaza * forkliftOran);
        const senaryoAgvKaza = Math.round(dbAgvKaza * agvOran);


        const senaryoForkliftBekleme = dbForkliftBekleme * forkliftOran;
        const senaryoAgvBekleme = dbAgvBekleme * agvOran / agvVerimlilik;


        const forkliftKazaMaliyetHesap = senaryoForkliftKaza * kazaMaliyeti;
        const agvKazaMaliyetHesap = senaryoAgvKaza * kazaMaliyeti;

        const forkliftBeklemeMaliyetHesap = senaryoForkliftBekleme * 500 * beklemeMaliyeti;
        const agvBeklemeMaliyetHesap = senaryoAgvBekleme * 500 * beklemeMaliyeti;

        const forkliftToplamMaliyet = (FORKLIFT_ISCILIK + FORKLIFT_ENERJI) * forkliftOran + forkliftKazaMaliyetHesap + forkliftBeklemeMaliyetHesap;
        const agvToplamMaliyet = (AGV_GOZETIM + AGV_ENERJI) * agvOran + agvKazaMaliyetHesap + agvBeklemeMaliyetHesap;


        const iscilikTasarruf = FORKLIFT_ISCILIK * forkliftOran - AGV_GOZETIM * agvOran;
        const kazaTasarruf = forkliftKazaMaliyetHesap - agvKazaMaliyetHesap;
        const beklemeTasarruf = forkliftBeklemeMaliyetHesap - agvBeklemeMaliyetHesap;
        const enerjiTasarruf = FORKLIFT_ENERJI * forkliftOran - AGV_ENERJI * agvOran;
        const toplamTasarruf = iscilikTasarruf + kazaTasarruf + beklemeTasarruf + enerjiTasarruf;


        const yeniAgvIhtiyaci = Math.max(0, agvSayisi - mevcutAgv);
        const yatirimMaliyeti = yeniAgvIhtiyaci * AGV_YATIRIM;
        const amortismanSuresi = toplamTasarruf > 0 ? yatirimMaliyeti / toplamTasarruf : 0;


        const kazaTrendi = await this.getKazaTrendi();
        const beklemeSureleri = await this.getBeklemeTrend();
        const maliyetKarsilastirma = await this.getMaliyetKarsilastir();

        return {

            kazaTrendi,
            beklemeSureleri,
            maliyetKarsilastirma,


            senaryo: {
                forkliftKaza: senaryoForkliftKaza,
                agvKaza: senaryoAgvKaza,
                forkliftBekleme: Math.round(senaryoForkliftBekleme * 10) / 10,
                agvBekleme: Math.round(senaryoAgvBekleme * 10) / 10,
                forkliftMaliyet: Math.round(forkliftToplamMaliyet),
                agvMaliyet: Math.round(agvToplamMaliyet)
            },


            kazanimlar: {
                iscilikTasarruf: Math.round(iscilikTasarruf),
                kazaTasarruf: Math.round(kazaTasarruf),
                beklemeTasarruf: Math.round(beklemeTasarruf),
                enerjiTasarruf: Math.round(enerjiTasarruf)
            },


            ozet: {
                toplamTasarruf: Math.round(toplamTasarruf),
                yatirimMaliyeti: Math.round(yatirimMaliyeti),
                amortismanSuresi: Math.round(amortismanSuresi * 10) / 10,
                roi: yatirimMaliyeti > 0 ? Math.round((toplamTasarruf / yatirimMaliyeti) * 100) : 0
            },


            parametreler: {
                forkliftSayisi,
                agvSayisi,
                agvVerimlilik,
                kazaMaliyeti,
                beklemeMaliyeti,
                forkliftBakimCarpan,
                agvBakimCarpan
            }
        };
    }
}

module.exports = new IntralojistikModel();

