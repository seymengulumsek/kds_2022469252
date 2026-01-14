
document.addEventListener('DOMContentLoaded', () => {
    setupSliders();
    loadCapacityChart();
    calculate();
});

function setupSliders() {
    const sliders = [
        { id: 'iceDecline', valueId: 'iceDeclineValue', format: v => `${v}%` },
        { id: 'evGrowth', valueId: 'evGrowthValue', format: v => `+${v}%` },
        { id: 'forecastMonths', valueId: 'forecastMonthsValue', format: v => `${v} ay` }
    ];

    sliders.forEach(s => {
        const slider = document.getElementById(s.id);
        const value = document.getElementById(s.valueId);
        slider.addEventListener('input', () => {
            value.textContent = s.format(slider.value);
        });
    });

    document.getElementById('btnCalculate').addEventListener('click', calculate);
}

let forecastChart = null;

async function calculate() {
    const iceDecline = parseInt(document.getElementById('iceDecline').value) / 100;
    const evGrowth = parseInt(document.getElementById('evGrowth').value) / 100;
    const months = parseInt(document.getElementById('forecastMonths').value);

    try {
        const response = await fetch(`/api/production/forecast?ice_decline=${iceDecline}&ev_growth=${evGrowth}&months=${months}`);
        const result = await response.json();

        if (result.success) {
            updateForecastChart(result.data);
            updateAnalysis(result.data, iceDecline, evGrowth);
        }
    } catch (error) {
        console.error('Hesaplama hatası:', error);
    }
}

function updateForecastChart(data) {
    const ctx = document.getElementById('forecastChart');

    const labels = data.forecast.map(f => `Ay ${f.month}`);
    const iceData = data.forecast.map(f => f.ice_demand);
    const evData = data.forecast.map(f => f.ev_demand);

    if (forecastChart) forecastChart.destroy();

    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'ICE Talebi',
                    data: iceData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'EV Talebi',
                    data: evData,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                annotation: {
                    annotations: data.crossoverMonth ? {
                        crossover: {
                            type: 'line',
                            xMin: data.crossoverMonth - 1,
                            xMax: data.crossoverMonth - 1,
                            borderColor: '#f39c12',
                            borderWidth: 2,
                            borderDash: [5, 5]
                        }
                    } : {}
                }
            },
            scales: {
                y: { title: { display: true, text: 'Aylık Talep (adet)' } }
            }
        }
    });
}

function updateAnalysis(data, iceDecline, evGrowth) {
    const crossover = data.crossoverMonth;
    document.getElementById('kpi-crossover').innerHTML = crossover ?
        `${crossover}<span class="kpi-unit">ay</span>` :
        `>12<span class="kpi-unit">ay</span>`;

    const revenueIncrease = Math.round((evGrowth - Math.abs(iceDecline)) * 50);
    document.getElementById('kpi-revenue').innerHTML = `+${revenueIncrease}<span class="kpi-unit">M€/yıl</span>`;

    let analysisText = '';
    let recommendation = '';

    if (crossover && crossover <= 6) {
        analysisText = `🚨 KRİTİK: EV talebi ${crossover}. ayda ICE\'i geçecek! Dizel hat kapasitesi hızla düşecek.`;
        recommendation = '⚠️ ACİL EYLEM: Üretim hattı dönüşümü derhal başlatılmalı. Yatırım planı onaylanmalı.';
    } else if (crossover && crossover <= 12) {
        analysisText = `⚠️ UYARI: EV talebi ${crossover}. ayda ICE\'i geçecek. Planlı geçiş için zaman var.`;
        recommendation = '📋 ÖNERİ: 6 ay içinde dönüşüm projesi başlatılmalı, tedarikçilerle görüşmeler yapılmalı.';
    } else {
        analysisText = `✅ STABIL: Crossover 12+ ay sonra. Mevcut üretim planı sürdürülebilir.`;
        recommendation = '📌 İZLEME: Piyasa trendleri aylık takip edilmeli, senaryo analizleri güncellenmeli.';
    }

    document.getElementById('analysis-text').textContent = analysisText;
    document.getElementById('analysis-recommendation').textContent = recommendation;
}

async function loadCapacityChart() {
    try {
        const response = await fetch('/api/production/capacity');
        const result = await response.json();
        if (!result.success) return;

        const years = [...new Set(result.data.map(d => d.year))];
        const evCapable = years.map(y => {
            const rows = result.data.filter(d => d.year === y && d.is_ev_capable);
            return rows.reduce((sum, r) => sum + r.avg_utilization, 0) / (rows.length || 1);
        });
        const iceOnly = years.map(y => {
            const rows = result.data.filter(d => d.year === y && !d.is_ev_capable);
            return rows.reduce((sum, r) => sum + r.avg_utilization, 0) / (rows.length || 1);
        });

        new Chart(document.getElementById('capacityChart'), {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    { label: 'EV Uyumlu Hatlar', data: evCapable, backgroundColor: '#2ecc71' },
                    { label: 'Sadece ICE Hatlar', data: iceOnly, backgroundColor: '#e74c3c' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Kullanım %' } } }
            }
        });
    } catch (error) {
        console.error('Kapasite grafiği hatası:', error);
    }
}
