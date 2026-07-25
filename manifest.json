'use strict';

const { createDeepLinks, isConfigured } = require('../lib/coupang');
const { consumeRateLimit } = require('../lib/rate-limit');
const {
  sendJson,
  getClientIp,
  assertMethod,
  assertAllowedOrigin,
  handleOptions
} = require('../lib/http');

module.exports = async function deeplink(req, res) {
  if (handleOptions(req, res)) return;

  try {
    assertMethod(req, ['POST']);
    assertAllowedOrigin(req);

    if (!isConfigured()) {
      return sendJson(res, 503, { ok: false, configured: false, error: '쿠팡 API 키가 설정되지 않았습니다.' }, { 'Cache-Control': 'no-store' });
    }

    const rate = consumeRateLimit(`deeplink:${getClientIp(req)}`, { limit: 5, windowMs: 60_000 });
    if (!rate.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000));
      return sendJson(res, 429, { ok: false, error: '딥링크 요청이 너무 많습니다.' }, { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' });
    }

    const body = await readJsonBody(req);
    const data = await createDeepLinks(body.urls);
    return sendJson(res, 200, { ok: true, data }, { 'Cache-Control': 'private, max-age=300' });
  } catch (error) {
    const status = Number(error.status || 500);
    const message = status >= 500 && status !== 503 && status !== 504
      ? '딥링크 생성 중 서버 오류가 발생했습니다.'
      : (error.message || '딥링크 생성에 실패했습니다.');
    return sendJson(res, status, { ok: false, error: message }, {
      'Cache-Control': 'no-store',
      ...(error.headers || {})
    });
  }
};

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) {
      const error = new Error('요청 본문이 너무 큽니다.');
      error.status = 413;
      throw error;
    }
  }
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (_) {
    const error = new Error('JSON 형식이 올바르지 않습니다.');
    error.status = 400;
    throw error;
  }
}
