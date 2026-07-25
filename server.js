'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const PORT_VALUE = Number.parseInt(String(process.env.PORT || ''), 10);
const PORT = Number.isInteger(PORT_VALUE) && PORT_VALUE > 0 ? PORT_VALUE : 3000;
const HOST = '0.0.0.0';
const PUBLIC_DIR = path.resolve(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

let apiRoutes;
function getApiRoutes() {
  if (apiRoutes) return apiRoutes;
  apiRoutes = new Map([
    ['/api/health', require('./api/health')],
    ['/api/products', require('./api/products')],
    ['/api/deeplink', require('./api/deeplink')]
  ]);
  return apiRoutes;
}

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

function sendRailwayHealth(req, res) {
  const method = String(req.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end();
    return;
  }

  const body = JSON.stringify({ ok: true, service: 'rocket-fresh-fill' });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Length', String(Buffer.byteLength(body)));
  res.setHeader('Connection', 'close');
  res.end(method === 'HEAD' ? undefined : body);
}

function safePublicPath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch (_) {
    return null;
  }

  const normalized = path.posix.normalize(decoded).replace(/^\/+/, '');
  const relative = normalized === '' || normalized === '.' ? 'index.html' : normalized;
  const candidate = path.resolve(PUBLIC_DIR, relative);
  if (candidate !== PUBLIC_DIR && !candidate.startsWith(PUBLIC_DIR + path.sep)) return null;
  return candidate;
}

async function serveStatic(req, res, pathname) {
  let filePath = safePublicPath(pathname);
  if (!filePath) {
    res.statusCode = 400;
    res.end('Bad Request');
    return;
  }

  let stat;
  try {
    stat = await fs.promises.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      stat = await fs.promises.stat(filePath);
    }
  } catch (_) {
    filePath = path.join(PUBLIC_DIR, '404.html');
    try {
      stat = await fs.promises.stat(filePath);
      res.statusCode = 404;
    } catch (_) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
  }

  const extension = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME_TYPES[extension] || 'application/octet-stream');
  res.setHeader(
    'Cache-Control',
    pathname === '/' || extension === '.html'
      ? 'public, max-age=0, must-revalidate'
      : 'public, max-age=86400'
  );
  res.setHeader('Content-Length', String(stat.size));

  if (String(req.method || '').toUpperCase() === 'HEAD') {
    res.end();
    return;
  }

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) res.statusCode = 500;
    if (!res.writableEnded) res.end('Internal Server Error');
  });
  stream.pipe(res);
}

const server = http.createServer(async (req, res) => {
  applySecurityHeaders(res);

  try {
    // Host 헤더 형식과 무관하게 경로만 안전하게 파싱합니다.
    const requestUrl = new URL(req.url || '/', 'http://localhost');

    // Railway 헬스체크는 다른 모듈이나 외부 API에 의존하지 않습니다.
    if (requestUrl.pathname === '/health') {
      sendRailwayHealth(req, res);
      return;
    }

    const handler = getApiRoutes().get(requestUrl.pathname);
    if (handler) {
      await handler(req, res);
      return;
    }

    if (!['GET', 'HEAD'].includes(String(req.method || '').toUpperCase())) {
      res.statusCode = 405;
      res.setHeader('Allow', 'GET, HEAD');
      res.end('Method Not Allowed');
      return;
    }

    await serveStatic(req, res, requestUrl.pathname);
  } catch (error) {
    console.error('[request-error]', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    if (!res.writableEnded) {
      res.end(JSON.stringify({ ok: false, error: '서버 오류가 발생했습니다.' }));
    }
  }
});

server.requestTimeout = 15_000;
server.headersTimeout = 16_000;
server.keepAliveTimeout = 5_000;

server.on('error', error => {
  console.error('[server-error]', error);
  process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
  console.log(`[startup] listening on http://${HOST}:${PORT}`);
  console.log(`[startup] NODE_ENV=${process.env.NODE_ENV || 'undefined'} PORT=${process.env.PORT || 'undefined'}`);
});

function shutdown(signal) {
  console.log(`[shutdown] ${signal}`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
