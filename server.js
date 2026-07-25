'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const health = require('./api/health');
const products = require('./api/products');
const deeplink = require('./api/deeplink');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const PUBLIC_DIR = path.resolve(__dirname, 'public');

const API_ROUTES = new Map([
  ['/api/health', health],
  ['/api/products', products],
  ['/api/deeplink', deeplink]
]);

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

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
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

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) res.statusCode = 500;
    res.end('Internal Server Error');
  });
  stream.pipe(res);
}

const server = http.createServer(async (req, res) => {
  applySecurityHeaders(res);

  try {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const handler = API_ROUTES.get(requestUrl.pathname);

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
    console.error(error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    if (!res.writableEnded) {
      res.end(JSON.stringify({ ok: false, error: '서버 오류가 발생했습니다.' }));
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Rocket Fresh Fill listening on http://${HOST}:${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received; shutting down.`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
