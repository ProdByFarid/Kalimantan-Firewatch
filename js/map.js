const MapModule = {
    map: null,
    markers: [],


    init() {
        this.map = L.map('map', {
            center: CONFIG.center,
            zoom: CONFIG.zoom,
                zoomControl: false
    });

    // Basemap OpenStreetMap tidak membutuhkan API key.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(this.map);

    // Gambar bounding box Kalimantan sebagai referensi
    const bbox = CONFIG.bbox;
    L.rectangle(
        [[bbox.minLat, bbox.minLon], [bbox.maxLat, bbox.maxLon]],
        {
            color: '#ff6b35',
            weight: 1,
            dashArray: '5,5',
            fill: false,
            opacity: 0.4
        }
    ).addTo(this.map).bindTooltip('Area Pemantauan Kalimantan', { sticky: true });

    return this.map;
    },

    /**
   * @param {Object} hotspot
   * @returns {{ level: string, color: string, score: number }}
   */
    scoreRisk(hotspot) {
    let score = 0;

    if (hotspot.confidence > 80)      score += 40;
    else if (hotspot.confidence > 60) score += 20;

    if (hotspot.frp > 30)      score += 30;
    else if (hotspot.frp > 15) score += 15;

    if (hotspot.brightness > 350) score += 20;

    score += Math.floor(Math.random() * 20);

    if (score >= 70) return { level: 'CRITICAL', color: '#ef4444', score };
    if (score >= 50) return { level: 'HIGH',     color: '#f97316', score };
    if (score >= 30) return { level: 'MEDIUM',   color: '#fbbf24', score };
    return             { level: 'LOW',      color: '#4ade80', score };
    },

    /**
   * @param {Array} hotspots
   */
    renderHotspots(hotspots) {
    hotspots.forEach(hs => {
        if (hs.confidence < 50) return;

        const risk = this.scoreRisk(hs);

        const marker = L.circleMarker([hs.latitude, hs.longitude], {
            radius: risk.level === 'CRITICAL' ? 9 : risk.level === 'HIGH' ? 7 : 5,
            fillColor: risk.color,
            color: '#fff',
            weight: 1.5,
            opacity: 1,
            fillOpacity: 0.85,
            className: risk.level === 'CRITICAL' ? 'hotspot-marker' : ''
                }).addTo(this.map);

            marker.bindPopup(this.buildPopupHTML(hs, risk));

            this.markers.push(marker);
        });
    },

    buildPopupHTML(hs, risk) {
    return `
        <div style="font-family:system-ui;font-size:12px;min-width:180px">
            <strong style="color:${risk.color}">${risk.level} RISK</strong>
            <hr style="margin:4px 0;border:none;border-top:1px solid #ddd">
            <div>📍 ${hs.latitude}, ${hs.longitude}</div>
            <div>🛰️ ${hs.satellite}</div>
            <div>🌡️ Brightness: ${hs.brightness} K</div>
            <div>🎯 Confidence: ${hs.confidence}%</div>
            <div>🔥 FRP: ${hs.frp} MW</div>
            <div>⏱️ ${new Date(hs.acq_time).toLocaleString('id-ID')}</div>
            <div style="margin-top:6px;font-weight:600">Skor Risiko: ${risk.score}/100</div>
        </div>
    `;
    },


    clearMarkers() {
        this.markers.forEach(m => this.map.removeLayer(m));
        this.markers = [];
    },

    getMarkerCount() {
        return this.markers.length;
    }
};