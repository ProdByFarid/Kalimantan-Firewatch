const CONFIG = {

    center: [-1.0, 113.5],
    zoom: 6,

    bbox: {
    minLat: -4.5,
    maxLat:  2.5,
    minLon: 108.5,
    maxLon: 119.5
    },

    rateLimit: {
    maxRequests: 5000,
    windowMs: 10 * 60 * 1000,
    ourMaxPerMinute: 10
    },

    overpassHours: [1, 2, 10, 12, 13, 14, 22, 23],
    nrtBufferMs: 3 * 60 * 60 * 1000,
    minFetchIntervalMs: 30 * 1000,
    schedulerIntervalMs: 5 * 60 * 1000
};

Object.freeze(CONFIG);
Object.freeze(CONFIG.bbox);
Object.freeze(CONFIG.rateLimit);
Object.freeze(CONFIG.overpassHours);