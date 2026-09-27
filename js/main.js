(function () {
    'use strict';

    function bindEvents() {
    document.getElementById('btn-sidebar-toggle')
        .addEventListener('click', toggleSidebar);

    document.getElementById('btn-fetch')
        .addEventListener('click', () => APIModule.fetchHotspots(true));

    document.getElementById('btn-sim')
        .addEventListener('click', () => {
        UI.log('⚡ Simulasi overpass dipicu (manual override).', 'info');
        APIModule.fetchHotspots(true);
        });

    document.getElementById('btn-clear')
        .addEventListener('click', () => {
        MapModule.clearMarkers();
        APIModule.updateStats();
        UI.log('🗑️ Peta dibersihkan.', 'info');
        });
    }

    function toggleSidebar() {
    const app = document.getElementById('app');
    const button = document.getElementById('btn-sidebar-toggle');
    const isOpen = !app.classList.toggle('sidebar-closed');

    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? 'Tutup sidebar' : 'Buka sidebar');
    button.title = isOpen ? 'Tutup sidebar' : 'Buka sidebar';
    button.innerHTML = isOpen ? '&times;' : '&#9776;';

    setTimeout(() => MapModule.map.invalidateSize(), 250);
    }

    function startScheduler() {
    setInterval(() => {
        const isOpen = APIModule.isInOverpassWindow();
        UI.updateOverpassBadge(isOpen);

        const timeSinceLastFetch = Date.now() - APIModule.lastFetchTime;
        const thirtyMin = 30 * 60 * 1000;

        if (isOpen && timeSinceLastFetch > thirtyMin && !APIModule.isFetching) {
        UI.log('🛰️ Jendela overpass terdeteksi. Auto-fetch dijalankan.', 'info');
        APIModule.fetchHotspots(false);
        }
    }, CONFIG.schedulerIntervalMs);
    }

    function bootstrap() {

    MapModule.init();
    UI.log('Peta diinisialisasi. Pusat: Kalimantan.', 'info');

    UI.updateOverpassBadge(APIModule.isInOverpassWindow());
    APIModule.updateStats();

    bindEvents();

    UI.log('Sistem KFW siap. Menunggu jendela overpass...', 'success');
    UI.log(
        `Jadwal overpass: ${CONFIG.overpassHours.map(h => h + ':00').join(', ')} WIB`,
        'info'
    );

    setTimeout(() => {
        UI.log('Inisialisasi awal: fetch data baseline...', 'info');
        APIModule.fetchHotspots(true);
    }, 3000);

    startScheduler();
    }

    window.addEventListener('DOMContentLoaded', bootstrap);
})();