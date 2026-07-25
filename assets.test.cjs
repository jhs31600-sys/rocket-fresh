(function () {
  'use strict';

  const R = window.FreshFillRecommender;
  if (!R) return;

  const STORAGE_KEY = 'rocket-fresh-fill-state-v2';
  const PRODUCT_CACHE_TTL = 10 * 60 * 1000;

  const els = {
    heroTotal: document.getElementById('heroTotal'),
    heroNeed: document.getElementById('heroNeed'),
    minAmount: document.getElementById('minAmount'),
    quickPaste: document.getElementById('quickPaste'),
    applyPasteBtn: document.getElementById('applyPasteBtn'),
    cartRows: document.getElementById('cartRows'),
    addRowBtn: document.getElementById('addRowBtn'),
    clearBtn: document.getElementById('clearBtn'),
    sampleBtn: document.getElementById('sampleBtn'),
    copyBtn: document.getElementById('copyBtn'),
    installBtn: document.getElementById('installBtn'),
    progressText: document.getElementById('progressText'),
    progressBar: document.getElementById('progressBar'),
    totalText: document.getElementById('totalText'),
    needText: document.getElementById('needText'),
    categoryText: document.getElementById('categoryText'),
    readyNotice: document.getElementById('readyNotice'),
    apiNotice: document.getElementById('apiNotice'),
    apiState: document.getElementById('apiState'),
    apiStateText: document.getElementById('apiStateText'),
    affiliateDisclosure: document.getElementById('affiliateDisclosure'),
    recommendations: document.getElementById('recommendations'),
    fallbackLinks: document.getElementById('fallbackLinks')
  };

  let state = loadState();
  let lastResult = null;
  let deferredInstallPrompt = null;
  let apiStatus = { checked: false, configured: false, ok: false };
  const productCache = new Map();

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && Array.isArray(saved.items)) {
        return {
          minAmount: R.parsePrice(saved.minAmount) || R.DEFAULT_MIN_AMOUNT,
          items: saved.items
        };
      }
    } catch (_) {}
    return { minAmount: R.DEFAULT_MIN_AMOUNT, items: R.sampleCart };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function showToast(message) {
    const previous = document.querySelector('.toast');
    if (previous) previous.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 1900);
  }

  function parsePastedItems(text) {
    return String(text || '')
      .split(/\n|;/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const priceMatch = line.match(/([0-9][0-9,.\s]*)\s*원?\s*$/);
        if (!priceMatch) return { name: line, price: 0, qty: 1 };
        const price = R.parsePrice(priceMatch[1]);
        const name = line.slice(0, priceMatch.index).replace(/[,:|\-]+$/g, '').trim() || '상품';
        return { name, price, qty: 1 };
      });
  }

  function getMinAmount() {
    return R.parsePrice(els.minAmount.value || state.minAmount || R.DEFAULT_MIN_AMOUNT) || R.DEFAULT_MIN_AMOUNT;
  }

  function updateFromInputs() {
    state.minAmount = getMinAmount();
    state.items = Array.from(els.cartRows.querySelectorAll('.table-row[data-index]')).map(row => ({
      name: row.querySelector('.cart-name').value.trim(),
      price: R.parsePrice(row.querySelector('.cart-price').value),
      qty: Math.max(1, R.parsePrice(row.querySelector('.cart-qty').value) || 1)
    }));
    saveState();
    render(false);
  }

  function renderRows() {
    els.minAmount.value = state.minAmount || R.DEFAULT_MIN_AMOUNT;
    els.cartRows.innerHTML = '';
    const items = state.items.length ? state.items : [{ name: '', price: '', qty: 1 }];
    items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'table-row';
      row.dataset.index = String(index);
      row.setAttribute('role', 'row');
      row.innerHTML = `
        <input class="cart-name" aria-label="${index + 1}번째 상품명" placeholder="예: 계란" value="${escapeHtml(item.name || '')}" />
        <input class="cart-price" aria-label="${index + 1}번째 상품 가격" inputmode="numeric" autocomplete="off" placeholder="5000" value="${item.price || ''}" />
        <input class="cart-qty" aria-label="${index + 1}번째 상품 수량" inputmode="numeric" autocomplete="off" value="${item.qty || 1}" />
        <button class="remove-row" type="button" aria-label="${index + 1}번째 상품 삭제">×</button>
      `;
      els.cartRows.appendChild(row);
    });
  }

  function render(shouldRenderRows = true) {
    if (shouldRenderRows) renderRows();

    lastResult = R.recommend(state.items, { minAmount: state.minAmount, limit: 7 });
    const pct = Math.min(100, Math.round((lastResult.total / Math.max(1, lastResult.minAmount)) * 100));

    els.heroTotal.textContent = R.formatWon(lastResult.total);
    els.heroNeed.textContent = lastResult.required > 0 ? `${R.formatWon(lastResult.required)} 더 채우면 주문 가능` : '최소금액 달성';
    els.progressText.textContent = `${pct}%`;
    els.progressBar.style.width = `${pct}%`;
    els.totalText.textContent = R.formatWon(lastResult.total);
    els.needText.textContent = lastResult.required > 0 ? R.formatWon(lastResult.required) : '0원';
    els.categoryText.textContent = lastResult.context.labels.length ? lastResult.context.labels.join(', ') : '없음';
    els.readyNotice.classList.toggle('hidden', !lastResult.isReady);

    els.recommendations.innerHTML = lastResult.recommendations.map(cardHtml).join('');
    els.fallbackLinks.innerHTML = lastResult.fallbackLinks
      .map(link => `<a href="${escapeAttribute(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.title)}</a>`)
      .join('');
  }

  function cardHtml(rec, index) {
    const recipes = rec.recipes && rec.recipes.length ? rec.recipes.join(' · ') : '간단 조리';
    const liveButton = apiStatus.configured
      ? `<button class="secondary live-product-button" type="button" data-index="${index}">실제 상품 불러오기</button>`
      : '';

    return `
      <article class="card" data-rec-id="${escapeAttribute(rec.id)}">
        <div class="card-top">
          <div>
            <h3>${index + 1}. ${escapeHtml(rec.title)}</h3>
            <div class="meta">
              <span>예상가 ${escapeHtml(rec.priceRangeText)}</span>
              <span>${escapeHtml(rec.storage)}</span>
              <span>활용도 ${rec.versatility}/10</span>
            </div>
          </div>
          <span class="score">추천점수 ${rec.score}</span>
        </div>
        <p>${escapeHtml(rec.reason)}</p>
        <div class="recipe">활용: ${escapeHtml(recipes)}</div>
        <div class="card-actions">
          <a class="link-button" href="${escapeAttribute(rec.link)}" target="_blank" rel="noopener noreferrer">쿠팡 검색</a>
          ${liveButton}
        </div>
        <div class="live-products hidden" id="products-${index}" aria-live="polite"></div>
      </article>
    `;
  }

  function buildSummary() {
    const result = R.recommend(state.items, { minAmount: state.minAmount, limit: 5 });
    const lines = [
      `로켓프레시 장바구니 합계: ${R.formatWon(result.total)}`,
      `부족 금액: ${R.formatWon(result.required)}`,
      '추천:'
    ];
    result.recommendations.forEach((rec, index) => {
      lines.push(`${index + 1}. ${rec.title} (${rec.priceRangeText}) - ${rec.link}`);
    });
    return lines.join('\n');
  }

  async function checkApiStatus() {
    setApiUi('checking');
    try {
      const response = await fetch('/api/health', { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => ({}));
      apiStatus = {
        checked: true,
        ok: response.ok && Boolean(data.ok),
        configured: response.ok && Boolean(data.apiConfigured)
      };
      setApiUi(apiStatus.configured ? 'connected' : 'fallback');
    } catch (_) {
      apiStatus = { checked: true, ok: false, configured: false };
      setApiUi('fallback');
    }
    render(false);
  }

  function setApiUi(mode) {
    els.apiState.dataset.state = mode;
    els.apiNotice.className = 'api-notice';

    if (mode === 'connected') {
      els.apiStateText.textContent = '쿠팡 실상품 연동됨';
      els.apiNotice.textContent = '추천 카드의 “실제 상품 불러오기”에서 현재 API 검색 결과와 직접 상품 링크를 볼 수 있습니다.';
      els.apiNotice.classList.add('connected');
      els.affiliateDisclosure.classList.remove('hidden');
      return;
    }
    if (mode === 'error') {
      els.apiStateText.textContent = '실상품 연동 오류';
      els.apiNotice.textContent = '실상품 API 요청에 실패했습니다. 쿠팡 검색 링크는 계속 사용할 수 있습니다.';
      els.apiNotice.classList.add('error');
      return;
    }
    if (mode === 'fallback') {
      els.apiStateText.textContent = '쿠팡 검색 링크 모드';
      els.apiNotice.textContent = '서버에 쿠팡 API 키가 없어 검색 링크 방식으로 동작합니다. 추천 기능과 쿠팡 이동은 그대로 사용할 수 있습니다.';
      els.apiNotice.classList.add('fallback');
      els.affiliateDisclosure.classList.add('hidden');
      return;
    }
    els.apiStateText.textContent = '실상품 연동 확인 중';
    els.apiNotice.textContent = '실제 상품 API를 확인하고 있습니다. API 키가 없어도 쿠팡 검색 링크는 정상 작동합니다.';
  }

  async function loadLiveProducts(index, button) {
    const rec = lastResult && lastResult.recommendations[index];
    const box = document.getElementById(`products-${index}`);
    if (!rec || !box) return;

    if (box.dataset.loaded === '1') {
      box.classList.toggle('hidden');
      button.textContent = box.classList.contains('hidden') ? '실제 상품 펼치기' : '실제 상품 접기';
      return;
    }

    box.classList.remove('hidden');
    box.innerHTML = '<div class="loading-box">쿠팡 상품을 불러오는 중입니다.</div>';
    button.disabled = true;

    const required = lastResult.required;
    const minPrice = required > 2500 ? Math.max(0, required - 2500) : 0;
    const maxPrice = required > 0 ? required + 5000 : rec.approxMax + 5000;
    const cacheKey = `${rec.searchQuery}|${minPrice}|${maxPrice}`;
    const cached = productCache.get(cacheKey);

    try {
      let data;
      if (cached && Date.now() - cached.savedAt < PRODUCT_CACHE_TTL) {
        data = cached.data;
      } else {
        const query = new URLSearchParams({
          keyword: rec.searchQuery,
          limit: '4',
          minPrice: String(minPrice),
          maxPrice: String(maxPrice)
        });
        const response = await fetch(`/api/products?${query.toString()}`, { headers: { Accept: 'application/json' } });
        data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = new Error(data.error || '상품을 불러오지 못했습니다.');
          error.status = response.status;
          throw error;
        }
        productCache.set(cacheKey, { savedAt: Date.now(), data });
      }
      renderProducts(box, data);
      box.dataset.loaded = '1';
      button.textContent = '실제 상품 접기';
    } catch (error) {
      box.innerHTML = `<div class="empty-box">${escapeHtml(error.message || '상품을 불러오지 못했습니다.')} 쿠팡 검색 링크를 이용해주세요.</div>`;
      if (error.status === 503) {
        apiStatus.configured = false;
        setApiUi('fallback');
      } else {
        setApiUi('error');
      }
    } finally {
      button.disabled = false;
    }
  }

  function renderProducts(box, data) {
    const products = Array.isArray(data.products) ? data.products : [];
    if (!products.length) {
      box.innerHTML = '<div class="empty-box">조건에 맞는 상품을 찾지 못했습니다. 바로 위의 쿠팡 검색을 이용해주세요.</div>';
      return;
    }

    const note = data.priceFiltered === false ? '가격 범위 밖의 검색 상위 결과 포함' : 'API 검색 시점 가격';
    box.innerHTML = `
      <div class="live-products-title"><strong>쿠팡 실상품</strong><small>${escapeHtml(note)}</small></div>
      <div class="product-grid">
        ${products.map(productHtml).join('')}
      </div>
    `;
  }

  function productHtml(product) {
    const badges = [];
    if (product.isRocket) badges.push('<span>로켓</span>');
    if (product.isFreeShipping) badges.push('<span>무료배송</span>');
    const image = isSafeHttpsUrl(product.image) ? product.image : '/icons/product-placeholder.svg';
    const url = isSafeHttpsUrl(product.url) ? product.url : '#';
    return `
      <a class="product-card" href="${escapeAttribute(url)}" target="_blank" rel="sponsored noopener noreferrer">
        <img src="${escapeAttribute(image)}" alt="" loading="lazy" referrerpolicy="no-referrer" />
        <span>
          <b>${escapeHtml(product.name || '쿠팡 상품')}</b>
          <span class="product-price">${R.formatWon(product.price || 0)}</span>
          <span class="product-badges">${badges.join('')}</span>
        </span>
      </a>
    `;
  }

  function isSafeHttpsUrl(value) {
    try {
      const url = new URL(String(value || ''));
      return url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }

  els.cartRows.addEventListener('input', updateFromInputs);
  els.minAmount.addEventListener('input', updateFromInputs);

  els.cartRows.addEventListener('click', event => {
    if (!event.target.classList.contains('remove-row')) return;
    const row = event.target.closest('.table-row[data-index]');
    if (!row) return;
    const idx = Number(row.dataset.index);
    state.items.splice(idx, 1);
    if (!state.items.length) state.items.push({ name: '', price: '', qty: 1 });
    saveState();
    render(true);
  });

  els.recommendations.addEventListener('click', event => {
    const button = event.target.closest('.live-product-button');
    if (!button) return;
    const index = Number(button.dataset.index);
    loadLiveProducts(index, button);
  });

  els.addRowBtn.addEventListener('click', () => {
    state.items.push({ name: '', price: '', qty: 1 });
    saveState();
    render(true);
    els.cartRows.querySelector('.table-row:last-child .cart-name')?.focus();
  });

  els.clearBtn.addEventListener('click', () => {
    state = { minAmount: R.DEFAULT_MIN_AMOUNT, items: [{ name: '', price: '', qty: 1 }] };
    saveState();
    render(true);
  });

  els.sampleBtn.addEventListener('click', () => {
    state = { minAmount: R.DEFAULT_MIN_AMOUNT, items: R.sampleCart.map(item => ({ ...item })) };
    saveState();
    render(true);
  });

  els.applyPasteBtn.addEventListener('click', () => {
    const parsed = parsePastedItems(els.quickPaste.value);
    if (!parsed.length) return showToast('붙여넣을 상품을 찾지 못했습니다.');
    state.items = parsed;
    saveState();
    render(true);
    showToast('장바구니를 반영했습니다.');
  });

  els.copyBtn.addEventListener('click', async () => {
    const text = buildSummary();
    try {
      await navigator.clipboard.writeText(text);
      showToast('추천 요약을 복사했습니다.');
    } catch (_) {
      showToast('브라우저 복사 권한을 확인해주세요.');
    }
  });

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    els.installBtn.classList.remove('hidden');
  });

  els.installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    els.installBtn.classList.add('hidden');
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    els.installBtn.classList.add('hidden');
    showToast('앱 설치가 완료됐습니다.');
  });

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => null);
    });
  }

  render(true);
  checkApiStatus();
})();
