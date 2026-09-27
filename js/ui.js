const UI = {
    /**
   * @param {string} message
   * @param {'info'|'success'|'warn'|'error'} type
   */
    log(message, type = 'info') {
    const el = document.getElementById('log');
    if (!el) return;

    const time = new Date().toLocaleTimeString('id-ID');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${time}] ${message}`;
    el.appendChild(entry);
    el.scrollTop = el.scrollHeight;

    // Batasi log maksimal 50 entri
    while (el.children.length > 50) {
        el.removeChild(el.firstChild);
    }
    },

    /**
    * @param {{ total: number, requests: number }} stats
    */
    updateStats(stats) {
    const totalEl = document.getElementById('stat-total');
    const reqEl = document.getElementById('stat-req');

    if (totalEl) totalEl.textContent = stats.total;
    if (reqEl)   reqEl.textContent   = stats.requests;
    },

    /**
    * @param {string} text
    * @param {'success'|'warn'|'danger'} type
    */
    setConnectionStatus(text, type) {
    const el = document.getElementById('stat-conn');
    if (!el) return;
    el.textContent = text;
    el.className = `stat-value ${type}`;
    },

    /**
    * @param {boolean} loading
    */
    setFetchButtonLoading(loading) {
    const btn = document.getElementById('btn-fetch');
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? '⏳ Mengambil data...' : '🛰️ Fetch Data Sekarang';
    },

    /**
   * @param {boolean} isOpen
   */
    updateOverpassBadge(isOpen) {
    const el = document.getElementById('stat-overpass');
    if (!el) return;

    if (isOpen) {
        el.textContent = 'BUKA';
        el.className = 'badge';
    } else {
        el.textContent = 'TUTUP';
        el.className = 'badge off';
    }
    }
};