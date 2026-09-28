const http = require('http');
const fs = require('fs');
const path = require('path');

loadEnvFile();

const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.NASA_FIRMS_API_KEY;
const ROOT = __dirname;
const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8'
};

function loadEnvFile() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;

    fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
        if (match && !process.env[match[1]]) {
            process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
        }
    });
}

function parseCsv(csv) {
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].replace(/^\uFEFF/, '').split(',');
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
        const confidence = { l: 60, n: 70, h: 90 }[String(row.confidence).toLowerCase()] || Number(row.confidence);
        const rawTime = String(row.acq_time).padStart(4, '0');
        const acquisitionTime = `${rawTime.slice(0, 2)}:${rawTime.slice(2)}`;

        return {
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            brightness: Number(row.bright_ti4 || row.brightness),
            confidence,
            satellite: row.satellite,
            acq_time: `${row.acq_date}T${acquisitionTime}:00Z`,
            frp: Number(row.frp)
        };
    });
}

async function getHotspots() {
    const minLat = -4.5, maxLat = 2.5, minLon = 108.5, maxLon = 119.5;
    const area = `${minLon},${minLat},${maxLon},${maxLat}`;
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${API_KEY}/VIIRS_SNPP_NRT/${area}/1`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`NASA FIRMS mengembalikan HTTP ${response.status}`);
    }

    const data = parseCsv(await response.text());
    return {
        source: 'VIIRS_SNPP_NRT',
        region: 'Kalimantan',
        count: data.length,
        data,
        fetchedAt: new Date().toISOString()
    };
}

function serveStatic(request, response) {
    const urlPath = decodeURIComponent(request.url.split('?')[0]);
    const requestedPath = urlPath === '/' ? '/index.html' : urlPath;
    const filePath = path.normalize(path.join(ROOT, requestedPath));
    const mime = MIME_TYPES[path.extname(filePath)];

    // hanya izinkan .html/.css/.js, jadi .env dan file lain tidak bisa diakses
    if (!filePath.startsWith(ROOT) || !mime || filePath === __filename) {
        response.writeHead(404);
        response.end('Not found');
        return;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            response.writeHead(error.code === 'ENOENT' ? 404 : 500);
            response.end('Not found');
            return;
        }
        response.writeHead(200, { 'Content-Type': mime });
        response.end(content);
    });
}

async function handler(request, response) {
    if (request.url.split('?')[0] === '/api/hotspots') {
        try {
            if (!API_KEY) throw new Error('NASA_FIRMS_API_KEY belum diatur');
            const result = await getHotspots();
            response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            response.end(JSON.stringify(result));
        } catch (error) {
            response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
            response.end(JSON.stringify({ error: error.message }));
        }
        return;
    }

    serveStatic(request, response);
}

if (process.env.VERCEL) {
    module.exports = handler;               // dipakai Vercel
} else {
    http.createServer(handler).listen(PORT, () => {
        console.log(`KFW berjalan di http://localhost:${PORT}`);
    });
}