const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { scanWebsite } = require('./scanner');
const { evaluateAssessment, RULESET } = require('./rules');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer'
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > 100_000) throw new Error('Request body too large.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function serveStatic(req, res) {
  const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsed.pathname);
  if (pathname === '/') pathname = '/index.html';
  const file = path.normalize(path.join(PUBLIC, pathname));
  if (!file.startsWith(PUBLIC)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {
      'content-type': MIME[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-cache',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'content-security-policy': "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/api/ruleset') return sendJson(res, 200, RULESET);

    if (req.method === 'POST' && req.url === '/api/scan') {
      const body = await readJson(req);
      if (!body.url) return sendJson(res, 400, { error: 'A website URL is required.' });
      const scan = await scanWebsite(body.url);
      return sendJson(res, 200, scan);
    }

    if (req.method === 'POST' && req.url === '/api/assess') {
      const body = await readJson(req);
      return sendJson(res, 200, evaluateAssessment(body.scan || {}, body.answers || {}));
    }

    if (req.method === 'GET') return serveStatic(req, res);
    res.writeHead(405); res.end('Method not allowed');
  } catch (err) {
    sendJson(res, 400, { error: err.message || 'Unexpected error.' });
  }
});

server.listen(PORT, () => {
  console.log(`AI Act Readiness MVP running at http://localhost:${PORT}`);
});
