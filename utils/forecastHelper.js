

const ForecastHelper = {
    
    linear(baseValue, changePercent, months) {
        const result = [];
        const monthlyChange = changePercent / 12;

        for (let i = 1; i <= months; i++) {
            const value = baseValue * (1 + (monthlyChange * i) / 100);
            result.push({
                month: i,
                value: Math.round(value * 100) / 100
            });
        }
        return result;
    },

    
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

    
    scenario(baseValue, scenario, months) {
        const rates = {
            optimistic: 15,
            realistic: 5,
            pessimistic: -5
        };
        const rate = rates[scenario] || rates.realistic;
        return this.compound(baseValue, rate, months);
    },

    
    trend(historicalData, months) {
        if (!historicalData || historicalData.length < 2) {
            return [];
        }


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
