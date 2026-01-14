/**
 * Dashboard Controller v2 - Gelişmiş Kurumsal Panel
 * Operasyon Kontrol Merkezi - Tüm hesaplamalar backend'de
 */
const models = require('../models');
const { asyncHandler } = require('../middleware');

// Yardımcı: Maksimum yıl ve çeyrek
async function getMaxYilCeyrek() {
    try {
        const result = await models.tarih.query('SELECT MAX(yil) AS max_yil, MAX(ceyrek) AS max_ceyrek FROM tarih WHERE yil = (SELECT MAX(yil) FROM tarih)');
        return { yil: result[0]?.max_yil || 2025, ceyrek: result[0]?.max_ceyrek || 4 };
    } catch {
        return { yil: 2025, ceyrek: 4 };
    }
}

const DashboardController = {
    // GET /api/dashboard/overview - YÖNETİCİ ÖZET ŞERİDİ
    getOverview: asyncHandler(async (req, res) => {
        const { yil, ceyrek } = await getMaxYilCeyrek();
        const oncekiCeyrek = ceyrek > 1 ? ceyrek - 1 : 4;
        const oncekiYil = ceyrek > 1 ? yil : yil - 1;

        const data = {
            aktifHatlar: 0,
            toplamUretim: 0, uretimDegisim: 0,
            scrapOrani: 0, scrapDegisim: 0,
            kazaEndeksi: 0, kazaDegisim: 0,
            kayipMaliyet: 0, kayipDegisim: 0,
            veriGuncellikSkoru: 0,
            referansYil: yil, referansCeyrek: ceyrek
        };

        try {
            // Aktif hat sayısı
            const hatlar = await models.tarih.query(`SELECT COUNT(*) as adet FROM hat`);
            data.aktifHatlar = parseInt(hatlar[0]?.adet) || 0;

            // Toplam üretim (YTD)
            const uretimSon = await models.tarih.query(`
                SELECT SUM(gerceklesen_miktar) as toplam FROM uretim_talep ut
                JOIN tarih t ON ut.tarih_id = t.tarih_id WHERE t.yil = ?
            `, [yil]);
            const uretimOnceki = await models.tarih.query(`
                SELECT SUM(gerceklesen_miktar) as toplam FROM uretim_talep ut
                JOIN tarih t ON ut.tarih_id = t.tarih_id WHERE t.yil = ?
            `, [yil - 1]);
            data.toplamUretim = parseInt(uretimSon[0]?.toplam) || 0;
            const oncekiUretim = parseInt(uretimOnceki[0]?.toplam) || 1;
            data.uretimDegisim = Math.round(((data.toplamUretim - oncekiUretim) / oncekiUretim) * 100);

            // Scrap oranı
            const scrapSon = await models.tarih.query(`
                SELECT AVG(scrap_orani) as ort FROM kaynak_kalitesi k
                JOIN tarih t ON k.tarih_id = t.tarih_id WHERE t.yil = ? AND t.ceyrek = ?
            `, [yil, ceyrek]);
            const scrapOnceki = await models.tarih.query(`
                SELECT AVG(scrap_orani) as ort FROM kaynak_kalitesi k
                JOIN tarih t ON k.tarih_id = t.tarih_id WHERE t.yil = ? AND t.ceyrek = ?
            `, [oncekiYil, oncekiCeyrek]);
            data.scrapOrani = Math.round((parseFloat(scrapSon[0]?.ort) || 0) * 100) / 100;
            const oncekiScrap = parseFloat(scrapOnceki[0]?.ort) || 0.01;
            data.scrapDegisim = Math.round(((data.scrapOrani - oncekiScrap) / oncekiScrap) * 100);

            // Kaza yoğunluk endeksi
            const kazaSon = await models.tarih.query(`
                SELECT (SELECT COALESCE(SUM(kaza_sayisi), 0) FROM ergonomi e JOIN tarih t ON e.tarih_id = t.tarih_id WHERE t.yil = ? AND t.ceyrek = ?) +
                       (SELECT COALESCE(SUM(kaza_sayisi), 0) FROM intralojistik l JOIN tarih t ON l.tarih_id = t.tarih_id WHERE t.yil = ? AND t.ceyrek = ?) as toplam
            `, [yil, ceyrek, yil, ceyrek]);
            const kazaOnceki = await models.tarih.query(`
                SELECT (SELECT COALESCE(SUM(kaza_sayisi), 0) FROM ergonomi e JOIN tarih t ON e.tarih_id = t.tarih_id WHERE t.yil = ? AND t.ceyrek = ?) +
                       (SELECT COALESCE(SUM(kaza_sayisi), 0) FROM intralojistik l JOIN tarih t ON l.tarih_id = t.tarih_id WHERE t.yil = ? AND t.ceyrek = ?) as toplam
            `, [oncekiYil, oncekiCeyrek, oncekiYil, oncekiCeyrek]);
            data.kazaEndeksi = parseInt(kazaSon[0]?.toplam) || 0;
            const oncekiKaza = parseInt(kazaOnceki[0]?.toplam) || 1;
            data.kazaDegisim = Math.round(((data.kazaEndeksi - oncekiKaza) / oncekiKaza) * 100);

            // Kayıp maliyet
            const kayipSon = await models.tarih.query(`
                SELECT 
                    (SELECT COALESCE(SUM(scrap_orani * 15000), 0) FROM kaynak_kalitesi k JOIN tarih t ON k.tarih_id = t.tarih_id WHERE t.yil = ?) +
                    (SELECT COALESCE(SUM(kaza_sayisi * 8000), 0) FROM ergonomi e JOIN tarih t ON e.tarih_id = t.tarih_id WHERE t.yil = ?) +
                    (SELECT COALESCE(SUM(bekleme_suresi * 1000), 0) FROM intralojistik l JOIN tarih t ON l.tarih_id = t.tarih_id WHERE t.yil = ?) as toplam
            `, [yil, yil, yil]);
            data.kayipMaliyet = Math.round(parseFloat(kayipSon[0]?.toplam) || 0);

            // Veri güncellik skoru
            const sonAy = await models.tarih.query(`SELECT MAX(ay) as ay FROM tarih WHERE yil = ?`, [yil]);
            data.veriGuncellikSkoru = Math.round(((sonAy[0]?.ay || 1) / 12) * 100);

            // --- YENİ KPI KARTLARI ---

            // --- YENİ KPI KARTLARI (2025 ODAKLI) ---
            const kpiYil = 2025;

            // 1. En Çok Satılan Araç
            const populerArac = await models.tarih.query(`
                SELECT m.model_adi, SUM(ut.gerceklesen_miktar) as toplam 
                FROM uretim_talep ut
                JOIN model m ON ut.model_id = m.model_id
                JOIN tarih t ON ut.tarih_id = t.tarih_id
                WHERE t.yil = ?
                GROUP BY m.model_id, m.model_adi
                ORDER BY toplam DESC
                LIMIT 1
            `, [kpiYil]);
            data.enCokSatan = {
                model: populerArac[0]?.model_adi || 'Veri Yok',
                adet: parseInt(populerArac[0]?.toplam) || 0,
                metin: populerArac[0] ? `2025 Lideri: ${populerArac[0].model_adi}` : '2025 Verisi Yok'
            };

            // 2. Alternatif Tedarikçi (Riskli Sayısı)
            // 2. Tedarikçi KPI (Sözleşme Yenileme Mesajı)
            const toplamTedarikci = await models.tarih.query(`SELECT COUNT(*) as adet FROM tedarikci`);
            const tdCount = parseInt(toplamTedarikci[0]?.adet) || 0;
            data.riskliTedarikci = {
                sayi: tdCount,
                metin: 'Tedarikçilerle sözleşme yenileme süresi yaklaşıyor'
            };

            // 3. Bakım/Yatırım Gerektiren Robot
            const sorunluRobotlar = await models.tarih.query(`
                SELECT COUNT(DISTINCT r.robot_id) as adet
                FROM robot r
                LEFT JOIN kaynak_kalitesi k ON r.robot_id = k.robot_id
                LEFT JOIN robot_bakim rb ON r.robot_id = rb.robot_id
                LEFT JOIN tarih t ON k.tarih_id = t.tarih_id
                WHERE t.yil = ? AND (k.scrap_orani > 2.5 OR rb.maliyet > 20000)
            `, [kpiYil]);
            const rbCount = parseInt(sorunluRobotlar[0]?.adet) || 0;
            data.robotKPI = {
                sayi: rbCount,
                metin: rbCount > 0 ? `${rbCount} Adet Robot Bakım/Yatırım Gerekli` : 'Tüm Robotlar Stabil'
            };

            // 4. Lojistik: AGV Geçiş Önerisi
            const lojistikAnaliz = await models.tarih.query(`
                SELECT SUM(kaza_sayisi) as kaza
                FROM intralojistik l
                JOIN tarih t ON l.tarih_id = t.tarih_id
                WHERE t.yil = ? AND l.tasima_tipi = 'FORKLIFT'
            `, [kpiYil]);
            const forkliftKaza = parseInt(lojistikAnaliz[0]?.kaza) || 0;
            data.agvOnerisi = forkliftKaza > 0 ? "AGV'ye Geçiş Hızla Değerlendirilmeli" : "Lojistik Süreç Stabil";

            // ------------------------

        } catch (error) {
            console.error('Dashboard overview hatası:', error.message);
        }

        res.json({ success: true, data });
    }),

    // GET /api/dashboard/saglik-haritasi - OPERASYON SAĞLIK HARİTASI
    getSaglikHaritasi: asyncHandler(async (req, res) => {
        const data = { ceyrekler: [], uretim: [], scrap: [], kaza: [], teslimat: [] };

        try {
            const sonuc = await models.tarih.query(`
                SELECT DISTINCT yil, ceyrek FROM tarih WHERE yil >= 2022 ORDER BY yil, ceyrek
            `);

            for (const r of sonuc) {
                data.ceyrekler.push(`${r.yil}-Ç${r.ceyrek}`);

                // Üretim
                const uretim = await models.tarih.query(`
                    SELECT SUM(gerceklesen_miktar) as toplam FROM uretim_talep ut
                    JOIN tarih t ON ut.tarih_id = t.tarih_id WHERE t.yil = ? AND t.ceyrek = ?
                `, [r.yil, r.ceyrek]);
                data.uretim.push(parseInt(uretim[0]?.toplam) || 0);

                // Scrap
                const scrap = await models.tarih.query(`
                    SELECT AVG(scrap_orani) as ort FROM kaynak_kalitesi k
                    JOIN tarih t ON k.tarih_id = t.tarih_id WHERE t.yil = ? AND t.ceyrek = ?
                `, [r.yil, r.ceyrek]);
                data.scrap.push(Math.round((parseFloat(scrap[0]?.ort) || 0) * 100) / 100);

                // Kaza
                const kaza = await models.tarih.query(`
                    SELECT (SELECT COALESCE(SUM(kaza_sayisi), 0) FROM ergonomi e JOIN tarih t ON e.tarih_id = t.tarih_id WHERE t.yil = ? AND t.ceyrek = ?) +
                           (SELECT COALESCE(SUM(kaza_sayisi), 0) FROM intralojistik l JOIN tarih t ON l.tarih_id = t.tarih_id WHERE t.yil = ? AND t.ceyrek = ?) as toplam
                `, [r.yil, r.ceyrek, r.yil, r.ceyrek]);
                data.kaza.push(parseInt(kaza[0]?.toplam) || 0);

                // Teslimat
                const teslimat = await models.tarih.query(`
                    SELECT AVG(teslimat_suresi) as ort FROM tedarikci_kalite tk
                    JOIN tarih t ON tk.tarih_id = t.tarih_id WHERE t.yil = ? AND t.ceyrek = ?
                `, [r.yil, r.ceyrek]);
                data.teslimat.push(Math.round((parseFloat(teslimat[0]?.ort) || 0) * 10) / 10);
            }

        } catch (error) {
            console.error('Sağlık haritası hatası:', error.message);
        }

        res.json({ success: true, data });
    }),

    // GET /api/dashboard/kayip-ekonomisi - KAYIP EKONOMİSİ PANELİ
    getKayipEkonomisi: asyncHandler(async (req, res) => {
        const { yil } = await getMaxYilCeyrek();
        const data = { ceyrekler: [], scrap: [], kaza: [], bekleme: [], tedarik: [], toplamKayip: 0, uretimiOrani: 0 };

        try {
            for (let c = 1; c <= 4; c++) {
                data.ceyrekler.push(`Ç${c}`);

                const scrap = await models.tarih.query(`
                    SELECT COALESCE(SUM(scrap_orani * 15000), 0) as maliyet FROM kaynak_kalitesi k
                    JOIN tarih t ON k.tarih_id = t.tarih_id WHERE t.yil = ? AND t.ceyrek = ?
                `, [yil, c]);
                data.scrap.push(Math.round(parseFloat(scrap[0]?.maliyet) || 0));

                const kaza = await models.tarih.query(`
                    SELECT COALESCE(SUM(kaza_sayisi * 8000), 0) as maliyet FROM ergonomi e
                    JOIN tarih t ON e.tarih_id = t.tarih_id WHERE t.yil = ? AND t.ceyrek = ?
                `, [yil, c]);
                data.kaza.push(Math.round(parseFloat(kaza[0]?.maliyet) || 0));

                const bekleme = await models.tarih.query(`
                    SELECT COALESCE(SUM(bekleme_suresi * 1000), 0) as maliyet FROM intralojistik l
                    JOIN tarih t ON l.tarih_id = t.tarih_id WHERE t.yil = ? AND t.ceyrek = ?
                `, [yil, c]);
                data.bekleme.push(Math.round(parseFloat(bekleme[0]?.maliyet) || 0));

                const tedarik = await models.tarih.query(`
                    SELECT COALESCE(SUM(teslimat_suresi * 2000), 0) as maliyet FROM tedarikci_kalite tk
                    JOIN tarih t ON tk.tarih_id = t.tarih_id WHERE t.yil = ? AND t.ceyrek = ?
                `, [yil, c]);
                data.tedarik.push(Math.round(parseFloat(tedarik[0]?.maliyet) || 0));
            }

            data.toplamKayip = data.scrap.reduce((a, b) => a + b, 0) + data.kaza.reduce((a, b) => a + b, 0) +
                data.bekleme.reduce((a, b) => a + b, 0) + data.tedarik.reduce((a, b) => a + b, 0);

            // Üretim değeri
            const uretimDeger = await models.tarih.query(`
                SELECT SUM(gerceklesen_miktar * 45000) as deger FROM uretim_talep ut
                JOIN tarih t ON ut.tarih_id = t.tarih_id WHERE t.yil = ?
            `, [yil]);
            const toplamUretimDeger = parseFloat(uretimDeger[0]?.deger) || 1;
            data.uretimiOrani = Math.round((data.toplamKayip / toplamUretimDeger) * 100 * 10) / 10;

        } catch (error) {
            console.error('Kayıp ekonomisi hatası:', error.message);
        }

        res.json({ success: true, data });
    }),

    // GET /api/dashboard/kayip-kaynak - KAYIP KAYNAĞI DERİNLİĞİ
    getKayipKaynak: asyncHandler(async (req, res) => {
        const { yil } = await getMaxYilCeyrek();
        const data = {
            ana: { insan: 0, robot: 0, sistem: 0, tedarikci: 0 },
            detay: {}
        };

        try {
            // İnsan kaynaklı
            const insan = await models.tarih.query(`
                SELECT SUM(kaza_sayisi) as toplam FROM ergonomi e
                JOIN tarih t ON e.tarih_id = t.tarih_id WHERE t.yil = ?
            `, [yil]);
            data.ana.insan = parseInt(insan[0]?.toplam) || 0;

            // Robot kaynaklı
            const robot = await models.tarih.query(`
                SELECT SUM(ariza_sayisi) as toplam FROM robot_bakim rb
                JOIN tarih t ON rb.tarih_id = t.tarih_id WHERE t.yil = ?
            `, [yil]);
            data.ana.robot = parseInt(robot[0]?.toplam) || 0;

            // Sistem (lojistik) kaynaklı
            const sistem = await models.tarih.query(`
                SELECT SUM(kaza_sayisi) as toplam FROM intralojistik l
                JOIN tarih t ON l.tarih_id = t.tarih_id WHERE t.yil = ?
            `, [yil]);
            data.ana.sistem = parseInt(sistem[0]?.toplam) || 0;

            // Tedarikçi kaynaklı
            const tedarikci = await models.tarih.query(`
                SELECT SUM(ppm_orani) as toplam FROM tedarikci_kalite tk
                JOIN tarih t ON tk.tarih_id = t.tarih_id WHERE t.yil = ?
            `, [yil]);
            data.ana.tedarikci = Math.round(parseFloat(tedarikci[0]?.toplam) || 0);

            // Detaylar
            // İnsan detay (yaş grubu)
            const insanDetay = await models.tarih.query(`
                SELECT yas_grubu, SUM(kaza_sayisi) as toplam FROM ergonomi
                GROUP BY yas_grubu ORDER BY toplam DESC
            `);
            data.detay.insan = insanDetay.map(d => ({ ad: d.yas_grubu, deger: parseInt(d.toplam) || 0 }));

            // Robot detay (tip)
            const robotDetay = await models.tarih.query(`
                SELECT r.robot_tipi, SUM(rb.ariza_sayisi) as toplam
                FROM robot_bakim rb JOIN robot r ON rb.robot_id = r.robot_id
                GROUP BY r.robot_tipi ORDER BY toplam DESC
            `);
            data.detay.robot = robotDetay.map(d => ({ ad: d.robot_tipi, deger: parseInt(d.toplam) || 0 }));

            // Sistem detay (taşıma tipi)
            const sistemDetay = await models.tarih.query(`
                SELECT tasima_tipi, SUM(kaza_sayisi) as toplam FROM intralojistik
                GROUP BY tasima_tipi ORDER BY toplam DESC
            `);
            data.detay.sistem = sistemDetay.map(d => ({ ad: d.tasima_tipi, deger: parseInt(d.toplam) || 0 }));

        } catch (error) {
            console.error('Kayıp kaynak hatası:', error.message);
        }

        res.json({ success: true, data });
    }),

    // GET /api/dashboard/kritik-noktalar - KRİTİK NOKTA LİSTESİ
    getKritikNoktalar: asyncHandler(async (req, res) => {
        const data = { robotlar: [], istasyonlar: [], tedarikciler: [] };

        try {
            // En riskli 5 robot
            const robotlar = await models.tarih.query(`
                SELECT r.robot_kodu, r.robot_tipi, SUM(rb.ariza_sayisi) as ariza, AVG(k.scrap_orani) as scrap
                FROM robot r
                LEFT JOIN robot_bakim rb ON r.robot_id = rb.robot_id
                LEFT JOIN kaynak_kalitesi k ON r.robot_id = k.robot_id
                GROUP BY r.robot_id, r.robot_kodu, r.robot_tipi
                ORDER BY (COALESCE(SUM(rb.ariza_sayisi), 0) * 10 + COALESCE(AVG(k.scrap_orani), 0) * 100) DESC
                LIMIT 5
            `);
            data.robotlar = robotlar.map(r => ({
                ad: r.robot_kodu, tip: r.robot_tipi,
                ariza: parseInt(r.ariza) || 0, scrap: Math.round((parseFloat(r.scrap) || 0) * 100) / 100
            }));

            // En riskli 5 istasyon
            const istasyonlar = await models.tarih.query(`
                SELECT i.istasyon_adi, SUM(e.kaza_sayisi) as kaza, AVG(e.risk_skoru) as risk
                FROM istasyon i JOIN ergonomi e ON i.istasyon_id = e.istasyon_id
                GROUP BY i.istasyon_id, i.istasyon_adi
                ORDER BY SUM(e.kaza_sayisi) DESC
                LIMIT 5
            `);
            data.istasyonlar = istasyonlar.map(i => ({
                ad: i.istasyon_adi, kaza: parseInt(i.kaza) || 0, risk: Math.round((parseFloat(i.risk) || 0) * 10) / 10
            }));

            // En problemli 5 tedarikçi
            const tedarikciler = await models.tarih.query(`
                SELECT t.tedarikci_adi, AVG(tk.ppm_orani) as hata, AVG(tk.teslimat_suresi) as gecikme
                FROM tedarikci t JOIN tedarikci_kalite tk ON t.tedarikci_id = tk.tedarikci_id
                GROUP BY t.tedarikci_id, t.tedarikci_adi
                ORDER BY (AVG(tk.ppm_orani) + AVG(tk.teslimat_suresi)) DESC
                LIMIT 5
            `);
            data.tedarikciler = tedarikciler.map(t => ({
                ad: t.tedarikci_adi, hata: Math.round((parseFloat(t.hata) || 0) * 10) / 10,
                gecikme: Math.round((parseFloat(t.gecikme) || 0) * 10) / 10
            }));

        } catch (error) {
            console.error('Kritik noktalar hatası:', error.message);
        }

        res.json({ success: true, data });
    }),

    // GET /api/dashboard/veri-guveni - VERİ GÜVENİ PANELİ
    getVeriGuveni: asyncHandler(async (req, res) => {
        const data = { sonGiris: '', kullanicilar: [], eksikModuller: [] };

        try {
            // Son veri giriş tarihi
            const sonTarih = await models.tarih.query(`SELECT MAX(yil) as yil, MAX(ay) as ay FROM tarih`);
            if (sonTarih[0]) {
                const aylar = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                data.sonGiris = `${sonTarih[0].ay ? aylar[sonTarih[0].ay] : ''} ${sonTarih[0].yil}`;
            }

            // Kullanıcılar
            try {
                const kullanicilar = await models.tarih.query(`SELECT ad_soyad, rol FROM kullanici LIMIT 5`);
                data.kullanicilar = kullanicilar.map(k => ({ ad: k.ad_soyad, rol: k.rol }));
            } catch {
                data.kullanicilar = [{ ad: 'Sistem Yöneticisi', rol: 'Admin' }];
            }

            // Eksik modüller (basit kontrol)
            const maxYil = sonTarih[0]?.yil || 2025;
            const kontroller = [
                { modul: 'Üretim', tablo: 'uretim_talep' },
                { modul: 'Kaynak', tablo: 'kaynak_kalitesi' },
                { modul: 'Ergonomi', tablo: 'ergonomi' },
                { modul: 'Lojistik', tablo: 'intralojistik' }
            ];

            for (const k of kontroller) {
                const sayim = await models.tarih.query(`
                    SELECT COUNT(*) as adet FROM ${k.tablo} x
                    JOIN tarih t ON x.tarih_id = t.tarih_id WHERE t.yil = ?
                `, [maxYil]);
                if ((parseInt(sayim[0]?.adet) || 0) < 10) {
                    data.eksikModuller.push(k.modul);
                }
            }

        } catch (error) {
            console.error('Veri güveni hatası:', error.message);
        }

        res.json({ success: true, data });
    }),

    // GET /api/dashboard/hedef-gerceklesen - HEDEF – GERÇEKLEŞEN – GELECEK
    getHedefGerceklesen: asyncHandler(async (req, res) => {
        const { yil } = await getMaxYilCeyrek();
        const data = {
            hedefler: { scrap: 2.0, kaza: 50, uretim: 150000, teslimat: 3.0 },
            gerceklesen: { scrap: 0, kaza: 0, uretim: 0, teslimat: 0 },
            sapma: { scrap: 0, kaza: 0, uretim: 0, teslimat: 0 },
            projeksiyon2026: { scrap: 0, kaza: 0, uretim: 0 },
            uyarilar: []
        };

        try {
            // Gerçekleşenler
            const scrap = await models.tarih.query(`
                SELECT AVG(scrap_orani) as ort FROM kaynak_kalitesi k
                JOIN tarih t ON k.tarih_id = t.tarih_id WHERE t.yil = ?
            `, [yil]);
            data.gerceklesen.scrap = Math.round((parseFloat(scrap[0]?.ort) || 0) * 100) / 100;

            const kaza = await models.tarih.query(`
                SELECT (SELECT COALESCE(SUM(kaza_sayisi), 0) FROM ergonomi e JOIN tarih t ON e.tarih_id = t.tarih_id WHERE t.yil = ?) +
                       (SELECT COALESCE(SUM(kaza_sayisi), 0) FROM intralojistik l JOIN tarih t ON l.tarih_id = t.tarih_id WHERE t.yil = ?) as toplam
            `, [yil, yil]);
            data.gerceklesen.kaza = parseInt(kaza[0]?.toplam) || 0;

            const uretim = await models.tarih.query(`
                SELECT SUM(gerceklesen_miktar) as toplam FROM uretim_talep ut
                JOIN tarih t ON ut.tarih_id = t.tarih_id WHERE t.yil = ?
            `, [yil]);
            data.gerceklesen.uretim = parseInt(uretim[0]?.toplam) || 0;

            const teslimat = await models.tarih.query(`
                SELECT AVG(teslimat_suresi) as ort FROM tedarikci_kalite tk
                JOIN tarih t ON tk.tarih_id = t.tarih_id WHERE t.yil = ?
            `, [yil]);
            data.gerceklesen.teslimat = Math.round((parseFloat(teslimat[0]?.ort) || 0) * 10) / 10;

            // Sapma hesapla
            data.sapma.scrap = Math.round(((data.gerceklesen.scrap - data.hedefler.scrap) / data.hedefler.scrap) * 100);
            data.sapma.kaza = Math.round(((data.gerceklesen.kaza - data.hedefler.kaza) / data.hedefler.kaza) * 100);
            data.sapma.uretim = Math.round(((data.gerceklesen.uretim - data.hedefler.uretim) / data.hedefler.uretim) * 100);
            data.sapma.teslimat = Math.round(((data.gerceklesen.teslimat - data.hedefler.teslimat) / data.hedefler.teslimat) * 100);

            // 2026 projeksiyonu (son 2 yıl trendi)
            const trendScrap = await models.tarih.query(`
                SELECT t.yil, AVG(k.scrap_orani) as ort FROM kaynak_kalitesi k
                JOIN tarih t ON k.tarih_id = t.tarih_id WHERE t.yil >= ?
                GROUP BY t.yil ORDER BY t.yil
            `, [yil - 1]);
            if (trendScrap.length >= 2) {
                const degisim = (parseFloat(trendScrap[1]?.ort) || 0) - (parseFloat(trendScrap[0]?.ort) || 0);
                data.projeksiyon2026.scrap = Math.round((data.gerceklesen.scrap + degisim) * 100) / 100;
            }

            // Uyarılar
            if (data.sapma.scrap > 10) data.uyarilar.push('Scrap oranı hedefin %' + data.sapma.scrap + ' üzerinde');
            if (data.sapma.kaza > 20) data.uyarilar.push('Kaza sayısı hedefin %' + data.sapma.kaza + ' üzerinde');
            if (data.sapma.uretim < -10) data.uyarilar.push('Üretim hedefin %' + Math.abs(data.sapma.uretim) + ' altında');

        } catch (error) {
            console.error('Hedef gerçekleşen hatası:', error.message);
        }

        res.json({ success: true, data });
    }),

    // Eski endpoint'ler (uyumluluk)
    getTrend: asyncHandler(async (req, res) => {
        return DashboardController.getSaglikHaritasi(req, res);
    }),
    getKayipDagilim: asyncHandler(async (req, res) => {
        return DashboardController.getKayipEkonomisi(req, res);
    }),
    getVeriGuncellik: asyncHandler(async (req, res) => {
        return DashboardController.getVeriGuveni(req, res);
    }),
    getHedefTahmin: asyncHandler(async (req, res) => {
        return DashboardController.getHedefGerceklesen(req, res);
    })
};

module.exports = DashboardController;
