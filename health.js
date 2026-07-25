'use strict';

const { searchProducts, isConfigured } = require('../lib/coupang');
const { getCached, setCached } = require('../lib/cache');
const { consumeRateLimit } = require('../lib/rate-limit');
const {
  sendJson,
  getQuery,
  getClientIp,
  assertMethod,
  assertAllowedOrigin,
  handleOptions,
  clampNumber
} = require('../lib/http');

module.exports = async function products(req, res) {
  if (handleOptions(req, res)) return;

  try {
    assertMethod(req, ['GET']);
    assertAllowedOrigin(req);

    if (!isConfigured()) {
      return sendJson(res, 503, {
        ok: false,
        configured: false,
        error: '쿠팡 API 키가 설정되지 않았습니다. 쿠팡 검색 링크를 이용해주세요.'
      }, { 'Cache-Control': 'no-store' });
    }

    const ip = getClientIp(req);
    const rate = consumeRateLimit(`products:${ip}`, { limit: 8, windowMs: 60_000 });
    res.setHeader('X-RateLimit-Remaining', String(rate.remaining));
    if (!rate.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000));
      return sendJson(res, 429, {
        ok: false,
        error: '상품 검색 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
      }, { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' });
    }

    const query = getQuery(req);
    const keyword = String(query.keyword || '').replace(/\s+/g, ' ').trim();
    const limit = clampNumber(query.limit, 1, 6, 4);
    const minPrice = clampNumber(query.minPrice, 0, 500_000, 0);
    const maxPrice = clampNumber(query.maxPrice, 0, 500_000, 0);

    if (!keyword || keyword.length > 80) {
      return sendJson(res, 400, { ok: false, error: '검색어는 1자 이상 80자 이하로 입력해주세요.' }, { 'Cache-Control': 'no-store' });
    }
    if (maxPrice && minPrice > maxPrice) {
      return sendJson(res, 400, { ok: false, error: '최소 가격은 최대 가격보다 클 수 없습니다.' }, { 'Cache-Control': 'no-store' });
    }

    const cacheKey = JSON.stringify({ keyword, minPrice, maxPrice, limit });
    const cached = getCached(cacheKey);
    if (cached) {
      return sendJson(res, 200, { ...cached, cached: true }, {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900'
      });
    }

    const allProducts = await searchProducts(keyword, { apiLimit: 10 });
    const inRange = allProducts
      .filter(product => !minPrice || product.price >= minPrice)
      .filter(product => !maxPrice || product.price <= maxPrice);
    const priceFiltered = inRange.length > 0;
    const products = (priceFiltered ? inRange : allProducts).slice(0, limit);

    const payload = {
      ok: true,
      configured: true,
      keyword,
      minPrice,
      maxPrice,
      priceFiltered,
      count: products.length,
      products,
      generatedAt: new Date().toISOString()
    };
    setCached(cacheKey, payload, 15 * 60_000);

    return sendJson(res, 200, payload, {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900'
    });
  } catch (error) {
    const status = Number(error.status || 500);
    const message = status >= 500 && status !== 503 && status !== 504
      ? '상품 검색 중 서버 오류가 발생했습니다.'
      : (error.message || '상품 검색에 실패했습니다.');
    return sendJson(res, status, { ok: false, error: message }, {
      'Cache-Control': 'no-store',
      ...(error.headers || {})
    });
  }
};
