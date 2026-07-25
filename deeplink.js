'use strict';

const { isConfigured } = require('../lib/coupang');
const { sendJson, assertMethod, handleOptions } = require('../lib/http');

module.exports = async function health(req, res) {
  if (handleOptions(req, res)) return;
  try {
    assertMethod(req, ['GET']);
    return sendJson(res, 200, {
      ok: true,
      apiConfigured: isConfigured(),
      mode: isConfigured() ? 'partners-api' : 'search-link',
      timestamp: new Date().toISOString()
    }, {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    });
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message }, error.headers);
  }
};
