/**
 * Dashboard JavaScript - Main Dashboard Charts & KPIs
 */

document.addEventListener('DOMContentLoaded', () => {
    loadKPIs();
    loadDemandChart();
    loadCapacityChart();
    loadMaintenanceChart();
    loadQualityChart();
    loadAnalysis();
});

async function loadKPIs() {
    try {
        const response = await fetch('/api/kpi');
        const result = await response.json();
        if (result.success) {
            const d = result.data;
            document.getElementById('kpi-capacity').innerHTML = `${d.capacity_utilization}<span class="kpi-unit">%</span>`;
            document.getElementById('kpi-ev').innerHTML = `+${d.ev_growth_pct}<span class="kpi-unit">%</span>`;
            document.getElementById('kpi-rework').innerHTML = `${Math.round(d.rework_cost_eur / 1000)}<span class="kpi-unit">K€</span>`;
            document.getElementById('kpi-wait').innerHTML = `${d.logistics_wait_min}<span class="kpi-unit">dk</span>`;
            document.getElementById('kpi-bottleneck').innerHTML = `${d.flashing_bottleneck}<span class="kpi-unit">idx</span>`;
        }
    } catch (error) {
        console.error('KPI yükleme hatası:', error);
    }
}

async function loadDemandChart() {
    try {
        const response = await fetch('/api/production/trends');
        const result = await response.json();
        if (!result.success) return;

        const years = [...new Set(result.data.map(d => d.year))];
        const iceData = years.map(y => {
            const row = result.data.find(d => d.year === y && d.powertrain_type === 'ICE');
            return row ? row.total_demand : 0;
        });
        const evData = years.map(y => {
            const row = result.data.find(d => d.year === y && d.powertrain_type === 'EV');
            return row ? row.total_demand : 0;
        });

        new Chart(document.getElementById('demandChart'), {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'ICE (Dizel/Benzin)',
                        data: iceData,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'EV (Elektrikli)',
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
                    legend: { position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Talep (adet)' } }
                }
            }
        });
    } catch (error) {
        console.error('Demand chart hatası:', error);
    }
}

async function loadCapacityChart() {
    try {
        const response = await fetch('/api/production/capacity');
        const result = await response.json();
        if (!result.success) return;

        const lines = [...new Set(result.data.map(d => d.line_code))];
        const latestYear = Math.max(...result.data.map(d => d.year));
        const capacityData = lines.map(l => {
            const row = result.data.find(d => d.line_code === l && d.year === latestYear);
            return row ? row.avg_utilization : 0;
        });

        new Chart(document.getElementById('capacityChart'), {
            type: 'bar',
            data: {
                labels: lines,
                datasets: [{
                    label: 'Kapasite Kullanımı %',
                    data: capacityData,
                    backgroundColor: '#0d1b2a',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });
    } catch (error) {
        console.error('Capacity chart hatası:', error);
    }
}

async function loadMaintenanceChart() {
    try {
        const response = await fetch('/api/robots/compare');
        const result = await response.json();
        if (!result.success) return;

        const years = [...new Set(result.data.map(d => d.year))];
        const oldData = years.map(y => {
            const row = result.data.find(d => d.year === y && d.robot_category === 'OLD');
            return row ? row.avg_maintenance : 0;
        });
        const newData = years.map(y => {
            const row = result.data.find(d => d.year === y && d.robot_category === 'NEW');
            return row ? row.avg_maintenance : 0;
        });

        new Chart(document.getElementById('maintenanceChart'), {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Eski Robotlar (2010 öncesi)',
                        data: oldData,
                        borderColor: '#e74c3c',
                        tension: 0.4
                    },
                    {
                        label: 'Yeni Robotlar (2015+)',
                        data: newData,
                        borderColor: '#3498db',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Bakım Maliyeti (€)' } }
                }
            }
        });
    } catch (error) {
        console.error('Maintenance chart hatası:', error);
    }
}

async function loadQualityChart() {
    try {
        const response = await fetch('/api/supplier/trends');
        const result = await response.json();
        if (!result.success) return;

        const suppliers = [...new Set(result.data.map(d => d.supplier_code))].slice(0, 4);
        const latestYear = Math.max(...result.data.map(d => d.year));
        const qualityData = suppliers.map(s => {
            const row = result.data.find(d => d.supplier_code === s && d.year === latestYear);
            return row ? row.avg_quality : 0;
        });

        new Chart(document.getElementById('qualityChart'), {
            type: 'doughnut',
            data: {
                labels: suppliers,
                datasets: [{
                    data: qualityData,
                    backgroundColor: ['#0d1b2a', '#1b263b', '#415a77', '#778da9']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    } catch (error) {
        console.error('Quality chart hatası:', error);
    }
}

async function loadAnalysis() {
    try {
        const [production, robots, logistics] = await Promise.all([
            fetch('/api/production/forecast').then(r => r.json()),
            fetch('/api/robots/roi?robot=K-14').then(r => r.json()),
            fetch('/api/logistics/roi').then(r => r.json())
        ]);

        let analysisText = '';
        let recommendations = [];

        if (production.success && production.data.crossoverMonth) {
            analysisText += `📊 ICE ve EV talep eğrileri ${production.data.crossoverMonth}. ayda kesişecek. `;
            if (production.data.crossoverMonth <= 8) {
                recommendations.push('⚠️ ACİL: Üretim hattı dönüşümü planlanmalı');
            }
        }

        if (robots.success && robots.data.paybackMonths) {
            analysisText += `🤖 K-14 robotu için yeni yatırım ${robots.data.paybackMonths} ayda geri dönüyor. `;
            if (robots.data.paybackMonths <= 18) {
                recommendations.push('✅ Robot yatırımı ekonomik olarak mantıklı');
            }
        }

        if (logistics.success && logistics.data.paybackMonths) {
            analysisText += `🚛 AGV geçişi bekleme süresini %${logistics.data.waitingReduction} azaltacak, ROI ${logistics.data.paybackMonths} ay. `;
            recommendations.push('📌 AGV pilot projesi başlatılmalı');
        }

        document.getElementById('analysis-text').textContent = analysisText || 'Veri analizi tamamlandı.';
        document.getElementById('analysis-recommendation').innerHTML = recommendations.join('<br>') || 'Kritik öneri bulunmuyor.';

    } catch (error) {
        console.error('Analysis hatası:', error);
    }
}
