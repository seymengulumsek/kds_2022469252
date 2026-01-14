/**
 * Forecast Helper - Tahmin hesaplama fonksiyonları
 * DB'den gelen son veriye göre gelecek tahmini yapar
 */

const ForecastHelper = {
    /**
     * Lineer tahmin hesapla
     * @param {number} baseValue - Son gerçek değer (DB'den)
     * @param {number} changePercent - Artış/azalış yüzdesi
     * @param {number} months - Tahmin süresi (ay)
     * @returns {Array} Aylık tahmin dizisi
     */
    linear(baseValue, changePercent, months) {
        const result = [];
        const monthlyChange = changePercent / 12; // Yıllık yüzdeyi aylığa çevir

        for (let i = 1; i <= months; i++) {
            const value = baseValue * (1 + (monthlyChange * i) / 100);
            result.push({
                month: i,
                value: Math.round(value * 100) / 100
            });
        }
        return result;
    },

    /**
     * Bileşik tahmin hesapla (compound growth)
     * @param {number} baseValue - Son gerçek değer
     * @param {number} annualPercent - Yıllık artış yüzdesi
     * @param {number} months - Tahmin süresi
     * @returns {Array} Aylık tahmin dizisi
     */
    compound(baseValue, annualPercent, months) {
        const result = [];
        const monthlyRate = Math.pow(1 + annualPercent / 100, 1 / 12) - 1;

        for (let i = 1; i <= months; i++) {
            const value = baseValue * Math.pow(1 + monthlyRate, i);
            result.push({
                month: i,
                value: Math.round(value * 100) / 100
            });
        }
        return result;
    },

    /**
     * Senaryo bazlı tahmin
     * @param {number} baseValue - Son gerçek değer
     * @param {string} scenario - "optimistic" | "realistic" | "pessimistic"
     * @param {number} months - Tahmin süresi
     * @returns {Array} Aylık tahmin dizisi
     */
    scenario(baseValue, scenario, months) {
        const rates = {
            optimistic: 15,    // %15 yıllık artış
            realistic: 5,      // %5 yıllık artış
            pessimistic: -5    // %5 yıllık azalış
        };
        const rate = rates[scenario] || rates.realistic;
        return this.compound(baseValue, rate, months);
    },

    /**
     * Trend bazlı tahmin (geçmiş veriden trend çıkar)
     * @param {Array} historicalData - Geçmiş veri dizisi [{value: n}, ...]
     * @param {number} months - Tahmin süresi
     * @returns {Array} Aylık tahmin dizisi
     */
    trend(historicalData, months) {
        if (!historicalData || historicalData.length < 2) {
            return [];
        }

        // Basit lineer regresyon
        const n = historicalData.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

        historicalData.forEach((d, i) => {
            const y = parseFloat(d.value) || 0;
            sumX += i;
            sumY += y;
            sumXY += i * y;
            sumXX += i * i;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const result = [];
        for (let i = 1; i <= months; i++) {
            const value = intercept + slope * (n - 1 + i);
            result.push({
                month: i,
                value: Math.max(0, Math.round(value * 100) / 100)
            });
        }
        return result;
    },

    /**
     * Meta bilgisi oluştur
     */
    createMeta(historicalRows, forecastMonths, params) {
        return {
            source: "mysql",
            historicalRows,
            forecastMonths,
            parametersUsed: params,
            timestamp: new Date().toISOString()
        };
    }
};

module.exports = ForecastHelper;
