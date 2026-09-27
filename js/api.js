const APIModule = {
    requestHistory: [],
    lastFetchTime: 0,
    totalRequests: 0,
    isFetching: false,

    canMakeRequest() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    // Bersihkan history lama
    this.requestHistory = this.requestHistory.filter(t => t > oneMinuteAgo);

    if (this.requestHistory.length >= CONFIG.rateLimit.ourMaxPerMinute) {
        const oldest = this.requestHistory[0];
        const waitMs = 60 * 1000 - (now - oldest);
        UI.log(`⛔ Rate limit lokal tercapai. Tunggu ${Math.ceil(waitMs / 1000)}s.`, 'warn');
        return false;
    }
    return true;
    },

    recordRequest() {
    this.requestHistory.push(Date.now());
    this.totalRequests++;
    },

    isInOverpassWindow() {
    const now = new Date();
    const hour = now.getHours();

    return CONFIG.overpassHours.some(h => {
        const diff = Math.abs(hour - h);
        return diff <= 1; // toleransi ±1 jam
    });
    },

    async fetchFirmsAPI() {
    const response = await fetch('/api/hotspots');
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'NASA FIRMS request gagal');
    }

    return result;
    },

/**
   * @param {boolean} manual
   */
    async fetchHotspots(manual = false) {
    if (this.isFetching) {
        UI.log('Fetch sedang berjalan...', 'warn');
        return;
    }

    const now = Date.now();
    if (now - this.lastFetchTime < CONFIG.minFetchIntervalMs) {
        const wait = Math.ceil(
        (CONFIG.minFetchIntervalMs - (now - this.lastFetchTime)) / 1000
        );
        UI.log(`⏳ Cooldown aktif. Tunggu ${wait}s lagi.`, 'warn');
        return;
    }

    if (!this.canMakeRequest()) return;

    if (!manual && !this.isInOverpassWindow()) {
        UI.log('🛰️ Di luar jendela overpass. Fetch otomatis dilewati (hemat bandwidth).', 'info');
        return;
    }

    this.isFetching = true;
    UI.setFetchButtonLoading(true);
    UI.setConnectionStatus('FETCHING', 'warn');
    UI.log(`📡 Mengirim request ke NASA FIRMS... (req ke-${this.totalRequests + 1})`, 'info');

    this.recordRequest();
    this.lastFetchTime = Date.now();

    try {
        const response = await this.fetchFirmsAPI();

        UI.log(`✅ Diterima: ${response.count} hotspot dari ${response.source}`, 'success');

        const valid = response.data.filter(h =>
            h.latitude  >= CONFIG.bbox.minLat && h.latitude  <= CONFIG.bbox.maxLat &&
            h.longitude >= CONFIG.bbox.minLon && h.longitude <= CONFIG.bbox.maxLon
        );

        if (valid.length < response.count) {
            UI.log(`🔍 ${response.count - valid.length} hotspot di luar bbox difilter.`, 'warn');
        }

        MapModule.renderHotspots(valid);

        const critical = valid.filter(h => MapModule.scoreRisk(h).level === 'CRITICAL');
        if (critical.length > 0) {
            UI.log(`🚨 ${critical.length} hotspot CRITICAL terdeteksi!`, 'error');
        }   

        UI.setConnectionStatus('OK', 'success');
    } catch (err) {
        UI.log(`❌ Gagal fetch: ${err.message}`, 'error');
        UI.setConnectionStatus('ERROR', 'danger');
    } finally {
        this.isFetching = false;
        UI.setFetchButtonLoading(false);
        this.updateStats();
        }
    },

    updateStats() {
    UI.updateStats({
        total:    MapModule.getMarkerCount(),
        requests: this.totalRequests
        });
    }
};