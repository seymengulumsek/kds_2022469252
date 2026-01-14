/**
 * İntralojistik Model - Lojistik verileri
 * Veritabanı şemasına tam uyumlu: kaza_sayisi, bekleme_suresi, maliyet
 */
const BaseModel = require('./BaseModel');

class IntralojistikModel extends BaseModel {
    constructor() {
        super('intralojistik', 'lojistik_id');
    }

    // Kaza trendi
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

    // Bekleme trendi
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

    // Maliyet karşılaştırma
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

    // Tip dağılımı
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

    // Yıllık trend
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

    // ============================================
    // AGV KAZANÇ ANALİZİ
    // ============================================

    // AGV'ye geçişin sağladığı kazançları hesapla
    async getAgvKazancAnalizi() {
        // Son yıl verilerini al
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

        // Birim maliyetler (veritabanından, bakım hariç)
        const KAZA_BASI_MALIYET = 15000; // ₺
        const DAKIKA_BASI_BEKLEME_MALIYET = 50; // ₺
        const FORKLIFT_ISCILIK_YILLIK = 180000; // ₺ (operatör maaşı)
        const AGV_GOZETIM_YILLIK = 30000; // ₺ (minimum gözetim)
        const FORKLIFT_ENERJI_YILLIK = 20000; // ₺ (yakıt)
        const AGV_ENERJI_YILLIK = 8000; // ₺ (elektrik)
        const AGV_YATIRIM_MALIYETI = 350000; // ₺
        const AGV_VERIMLILIK_KATSAYISI = 1.5; // 1 AGV = 1.5 Forklift kapasitesi

        // Forklift ve AGV verilerini ayır
        const forkliftData = sonYilData.find(d => d.tasima_tipi === 'FORKLIFT') || {};
        const agvData = sonYilData.find(d => d.tasima_tipi === 'AGV') || {};

        // Forklift maliyet bileşenleri (varsayılan değerlerle)
        const forkliftKaza = parseInt(forkliftData.toplam_kaza) || 12; // Varsayılan 12 kaza
        const forkliftBekleme = parseFloat(forkliftData.ort_bekleme) || 8.5; // Varsayılan 8.5 dk
        const forkliftIslem = parseInt(forkliftData.islem_sayisi) || 500; // Varsayılan 500 işlem

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

        // AGV maliyet bileşenleri (forklift'in %30'u kaza, %50 bekleme)
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

        // Kazanç hesapla
        const yillikKazanc = forkliftToplam.toplam - agvToplam.toplam;
        const amortismanSuresi = yillikKazanc > 0 ? AGV_YATIRIM_MALIYETI / yillikKazanc : 0;

        // Birim kar hesapları - SADECE KAZA FARKI
        const birimKarlar = {
            iscilikKar: FORKLIFT_ISCILIK_YILLIK - AGV_GOZETIM_YILLIK,
            kazaKar: (forkliftKaza - agvKaza) * KAZA_BASI_MALIYET,
            beklemeKar: Math.round((forkliftBekleme - agvBekleme) * DAKIKA_BASI_BEKLEME_MALIYET * 250), // 250 iş günü
            enerjiKar: FORKLIFT_ENERJI_YILLIK - AGV_ENERJI_YILLIK
        };

        // AGV verimlilik: Kaç AGV kaç forklift işi yapıyor
        const forkliftSayisi = 10; // Varsayılan forklift sayısı
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

    // ============================================
    // SENARYO ANALIZI - Parametreli Hesaplama
    // ============================================
    async getSenaryoAnaliz(params = {}) {
        // Varsayilan parametreler
        const {
            forkliftSayisi = 10,
            agvSayisi = 5,
            agvVerimlilik = 1.2,
            kazaMaliyeti = 15000,
            beklemeMaliyeti = 50,
            forkliftBakimCarpan = 1.0,
            agvBakimCarpan = 1.0
        } = params;

        // Veritabanından gerçek verileri al
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

        // Veritabanından gelen verileri al
        const dbForkliftKaza = parseInt(forkliftData.toplam_kaza) || 12;
        const dbAgvKaza = parseInt(agvData.toplam_kaza) || 2;
        const dbForkliftBekleme = parseFloat(forkliftData.ort_bekleme) || 8.5;
        const dbAgvBekleme = parseFloat(agvData.ort_bekleme) || 3.5;
        const dbForkliftMaliyet = parseFloat(forkliftData.toplam_maliyet) || 200000;
        const dbAgvMaliyet = parseFloat(agvData.toplam_maliyet) || 80000;

        // Mevcut araç sayıları (DB'den varsayım)
        const mevcutForklift = 10;
        const mevcutAgv = 5;

        // Ölçekleme faktörleri
        const forkliftOran = forkliftSayisi / mevcutForklift;
        const agvOran = agvSayisi / mevcutAgv;

        // Sabit maliyetler
        const FORKLIFT_ISCILIK = 180000 * forkliftBakimCarpan;
        const AGV_GOZETIM = 30000 * agvBakimCarpan;
        const FORKLIFT_ENERJI = 20000 * forkliftBakimCarpan;
        const AGV_ENERJI = 8000 * agvBakimCarpan;
        const AGV_YATIRIM = 350000;

        // Senaryo bazlı hesaplamalar
        const senaryoForkliftKaza = Math.round(dbForkliftKaza * forkliftOran);
        const senaryoAgvKaza = Math.round(dbAgvKaza * agvOran);

        // Bekleme: AGV verimliliği arttıkça bekleme azalır
        const senaryoForkliftBekleme = dbForkliftBekleme * forkliftOran;
        const senaryoAgvBekleme = dbAgvBekleme * agvOran / agvVerimlilik;

        // Maliyet hesaplamaları
        const forkliftKazaMaliyetHesap = senaryoForkliftKaza * kazaMaliyeti;
        const agvKazaMaliyetHesap = senaryoAgvKaza * kazaMaliyeti;

        const forkliftBeklemeMaliyetHesap = senaryoForkliftBekleme * 500 * beklemeMaliyeti; // 500 islem
        const agvBeklemeMaliyetHesap = senaryoAgvBekleme * 500 * beklemeMaliyeti;

        const forkliftToplamMaliyet = (FORKLIFT_ISCILIK + FORKLIFT_ENERJI) * forkliftOran + forkliftKazaMaliyetHesap + forkliftBeklemeMaliyetHesap;
        const agvToplamMaliyet = (AGV_GOZETIM + AGV_ENERJI) * agvOran + agvKazaMaliyetHesap + agvBeklemeMaliyetHesap;

        // Kazanım hesaplamaları
        const iscilikTasarruf = FORKLIFT_ISCILIK * forkliftOran - AGV_GOZETIM * agvOran;
        const kazaTasarruf = forkliftKazaMaliyetHesap - agvKazaMaliyetHesap;
        const beklemeTasarruf = forkliftBeklemeMaliyetHesap - agvBeklemeMaliyetHesap;
        const enerjiTasarruf = FORKLIFT_ENERJI * forkliftOran - AGV_ENERJI * agvOran;
        const toplamTasarruf = iscilikTasarruf + kazaTasarruf + beklemeTasarruf + enerjiTasarruf;

        // AGV yatırım geri dönüş
        const yeniAgvIhtiyaci = Math.max(0, agvSayisi - mevcutAgv);
        const yatirimMaliyeti = yeniAgvIhtiyaci * AGV_YATIRIM;
        const amortismanSuresi = toplamTasarruf > 0 ? yatirimMaliyeti / toplamTasarruf : 0;

        // Grafik verileri
        const kazaTrendi = await this.getKazaTrendi();
        const beklemeSureleri = await this.getBeklemeTrend();
        const maliyetKarsilastirma = await this.getMaliyetKarsilastir();

        return {
            // Grafik verileri
            kazaTrendi,
            beklemeSureleri,
            maliyetKarsilastirma,

            // Senaryo sonuçları
            senaryo: {
                forkliftKaza: senaryoForkliftKaza,
                agvKaza: senaryoAgvKaza,
                forkliftBekleme: Math.round(senaryoForkliftBekleme * 10) / 10,
                agvBekleme: Math.round(senaryoAgvBekleme * 10) / 10,
                forkliftMaliyet: Math.round(forkliftToplamMaliyet),
                agvMaliyet: Math.round(agvToplamMaliyet)
            },

            // Kazanım kırılımları (4. grafik için)
            kazanimlar: {
                iscilikTasarruf: Math.round(iscilikTasarruf),
                kazaTasarruf: Math.round(kazaTasarruf),
                beklemeTasarruf: Math.round(beklemeTasarruf),
                enerjiTasarruf: Math.round(enerjiTasarruf)
            },

            // Özet
            ozet: {
                toplamTasarruf: Math.round(toplamTasarruf),
                yatirimMaliyeti: Math.round(yatirimMaliyeti),
                amortismanSuresi: Math.round(amortismanSuresi * 10) / 10,
                roi: yatirimMaliyeti > 0 ? Math.round((toplamTasarruf / yatirimMaliyeti) * 100) : 0
            },

            // Uygulanan parametreler (debug için)
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

