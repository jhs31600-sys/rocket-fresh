<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#111827" />
  <meta name="description" content="로켓프레시 장바구니 식재료와 부족 금액을 분석해 활용도 높은 추가 식재료와 쿠팡 상품 링크를 추천합니다." />
  <meta name="robots" content="index,follow" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:title" content="프레시필 — 로켓프레시 최소금액 채우기" />
  <meta property="og:description" content="장바구니에 든 식재료를 보고 가장 쓸모 있는 추가 상품을 추천합니다." />
  <title>프레시필 — 로켓프레시 최소금액 채우기</title>
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="icon" href="/icons/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <a class="skip-link" href="#appMain">본문으로 건너뛰기</a>

  <main class="shell" id="appMain">
    <section class="hero" aria-labelledby="pageTitle">
      <div>
        <div class="hero-kicker">
          <span class="brand-dot" aria-hidden="true"></span>
          <span>FreshFill</span>
          <span class="unofficial">쿠팡 비공식 도구</span>
        </div>
        <h1 id="pageTitle">부족한 금액은<br />쓸모 있는 식재료로.</h1>
        <p class="hero-copy">장바구니의 식재료와 가격을 넣으면 최소 주문금액까지 남은 금액을 계산하고, 같이 쓰기 좋은 제품을 쿠팡 링크와 함께 추천합니다.</p>
        <div class="hero-actions">
          <button class="install-button hidden" id="installBtn" type="button">앱으로 설치</button>
          <span class="privacy-chip">입력 내용은 이 브라우저에만 저장</span>
        </div>
      </div>

      <div class="hero-card" aria-live="polite">
        <span>현재 장바구니</span>
        <strong id="heroTotal">0원</strong>
        <small id="heroNeed">부족 금액 계산 전</small>
        <div class="api-state" id="apiState" data-state="checking">
          <span class="state-dot" aria-hidden="true"></span>
          <span id="apiStateText">실상품 연동 확인 중</span>
        </div>
      </div>
    </section>

    <section class="grid">
      <section class="panel input-panel" aria-labelledby="cartTitle">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Cart</p>
            <h2 id="cartTitle">장바구니 입력</h2>
          </div>
          <button class="ghost compact" id="sampleBtn" type="button">예시 채우기</button>
        </div>

        <label class="field">
          <span>최소 주문금액</span>
          <span class="money-input">
            <input id="minAmount" inputmode="numeric" autocomplete="off" value="15000" aria-label="최소 주문금액" />
            <b>원</b>
          </span>
        </label>

        <div class="quick-box">
          <label for="quickPaste">상품 목록 한 번에 붙여넣기</label>
          <textarea id="quickPaste" rows="4" placeholder="예:&#10;우유 5,000원&#10;계란 8,000원"></textarea>
          <button id="applyPasteBtn" type="button">붙여넣기 적용</button>
        </div>

        <div class="cart-table" role="table" aria-label="장바구니 상품">
          <div class="table-row table-head" role="row">
            <span role="columnheader">상품명</span>
            <span role="columnheader">가격</span>
            <span role="columnheader">수량</span>
            <span role="columnheader">삭제</span>
          </div>
          <div id="cartRows"></div>
        </div>

        <div class="actions">
          <button id="addRowBtn" type="button">상품 추가</button>
          <button class="secondary" id="clearBtn" type="button">전체 초기화</button>
        </div>
      </section>

      <section class="panel result-panel" aria-labelledby="resultTitle">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Recommendation</p>
            <h2 id="resultTitle">추천 결과</h2>
          </div>
          <button class="ghost compact" id="copyBtn" type="button">요약 복사</button>
        </div>

        <div class="status-card">
          <div class="status-line">
            <span>달성률</span>
            <strong id="progressText">0%</strong>
          </div>
          <div class="progress" aria-hidden="true"><span id="progressBar"></span></div>
          <div class="status-grid">
            <div><span>합계</span><strong id="totalText">0원</strong></div>
            <div><span>부족</span><strong id="needText">15,000원</strong></div>
            <div><span>인식한 재료</span><strong id="categoryText">없음</strong></div>
          </div>
        </div>

        <div id="readyNotice" class="ready hidden">이미 최소금액을 넘겼습니다. 그래도 활용도 높은 추가 식재료를 아래에 보여줍니다.</div>
        <div id="apiNotice" class="api-notice" role="status">실제 상품 API를 확인하고 있습니다. API 키가 없어도 쿠팡 검색 링크는 정상 작동합니다.</div>

        <div id="recommendations" class="cards" aria-live="polite"></div>

        <div class="fallbacks">
          <h3>빠른 쿠팡 링크</h3>
          <div id="fallbackLinks"></div>
        </div>
      </section>
    </section>

    <section class="explain" aria-labelledby="ruleTitle">
      <div>
        <p class="eyebrow">How it works</p>
        <h2 id="ruleTitle">싼 것보다, 남겨도 다시 쓸 수 있는 것</h2>
        <p>현재 재료와의 조합성, 보관성, 부족 금액과의 가격 적합도, 장바구니 중복 여부를 함께 계산합니다. 실제 가격·재고·로켓프레시 적용 여부는 쿠팡 화면에서 최종 확인해야 합니다.</p>
      </div>
      <div class="rules" aria-label="추천 기준">
        <span>조합성</span><span>보관성</span><span>가격 적합도</span><span>중복 회피</span>
      </div>
    </section>

    <footer class="site-footer">
      <p><strong>프레시필은 쿠팡이 운영하거나 보증하는 공식 서비스가 아닙니다.</strong> 상품 정보와 주문 조건은 쿠팡에서 최종 확인하세요.</p>
      <p class="affiliate-disclosure hidden" id="affiliateDisclosure">이 서비스의 일부 링크는 쿠팡 파트너스 활동의 일환이며, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.</p>
      <nav aria-label="정책 링크">
        <a href="/privacy">개인정보 처리 안내</a>
        <a href="/terms">이용 안내</a>
      </nav>
    </footer>
  </main>

  <noscript>이 앱은 추천 계산을 위해 JavaScript가 필요합니다.</noscript>
  <script src="/recommender.js" defer></script>
  <script src="/app.js" defer></script>
</body>
</html>
