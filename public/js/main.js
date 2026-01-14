/**
 * Mercedes-Benz KDS - Main JavaScript Library v2.1
 * Dinamik analiz, parametre değişim takibi, grafik yenileme, hata yakalama
 */

const KDS = {
    apiBase: '/api',
    charts: {},
    currentPage: null,
    isLoading: false,

    // Sayfa soruları
    pageQuestions: {
        'dashboard': {
            title: 'Executive Dashboard',
            question: 'Tüm üretim operasyonlarının stratejik göstergeleri nasıl tek bir bakışta değerlendirilmeli?',
            hint: 'Bu dashboard tüm senaryoların özet KPI değerlerini ve kritik trendleri gösterir.'
        },
        'production': {
            title: 'Üretim Hattı Dönüşümü',
            question: 'Son 5 yılın ICE vs EV talep trendine göre, Line-2\'nin yüzde kaçını önümüzdeki 9 ay içinde EV montajına dönüştürmeliyiz?',
            hint: 'Slider\'ları kullanarak farklı senaryoları test edin. Sistem crossover noktasını hesaplar.'
        },
        'supplier': {
            title: 'Tedarikçi Stratejisi',
            question: 'Çelik tedarikçisinin kalite skorları 3 yıldır düşüyor ve PPM oranı kritik eşiği aştı. Alternatif tedarikçiye geçiş maliyeti %8 daha yüksek. Sözleşme yenilenmeli mi?',
            hint: 'Kalite eşiği ve fiyat toleransını ayarlayarak optimal karar noktasını bulun.'
        },
        'ergonomics': {
            title: 'Ergonomi ve Robotlaşma',
            question: 'ST-04 istasyonunda 51+ yaş grubunda ergonomik olay oranı %40 daha yüksek. Robotlaşma yatırımı ekonomik açıdan mantıklı mı?',
            hint: 'Robotlaşmanın ROI süresi ve yıllık tasarruflarını analiz edin.'
        },
        'robots': {
            title: 'Boya Robot Yatırımı',
            question: 'P-01, P-02, P-03 boya robotlarının bakım maliyeti logaritmik artış gösteriyor. 450K€ yatırımla yeni robotlar alınmalı mı?',
            hint: 'Eski ve yeni robotların OPEX karşılaştırmasını inceleyin.'
        },
        'welding': {
            title: 'Kaynak Kalitesi Tahmini',
            question: 'K-14 ve K-15 kaynak robotlarındaki servo drift 9 ay sonra scrap rate\'i %0.45\'e çıkaracak. Kalibrasyon mu yoksa değişim mi?',
            hint: 'Robot seçin ve tahmin süresini ayarlayarak gelecek scrap oranını görün.'
        },
        'logistics': {
            title: 'İntralojistik AGV Dönüşümü',
            question: 'Forklift kazaları son 5 yılda %18 arttı. C ve D hollerinde AGV\'ye geçiş ROI süresi nedir?',
            hint: 'AGV yatırımının kaza azaltımı ve bekleme süresi etkisini inceleyin.'
        },
        'legacy': {
            title: 'Legacy Tooling Stratejisi',
            question: 'Eski model yedek parça talebi son 5 yılda %40 düştü. Kalıp alanını tasfiye edip EV üretimine mi açmalıyız?',
            hint: 'Depolama maliyeti ve alan kazanım değerini karşılaştırın.'
        },
        'flashing': {
            title: 'Yazılım Yükleme Kapasitesi',
            question: 'Yazılım boyutu yıllık %20 artıyor ve bottleneck indeksi kritik. Kaç istasyon eklenmeli?',
            hint: 'İstasyon sayısını ayarlayarak bottleneck düşüşünü simüle edin.'
        }
    },

    colors: {
        primary: '#000000',
        secondary: '#6C757D',
        success: '#28A745',
        warning: '#FFC107',
        danger: '#DC3545',
        info: '#17A2B8',
        palette: ['#000000', '#495057', '#6C757D', '#ADB5BD', '#343A40']
    },

    // ===== SAYFA BAŞLATMA =====
    init(pageName) {
        this.currentPage = pageName;
        this.setActivePage(pageName);
        this.createInfoButton(pageName);
        this.createQuestionModal();
        this.setupChartTypeSelectors();
        this.updateTime();
        setInterval(() => this.updateTime(), 60000);
        console.log(`✅ KDS v2.1 initialized: ${pageName}`);
    },

    updateTime() {
        const el = document.getElementById('headerTime');
        if (el) {
            el.textContent = new Date().toLocaleString('tr-TR');
        }
    },

    setActivePage(pageName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            const itemPage = item.getAttribute('data-page') || item.getAttribute('href')?.replace('/', '') || '';
            if (itemPage === pageName || (pageName === 'dashboard' && item.getAttribute('href') === '/')) {
                item.classList.add('active');
            }
        });
    },

    // ===== SORU İKONU VE MODAL =====
    createInfoButton(pageName) {
        if (document.getElementById('infoButton')) return;

        const btn = document.createElement('button');
        btn.id = 'infoButton';
        btn.className = 'info-button';
        btn.innerHTML = '?';
        btn.title = 'Bu sayfanın sorusu';
        btn.onclick = () => this.showQuestion(pageName);
        document.body.appendChild(btn);
    },

    createQuestionModal() {
        if (document.getElementById('questionModal')) return;

        const modal = document.createElement('div');
        modal.id = 'questionModal';
        modal.className = 'question-modal';
        modal.innerHTML = `
            <div class="question-content">
                <div class="question-header">
                    <h3 class="question-title">❓ <span id="questionTitle">Bu Sayfanın Sorusu</span></h3>
                    <button class="question-close" onclick="KDS.hideQuestion()">&times;</button>
                </div>
                <div class="question-body">
                    <p class="question-text" id="questionText"></p>
                    <div class="question-hint" id="questionHint"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideQuestion();
        });
    },

    showQuestion(pageName) {
        const q = this.pageQuestions[pageName] || this.pageQuestions['dashboard'];
        document.getElementById('questionTitle').textContent = q.title;
        document.getElementById('questionText').textContent = q.question;
        document.getElementById('questionHint').textContent = '💡 İpucu: ' + q.hint;
        document.getElementById('questionModal').classList.add('active');
    },

    hideQuestion() {
        document.getElementById('questionModal').classList.remove('active');
    },

    // ===== GRAFİK TİPİ SEÇİCİ =====
    setupChartTypeSelectors() {
        document.querySelectorAll('.chart-type-select').forEach(select => {
            select.removeEventListener('change', this.handleChartTypeChange);
            select.addEventListener('change', (e) => this.handleChartTypeChange(e));
        });
    },

    handleChartTypeChange(e) {
        const chartId = e.target.dataset.chart;
        const newType = e.target.value;
        this.changeChartType(chartId, newType);
    },

    // ===== API İSTEKLERİ + META DOĞRULAMA =====
    dataSourceLog: {}, // Veri kaynağı takibi

    async fetchData(endpoint, params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            // Eğer endpoint zaten / ile başlıyorsa tam URL olarak kullan, yoksa apiBase ekle
            const baseUrl = endpoint.startsWith('/') ? endpoint : `${this.apiBase}${endpoint}`;
            const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success === false) {
                console.warn('API returned success:false', endpoint, result);
                return null;
            }

            // META DOĞRULAMA
            if (result.meta) {
                const validation = this.validateDataSource(result.meta, endpoint);
                this.dataSourceLog[endpoint] = validation;

                if (!validation.valid) {
                    console.error('❌ Veri kaynağı doğrulama hatası:', endpoint, validation.error);
                    return null;
                }

                console.log(`✅ ${endpoint}: ${result.meta.source} (${result.meta.rowCount} satır)`);
            }

            return result;
        } catch (error) {
            console.error('❌ API Error:', endpoint, error.message);
            this.dataSourceLog[endpoint] = { valid: false, error: error.message };
            return null;
        }
    },

    // Veri kaynağı doğrulama
    validateDataSource(meta, endpoint) {
        if (!meta) return { valid: false, error: 'Meta bilgisi yok' };
        if (meta.source !== 'mysql') return { valid: false, error: `Kaynak DB değil: ${meta.source}` };
        if (meta.generated === true) return { valid: false, error: 'Veri kod ile üretilmiş (YASAK)' };

        // rowCount veya historicalRows kabul et
        const rowCount = meta.rowCount ?? meta.historicalRows ?? 0;

        return {
            valid: true,
            source: meta.source,
            tables: meta.tables,
            rowCount: rowCount,
            timestamp: meta.timestamp
        };
    },

    // Veri kaynağı raporu
    getDataSourceReport() {
        return this.dataSourceLog;
    },

    async postData(endpoint, body) {
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.success !== false ? (data.data || data) : null;
        } catch (error) {
            console.error('❌ POST Error:', endpoint, error.message);
            return null;
        }
    },

    // ===== DİNAMİK ANALİZ =====
    async loadAnalysis(scenario, params = {}) {
        this.showAnalysisLoading();

        const data = await this.fetchData(`/analysis/${scenario}`, params);

        if (data && data.text) {
            this.updateAnalysisBox(data.text, data.recommendation, data.severity);
        } else {
            this.updateAnalysisBox(
                '📊 Analiz verileri yükleniyor...',
                'Parametreleri ayarlayın ve bekleyin.',
                'info'
            );
        }
    },

    showAnalysisLoading() {
        const textEl = document.getElementById('analysis-text');
        const recEl = document.getElementById('analysis-recommendation');
        if (textEl) textEl.innerHTML = '<span class="loading-text">⏳ Analiz hesaplanıyor...</span>';
        if (recEl) recEl.textContent = '';
    },

    updateAnalysisBox(text, recommendation, severity = 'info') {
        const box = document.querySelector('.analysis-box');
        const textEl = document.getElementById('analysis-text');
        const recEl = document.getElementById('analysis-recommendation');

        if (textEl) textEl.textContent = text || 'Analiz hesaplanıyor...';
        if (recEl) recEl.textContent = recommendation || '';

        if (box) {
            box.classList.remove('success', 'warning', 'danger', 'info');
            box.classList.add(severity);
        }
    },

    // ===== GRAFİK YÖNETİMİ =====
    showChartLoading(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (canvas && canvas.parentElement) {
            const container = canvas.parentElement;
            if (!container.querySelector('.loading-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'loading-overlay';
                overlay.innerHTML = '<div class="spinner"></div>';
                container.style.position = 'relative';
                container.appendChild(overlay);
            }
        }
    },

    hideChartLoading(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (canvas && canvas.parentElement) {
            const overlay = canvas.parentElement.querySelector('.loading-overlay');
            if (overlay) overlay.remove();
        }
    },

    createChart(canvasId, config, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn('Canvas not found:', canvasId);
            return null;
        }

        this.hideChartLoading(canvasId);

        // Mevcut grafiği temizle
        if (this.charts[canvasId]) {
            try {
                this.charts[canvasId].destroy();
                delete this.charts[canvasId];
            } catch (e) {
                console.warn('Chart destroy error:', e);
            }
        }

        // Veri kontrolü
        if (!config.data || !config.data.datasets || config.data.datasets.length === 0) {
            this.showNoData(canvasId);
            return null;
        }

        const hasData = config.data.datasets.some(ds => ds.data && ds.data.length > 0);
        if (!hasData) {
            this.showNoData(canvasId);
            return null;
        }

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: window.devicePixelRatio || 1,
            resizeDelay: 0,
            onClick: (event, elements) => {
                if (elements.length > 0 && options.onClickHandler) {
                    options.onClickHandler(elements[0], config.data);
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: { size: 11, family: "'Roboto', sans-serif" },
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 13, family: "'Roboto', sans-serif" },
                    bodyFont: { size: 12, family: "'Roboto', sans-serif" },
                    padding: 10,
                    cornerRadius: 4,
                    displayColors: true
                }
            },
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 0,
                    left: 10
                }
            }
        };

        config.options = { ...defaultOptions, ...config.options };

        try {
            this.charts[canvasId] = new Chart(canvas, config);
            return this.charts[canvasId];
        } catch (error) {
            console.error('Chart creation error:', canvasId, error);
            this.showNoData(canvasId);
            return null;
        }
    },

    showNoData(canvasId, message = null) {
        const canvas = document.getElementById(canvasId);
        if (canvas && canvas.parentElement) {
            const container = canvas.parentElement;
            // Canvas'ı gizle
            canvas.style.display = 'none';

            // Mevcut no-data'yı kaldır
            const existing = container.querySelector('.no-data');
            if (existing) existing.remove();

            // Yeni no-data mesajı
            const noData = document.createElement('div');
            noData.className = 'no-data';
            noData.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:200px;color:#DC3545;';
            noData.innerHTML = `
                <span style="font-size:48px;margin-bottom:10px;">⚠️</span>
                <span style="font-weight:bold;font-size:14px;">${message || 'Veritabanından veri alınamadı'}</span>
                <span style="font-size:12px;color:#6c757d;margin-top:5px;">API bağlantısını ve veritabanını kontrol edin</span>
            `;
            container.appendChild(noData);
        }
    },

    restoreCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            canvas.style.display = 'block';
            const noData = canvas.parentElement?.querySelector('.no-data');
            if (noData) noData.remove();
        }
    },

    changeChartType(chartId, newType) {
        const chart = this.charts[chartId];
        if (!chart) {
            console.warn('Chart not found for type change:', chartId);
            return;
        }

        try {
            const data = JSON.parse(JSON.stringify(chart.data));
            chart.destroy();
            delete this.charts[chartId];

            if ((newType === 'pie' || newType === 'doughnut') && data.datasets.length > 1) {
                data.datasets = [data.datasets[0]];
                data.datasets[0].backgroundColor = this.colors.palette;
            }

            this.restoreCanvas(chartId);
            this.createChart(chartId, { type: newType, data: data });
        } catch (error) {
            console.error('Chart type change error:', chartId, error);
        }
    },

    // ===== TÜMÜNÜ YENİLE =====
    async refreshAllCharts(loadFunctions) {
        for (const chartId of Object.keys(this.charts)) {
            this.showChartLoading(chartId);
        }

        if (Array.isArray(loadFunctions)) {
            for (const fn of loadFunctions) {
                if (typeof fn === 'function') {
                    await this.safeLoadData(fn);
                }
            }
        }
    },

    // ===== KPI GÜNCELLEMELERİ =====
    updateKPI(elementId, value, unit = '') {
        const el = document.getElementById(elementId);
        if (el) {
            if (value === null || value === undefined || value === '--' || value === '') {
                el.innerHTML = `--<span class="kpi-unit">${unit}</span>`;
            } else {
                el.innerHTML = `${value}<span class="kpi-unit">${unit}</span>`;
            }
        }
    },

    // ===== DETAY MODAL =====
    openDetailModal(title, data, chartData) {
        let modal = document.getElementById('detailModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'detailModal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title" id="modalTitle">Detay</h3>
                        <button class="modal-close" onclick="KDS.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="chart-container" style="height: 250px;">
                            <canvas id="modalChart"></canvas>
                        </div>
                        <div class="data-table-wrapper" style="margin-top: 1rem;">
                            <table class="data-table" id="modalTable">
                                <thead></thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }

        document.getElementById('modalTitle').textContent = title;
        modal.classList.add('active');

        if (chartData) {
            setTimeout(() => {
                if (this.charts['modalChart']) {
                    this.charts['modalChart'].destroy();
                    delete this.charts['modalChart'];
                }
                this.createChart('modalChart', chartData);
            }, 100);
        }

        if (data && Array.isArray(data) && data.length > 0) {
            const thead = document.querySelector('#modalTable thead');
            const tbody = document.querySelector('#modalTable tbody');

            const headers = Object.keys(data[0]);
            thead.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
            tbody.innerHTML = data.map(row =>
                '<tr>' + headers.map(h => `<td>${row[h] ?? '-'}</td>`).join('') + '</tr>'
            ).join('');
        }
    },

    closeModal() {
        const modal = document.getElementById('detailModal');
        if (modal) modal.classList.remove('active');
    },

    // ===== YARDIMCI FONKSİYONLAR =====
    formatNumber(num, decimals = 0) {
        if (num === null || num === undefined || isNaN(num)) return '-';
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    },

    async safeLoadData(loadFunction) {
        try {
            await loadFunction();
        } catch (error) {
            console.error('❌ Data load error:', error);
        }
    },

    // Parametre değişimlerini izle
    watchParameter(elementId, callback, debounceMs = 300) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let timeout;

        const handleChange = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                console.log(`📊 Parameter changed: ${elementId} = ${element.value}`);
                callback(element.value);
            }, debounceMs);
        };

        element.addEventListener('input', handleChange);
        element.addEventListener('change', handleChange);
    },

    // Slider değer gösterimi güncelle
    setupSlider(sliderId, valueId, formatFn, onChangeFn) {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(valueId);

        if (!slider) return;

        const updateValue = () => {
            if (valueEl) {
                valueEl.textContent = formatFn ? formatFn(slider.value) : slider.value;
            }
        };

        slider.addEventListener('input', updateValue);
        slider.addEventListener('change', () => {
            updateValue();
            if (onChangeFn) onChangeFn(slider.value);
        });

        updateValue(); // Initial
    }
};

// Global erişim
window.KDS = KDS;
