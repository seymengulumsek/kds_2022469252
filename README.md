# Mercedes-Benz Karar Destek Sistemi (KDS) v3.0

Bu proje, Mercedes-Benz üretim tesisi için geliştirilmiş, 3. Normal Form (3NF) veritabanı mimarisine sahip kapsamlı bir web tabanlı Karar Destek Sistemidir. Sistem; Üretim, Tedarik, Kaynak ve Lojistik süreçlerini izleyerek yönetimsel kararlara yardımcı olacak görselleştirmeler ve tahminlemeler sunar.

![KDS Dashboard](https://via.placeholder.com/800x400?text=Mercedes-Benz+KDS+Dashboard)

## 🎯 Senaryo ve Özellikler

Proje 5 ana modülden oluşur:

### 1. Ana Panel (Dashboard)
*   **Genel Bakış:** Sistemin genel sağlık durumunu, API bağlantılarını ve modüller arası veri akışını gösterir.
*   **KPI Kartları:** 2025 yılına özgü kritik performans göstergeleri (Riskli Tedarikçiler, Robot Yatırımları vb.) özetlenir.
*   **Kompakt Grafikler:** Sistem aktivitesi ve sayfa kullanım dağılımı görselleştirilir.

### 2. Üretim (Production)
*   İstasyon bazlı üretim gerçekleşme oranları.
*   Hat dengeleme ve verimlilik analizleri.
*   2024-2025 yılı hedef/gerçekleşme karşılaştırmaları.
*   **KPI Kartları:** OEE, Üretim Hızı, Hata Oranı gibi metrikler.

### 3. Tedarikçi (Supplier)
*   **Tedarikçi Risk Analizi:** Kalite (<85), PPM (>500) ve Teslimat Gecikmesi (>1.5 hafta) kriterlerine göre riskli tedarikçileri belirler.
*   **Sabit Tarih Aralığı:** Analizler 2021-2025 yılları arasındaki verilerle sınırlandırılmıştır (kullanıcı seçimi kaldırıldı).
*   **Karar Destek Mesajları:** "Sözleşme yenileme süresi yaklaşıyor" gibi otomatik uyarılar.

### 4. Kaynak (Welding)
*   **Robot Bakım ve Yatırım:**
    *   **K-14 Robotu:** 2017, 2020, 2023 yıllarında bakım yapılmıştır. Bakım yapılan yılın ertesinde scrap oranında %25 düşüş simüle edilmiştir (Testere dişi modeli).
    *   **K-20 Robotu:** Yeni robot, 2023'te bakım görmüş. Bakım iyileşme tahmini sabit %25, yatırım iyileşme tahmini sabit %35'tir.
    *   **Diğer Robotlar:** Bakım sıklığına göre dinamik iyileşme tahminleri (>2 bakım: %10, <=1 bakım: %25).

### 5. Lojistik (Logistics)
*   AGV (Otomatik Yönlendirmeli Araç) kullanım verimliliği.
*   İntralojistik maliyet analizleri.

---

## 🛠️ Kurulum Adımları

Bu projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

### Ön Gereksinimler
*   [Node.js](https://nodejs.org/) (v14 veya üzeri)
*   [MySQL Server](https://dev.mysql.com/downloads/mysql/) (veya WAMP/XAMPP)

### 1. Repoyu Klonlayın
```bash
git clone <repo-url>
cd mercedes-kds
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Veritabanını Hazırlayın
*   MySQL'de `mercedes_kds` adında bir veritabanı oluşturun.
*   `database/` klasöründeki `.sql` dosyalarını (özellikle ana şema ve verileri içeren dosyayı) import edin.

### 4. Konfigürasyon
Kök dizindeki `.env.example` dosyasının adını `.env` olarak değiştirin ve veritabanı bilgilerinizi girin:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sifreniz
DB_NAME=mercedes_kds
```

### 5. Uygulamayı Başlatın
```bash
# Normal mod
npm start

# Geliştirici modu (nodemon)
npm run dev
```
Uygulama `http://localhost:3000` adresinde çalışacaktır.

---

## 🔌 API Endpoint Listesi

Tüm API'ler `/api` öneki altında toplanmıştır (`routes/index.js`).

| Modül | Yöntem | Endpoint | Açıklama |
| :--- | :--- | :--- | :--- |
| **Genel** | GET | `/api/health` | Sistem ve DB sağlık durumu |
| **Üretim** | GET | `/api/uretim/istasyon-bazli` | İstasyon üretim verileri |
| | GET | `/api/uretim/targets-2025` | 2025 hedefleri |
| **Tedarik** | GET | `/api/tedarikci/liste` | Tedarikçi listesi |
| | GET | `/api/tedarikci/kalite-trendi/:id` | Yıllık kalite puanları |
| | GET | `/api/tedarikci/ppm-trendi/:id` | PPM değişim oranları |
| **Kaynak** | GET | `/api/kaynak/robot-bakim-gecmisi` | K-serisi robotların bakım yılları |
| | GET | `/api/kaynak/bakim-yatirim-analiz` | İyileşme/Yatırım tahminleri |
| | GET | `/api/kaynak/robot-scrap-trendi` | Scrap oranları (K-14 senaryosu dahil) |
| **Lojistik**| GET | `/api/lojistik/agv-verimi` | AGV kullanım istatistikleri |
| **Dash.** | GET | `/api/dashboard/overview` | Ana panel özet verileri |

---

```


---

### Teknoloji Yığını
*   **Backend:** Node.js, Express.js
*   **Veritabanı:** MySQL (mysql2 modülü ile bağlantı havuzu)
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript, Chart.js
*   **Mimari:** MVC (Model-View-Controller)

---

