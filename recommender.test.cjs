/*
  Rocket Fresh Fill - recommendation core
  Works in browser, Chrome extension, and Node.
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FreshFillRecommender = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULT_MIN_AMOUNT = 15000;

  const CATEGORY_LEXICON = [
    { key: 'egg', label: '계란', terms: ['계란', '달걀', '반숙란', '구운란', '특란', '대란'] },
    { key: 'meat', label: '고기류', terms: ['고기', '소고기', '쇠고기', '돼지', '삼겹', '목살', '앞다리', '불고기', '한우', '닭', '닭가슴', '닭다리', '스테이크', '베이컨', '햄'] },
    { key: 'seafood', label: '수산물', terms: ['생선', '고등어', '연어', '새우', '오징어', '명태', '조개', '홍합', '전복', '참치', '굴'] },
    { key: 'tofu', label: '두부/콩류', terms: ['두부', '순두부', '콩나물', '콩', '유부'] },
    { key: 'kimchi', label: '김치/반찬', terms: ['김치', '깍두기', '장아찌', '반찬', '나물'] },
    { key: 'noodle', label: '면류', terms: ['라면', '우동', '면', '파스타', '칼국수', '소면', '쫄면', '당면', '국수'] },
    { key: 'rice', label: '밥/쌀', terms: ['쌀', '밥', '즉석밥', '햇반', '오뚜기밥', '볶음밥', '죽'] },
    { key: 'dairy', label: '유제품', terms: ['우유', '치즈', '요거트', '요구르트', '버터', '크림', '두유'] },
    { key: 'bread', label: '빵류', terms: ['식빵', '빵', '베이글', '모닝빵', '또띠아', '토스트', '크루아상'] },
    { key: 'salad', label: '샐러드', terms: ['샐러드', '양상추', '어린잎', '루꼴라', '채소믹스', '드레싱'] },
    { key: 'vegetable', label: '채소', terms: ['채소', '야채', '양파', '대파', '파', '마늘', '애호박', '호박', '버섯', '오이', '당근', '상추', '깻잎', '마늘쫑', '청경채', '브로콜리', '양배추', '감자', '고구마', '토마토'] },
    { key: 'fruit', label: '과일', terms: ['과일', '바나나', '사과', '딸기', '귤', '감귤', '오렌지', '포도', '키위', '블루베리', '망고'] },
    { key: 'sauce', label: '양념/소스', terms: ['간장', '고추장', '된장', '소스', '드레싱', '마요', '마요네즈', '케찹', '케첩', '쌈장', '굴소스', '참기름', '올리브유', '식초', '설탕'] },
    { key: 'soup', label: '국/찌개', terms: ['국', '찌개', '탕', '육수', '사골', '곰탕', '미역국', '카레', '짜장'] },
    { key: 'frozen', label: '냉동/간편식', terms: ['냉동', '만두', '피자', '핫도그', '돈까스', '떡갈비', '너겟', '간편식', '밀키트'] },
    { key: 'snack', label: '간식', terms: ['과자', '초콜릿', '젤리', '호떡', '떡', '시리얼', '견과', '아이스크림'] },
    { key: 'drink', label: '음료', terms: ['음료', '물', '생수', '커피', '차', '주스', '탄산'] }
  ];

  const RECOMMENDATION_CATALOG = [
    {
      id: 'green-onion',
      title: '대파',
      searchQuery: '로켓프레시 대파',
      approxMin: 1000,
      approxMax: 3500,
      storage: '냉장 · 송송 썰어 냉동 가능',
      shelfScore: 8,
      versatility: 10,
      categories: ['vegetable'],
      pairsWith: ['egg', 'meat', 'seafood', 'tofu', 'kimchi', 'noodle', 'rice', 'soup', 'sauce'],
      reasons: ['라면·국·볶음밥·고기요리에 다 들어갑니다.', '남으면 썰어서 냉동해도 됩니다.'],
      recipes: ['계란파국', '대파 볶음밥', '고기 구이 곁들임']
    },
    {
      id: 'onion',
      title: '양파',
      searchQuery: '로켓프레시 양파',
      approxMin: 2000,
      approxMax: 5000,
      storage: '실온/냉장 · 오래 보관',
      shelfScore: 10,
      versatility: 10,
      categories: ['vegetable'],
      pairsWith: ['meat', 'seafood', 'egg', 'noodle', 'rice', 'soup', 'sauce', 'frozen'],
      reasons: ['볶음·국·카레·덮밥의 기본 재료입니다.', '보관성이 좋아 금액 채우기용으로 안전합니다.'],
      recipes: ['양파덮밥', '카레', '고기 양파볶음']
    },
    {
      id: 'tofu',
      title: '두부',
      searchQuery: '로켓프레시 두부',
      approxMin: 1200,
      approxMax: 3500,
      storage: '냉장 · 빠른 소비 권장',
      shelfScore: 5,
      versatility: 9,
      categories: ['tofu', 'protein'],
      pairsWith: ['kimchi', 'meat', 'soup', 'vegetable', 'egg', 'sauce', 'rice'],
      reasons: ['김치·찌개·부침·샐러드까지 활용폭이 큽니다.', '부족 금액이 작을 때 가장 깔끔하게 채우기 좋습니다.'],
      recipes: ['두부김치', '된장찌개', '두부부침']
    },
    {
      id: 'egg-small-pack',
      title: '계란',
      searchQuery: '로켓프레시 계란 10구',
      approxMin: 3000,
      approxMax: 9000,
      storage: '냉장 · 2~4주 내 소비',
      shelfScore: 9,
      versatility: 10,
      categories: ['egg', 'protein'],
      pairsWith: ['rice', 'noodle', 'bread', 'salad', 'vegetable', 'soup', 'kimchi'],
      reasons: ['아침·라면·볶음밥·샐러드 토핑으로 거의 실패가 없습니다.', '장바구니에 탄수화물이 있으면 활용성이 특히 높습니다.'],
      recipes: ['계란볶음밥', '계란토스트', '라면 토핑']
    },
    {
      id: 'zucchini',
      title: '애호박',
      searchQuery: '로켓프레시 애호박',
      approxMin: 900,
      approxMax: 2500,
      storage: '냉장 · 4~7일',
      shelfScore: 6,
      versatility: 8,
      categories: ['vegetable'],
      pairsWith: ['tofu', 'egg', 'soup', 'rice', 'noodle', 'seafood', 'sauce'],
      reasons: ['찌개·전·볶음·라면에 다 들어가는 저가 재료입니다.', '부족 금액이 1~2천원대일 때 특히 좋습니다.'],
      recipes: ['애호박전', '된장찌개', '애호박볶음']
    },
    {
      id: 'mushroom',
      title: '버섯',
      searchQuery: '로켓프레시 새송이 버섯',
      approxMin: 1500,
      approxMax: 4500,
      storage: '냉장 · 5~7일',
      shelfScore: 6,
      versatility: 8,
      categories: ['vegetable'],
      pairsWith: ['meat', 'egg', 'rice', 'noodle', 'soup', 'salad', 'sauce'],
      reasons: ['고기·파스타·국물·볶음밥에 다 붙습니다.', '양이 남아도 구워 먹기 쉽습니다.'],
      recipes: ['버섯구이', '버섯볶음밥', '버섯크림파스타']
    },
    {
      id: 'bean-sprout',
      title: '콩나물',
      searchQuery: '로켓프레시 콩나물',
      approxMin: 1000,
      approxMax: 2500,
      storage: '냉장 · 2~4일',
      shelfScore: 4,
      versatility: 7,
      categories: ['tofu', 'vegetable'],
      pairsWith: ['kimchi', 'rice', 'soup', 'meat', 'sauce', 'seafood'],
      reasons: ['국·무침·볶음밥으로 바로 처리 가능합니다.', '금액이 아주 조금 모자랄 때 싸게 채우기 좋습니다.'],
      recipes: ['콩나물국', '콩나물무침', '콩불']
    },
    {
      id: 'garlic',
      title: '다진마늘',
      searchQuery: '로켓프레시 다진마늘',
      approxMin: 3000,
      approxMax: 8000,
      storage: '냉장/냉동 · 오래 보관',
      shelfScore: 9,
      versatility: 10,
      categories: ['vegetable', 'sauce'],
      pairsWith: ['meat', 'seafood', 'kimchi', 'soup', 'rice', 'noodle', 'tofu', 'vegetable'],
      reasons: ['한식 대부분의 베이스라 활용도가 높습니다.', '냉동 보관하면 버릴 가능성이 낮습니다.'],
      recipes: ['마늘볶음밥', '고기양념', '찌개 베이스']
    },
    {
      id: 'stock-broth',
      title: '사골곰탕/육수팩',
      searchQuery: '로켓프레시 사골곰탕 육수',
      approxMin: 1000,
      approxMax: 3500,
      storage: '실온/냉장 · 보관 쉬움',
      shelfScore: 10,
      versatility: 8,
      categories: ['soup'],
      pairsWith: ['noodle', 'rice', 'kimchi', 'tofu', 'meat', 'egg', 'vegetable'],
      reasons: ['떡국·라면·찌개·만둣국 베이스로 바로 씁니다.', '가격대가 낮아 최소금액 채우기에 강합니다.'],
      recipes: ['사골라면', '만둣국', '김치찌개 베이스']
    },
    {
      id: 'instant-rice',
      title: '즉석밥',
      searchQuery: '로켓프레시 즉석밥',
      approxMin: 4000,
      approxMax: 9000,
      storage: '실온 · 장기 보관',
      shelfScore: 10,
      versatility: 9,
      categories: ['rice'],
      pairsWith: ['egg', 'kimchi', 'meat', 'seafood', 'soup', 'frozen', 'sauce'],
      reasons: ['남아도 비상식량으로 남길 수 있습니다.', '고기·반찬·국물류가 장바구니에 있을 때 효율이 좋습니다.'],
      recipes: ['간단 덮밥', '볶음밥', '국밥']
    },
    {
      id: 'tuna-can',
      title: '참치캔',
      searchQuery: '쿠팡 참치캔 로켓프레시',
      approxMin: 4000,
      approxMax: 10000,
      storage: '실온 · 장기 보관',
      shelfScore: 10,
      versatility: 8,
      categories: ['seafood', 'protein'],
      pairsWith: ['rice', 'kimchi', 'egg', 'salad', 'noodle', 'sauce', 'bread'],
      reasons: ['밥·샐러드·김치찌개·샌드위치로 변환이 쉽습니다.', '유통기한이 길어 충동구매 리스크가 낮습니다.'],
      recipes: ['참치마요덮밥', '참치김치찌개', '참치샌드위치']
    },
    {
      id: 'kimchi-small',
      title: '김치 소포장',
      searchQuery: '로켓프레시 김치 소포장',
      approxMin: 3000,
      approxMax: 9000,
      storage: '냉장 · 1~3주',
      shelfScore: 8,
      versatility: 8,
      categories: ['kimchi'],
      pairsWith: ['rice', 'noodle', 'tofu', 'meat', 'soup', 'egg', 'tuna-can'],
      reasons: ['밥·라면·두부·고기와 바로 연결됩니다.', '소포장은 부담이 덜합니다.'],
      recipes: ['김치볶음밥', '두부김치', '김치라면']
    },
    {
      id: 'frozen-dumpling',
      title: '냉동만두',
      searchQuery: '로켓프레시 냉동만두',
      approxMin: 6000,
      approxMax: 12000,
      storage: '냉동 · 장기 보관',
      shelfScore: 9,
      versatility: 7,
      categories: ['frozen'],
      pairsWith: ['soup', 'noodle', 'rice', 'vegetable', 'sauce'],
      reasons: ['부족 금액이 큰 날에는 보관성 좋은 메인템입니다.', '국물·구이·찜으로 처리 방식이 다양합니다.'],
      recipes: ['만둣국', '군만두', '비빔만두']
    },
    {
      id: 'frozen-fried-rice',
      title: '냉동 볶음밥',
      searchQuery: '로켓프레시 냉동 볶음밥',
      approxMin: 2500,
      approxMax: 7000,
      storage: '냉동 · 장기 보관',
      shelfScore: 9,
      versatility: 7,
      categories: ['frozen', 'rice'],
      pairsWith: ['egg', 'kimchi', 'meat', 'seafood', 'vegetable'],
      reasons: ['한 끼가 바로 해결되는 비상식량입니다.', '계란이나 김치가 있으면 만족도가 올라갑니다.'],
      recipes: ['계란 추가 볶음밥', '김치볶음밥', '컵밥 대체']
    },
    {
      id: 'mozzarella',
      title: '모짜렐라 치즈',
      searchQuery: '로켓프레시 모짜렐라 치즈',
      approxMin: 3000,
      approxMax: 8000,
      storage: '냉장/냉동 · 보관 쉬움',
      shelfScore: 7,
      versatility: 8,
      categories: ['dairy'],
      pairsWith: ['bread', 'noodle', 'rice', 'egg', 'salad', 'vegetable', 'frozen'],
      reasons: ['토스트·파스타·볶음밥·계란요리에 바로 씁니다.', '냉동 제품이면 버릴 확률이 낮습니다.'],
      recipes: ['치즈토스트', '치즈계란말이', '치즈볶음밥']
    },
    {
      id: 'tortilla',
      title: '또띠아',
      searchQuery: '로켓프레시 또띠아',
      approxMin: 3000,
      approxMax: 7000,
      storage: '냉장/냉동 · 보관 쉬움',
      shelfScore: 8,
      versatility: 8,
      categories: ['bread'],
      pairsWith: ['egg', 'meat', 'salad', 'dairy', 'vegetable', 'sauce', 'tuna-can'],
      reasons: ['남은 고기·계란·채소를 랩으로 묶어 처리하기 좋습니다.', '냉동 보관도 쉽습니다.'],
      recipes: ['치킨랩', '계란랩', '퀘사디아']
    },
    {
      id: 'banana',
      title: '바나나',
      searchQuery: '로켓프레시 바나나',
      approxMin: 3000,
      approxMax: 7000,
      storage: '실온 · 빠른 소비',
      shelfScore: 5,
      versatility: 7,
      categories: ['fruit'],
      pairsWith: ['dairy', 'bread', 'snack', 'drink'],
      reasons: ['아침·간식·요거트 토핑으로 바로 먹습니다.', '조리가 필요 없어 실패 확률이 낮습니다.'],
      recipes: ['요거트볼', '바나나토스트', '스무디']
    },
    {
      id: 'plain-yogurt',
      title: '플레인 요거트',
      searchQuery: '로켓프레시 플레인 요거트',
      approxMin: 3000,
      approxMax: 8000,
      storage: '냉장 · 1~2주',
      shelfScore: 6,
      versatility: 7,
      categories: ['dairy'],
      pairsWith: ['fruit', 'bread', 'salad', 'snack'],
      reasons: ['과일·시리얼·샐러드드레싱으로 돌려쓰기 좋습니다.', '아침식사 대체품으로 유용합니다.'],
      recipes: ['요거트볼', '요거트 드레싱', '스무디']
    },
    {
      id: 'bread',
      title: '식빵/베이글',
      searchQuery: '로켓프레시 식빵 베이글',
      approxMin: 2500,
      approxMax: 7000,
      storage: '냉장/냉동 · 보관 가능',
      shelfScore: 7,
      versatility: 8,
      categories: ['bread'],
      pairsWith: ['egg', 'dairy', 'fruit', 'tuna-can', 'salad', 'sauce'],
      reasons: ['계란·치즈·과일·참치와 조합이 쉽습니다.', '냉동해두면 아침용으로 오래 갑니다.'],
      recipes: ['계란토스트', '치즈토스트', '참치샌드위치']
    },
    {
      id: 'salad-greens',
      title: '샐러드 채소',
      searchQuery: '로켓프레시 샐러드 채소',
      approxMin: 3000,
      approxMax: 7000,
      storage: '냉장 · 빠른 소비',
      shelfScore: 4,
      versatility: 7,
      categories: ['salad', 'vegetable'],
      pairsWith: ['egg', 'meat', 'seafood', 'dairy', 'tuna-can', 'bread'],
      reasons: ['단백질이 장바구니에 있으면 한 끼 샐러드로 바로 완성됩니다.', '고기류와 같이 먹으면 느끼함을 잡습니다.'],
      recipes: ['닭가슴살 샐러드', '참치샐러드', '샌드위치 속']
    },
    {
      id: 'cucumber',
      title: '오이',
      searchQuery: '로켓프레시 오이',
      approxMin: 1000,
      approxMax: 4500,
      storage: '냉장 · 4~7일',
      shelfScore: 5,
      versatility: 7,
      categories: ['vegetable'],
      pairsWith: ['salad', 'meat', 'rice', 'sauce', 'bread', 'kimchi'],
      reasons: ['무침·샐러드·샌드위치·고기 곁들임으로 빠르게 씁니다.', '작은 부족 금액을 채우기 좋습니다.'],
      recipes: ['오이무침', '오이샌드위치', '비빔밥 토핑']
    },
    {
      id: 'milk',
      title: '우유',
      searchQuery: '로켓프레시 우유',
      approxMin: 3000,
      approxMax: 8000,
      storage: '냉장 · 1~2주',
      shelfScore: 6,
      versatility: 7,
      categories: ['dairy', 'drink'],
      pairsWith: ['bread', 'fruit', 'snack', 'coffee', 'cereal'],
      reasons: ['빵·시리얼·커피·스무디에 바로 연결됩니다.', '이미 자주 먹는 집이면 소진이 빠릅니다.'],
      recipes: ['프렌치토스트', '라떼', '스무디']
    },
    {
      id: 'ramen-or-udon',
      title: '우동/라면 사리',
      searchQuery: '로켓프레시 우동 사리 라면 사리',
      approxMin: 2000,
      approxMax: 6000,
      storage: '냉장/냉동 · 보관 쉬움',
      shelfScore: 8,
      versatility: 7,
      categories: ['noodle'],
      pairsWith: ['soup', 'kimchi', 'egg', 'meat', 'seafood', 'vegetable'],
      reasons: ['육수·김치·계란·고기와 결합해 한 끼가 됩니다.', '국물템이 장바구니에 있으면 효율이 좋습니다.'],
      recipes: ['김치우동', '계란라면', '볶음우동']
    },
    {
      id: 'soy-sauce',
      title: '진간장/굴소스',
      searchQuery: '로켓프레시 진간장 굴소스',
      approxMin: 2500,
      approxMax: 8000,
      storage: '실온/냉장 · 장기 보관',
      shelfScore: 10,
      versatility: 9,
      categories: ['sauce'],
      pairsWith: ['meat', 'seafood', 'rice', 'noodle', 'vegetable', 'egg', 'tofu'],
      reasons: ['볶음·조림·덮밥의 범용 양념입니다.', '오래 보관되므로 금액 채우기 실패가 적습니다.'],
      recipes: ['간장계란밥', '굴소스볶음', '두부조림']
    }
  ];

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[\[\](){}<>]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parsePrice(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value));
    if (value == null) return 0;
    const text = String(value).replace(/[^0-9.-]/g, '');
    if (!text) return 0;
    const parsed = Number(text);
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
  }

  function formatWon(value) {
    const amount = parsePrice(value);
    return amount.toLocaleString('ko-KR') + '원';
  }

  function detectCategoriesFromName(name) {
    const normalized = normalizeText(name);
    const hits = new Set();
    CATEGORY_LEXICON.forEach(category => {
      if (category.terms.some(term => normalized.includes(normalizeText(term)))) {
        hits.add(category.key);
      }
    });
    return Array.from(hits);
  }

  function sanitizeItems(items) {
    return (Array.isArray(items) ? items : [])
      .map((item, index) => ({
        id: item.id || `item-${index}`,
        name: String(item.name || '').trim(),
        price: parsePrice(item.price),
        qty: Math.max(1, parsePrice(item.qty || 1) || 1)
      }))
      .filter(item => item.name || item.price > 0)
      .map(item => ({ ...item, lineTotal: item.price * item.qty }));
  }

  function analyzeCart(items) {
    const cleanItems = sanitizeItems(items);
    const total = cleanItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const categories = new Set();
    const tokens = new Set();

    cleanItems.forEach(item => {
      detectCategoriesFromName(item.name).forEach(category => categories.add(category));
      normalizeText(item.name).split(' ').filter(Boolean).forEach(token => tokens.add(token));
    });

    return {
      items: cleanItems,
      total,
      categories: Array.from(categories),
      tokens: Array.from(tokens),
      labels: Array.from(categories).map(key => CATEGORY_LEXICON.find(category => category.key === key)?.label || key)
    };
  }

  function overlapCount(arrayA, arrayB) {
    const setB = new Set(arrayB);
    return arrayA.reduce((count, value) => count + (setB.has(value) ? 1 : 0), 0);
  }


  function hasFinalConsonantKorean(text) {
    const clean = String(text || '').trim();
    if (!clean) return false;
    const ch = clean[clean.length - 1];
    const code = ch.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return false;
    return ((code - 0xac00) % 28) !== 0;
  }

  function withKoreanParticle(text, pair) {
    const [withBatchim, withoutBatchim] = pair.split('/');
    return `${text}${hasFinalConsonantKorean(text) ? withBatchim : withoutBatchim}`;
  }

  function itemAlreadyInCart(rec, context) {
    const needles = [rec.title, rec.searchQuery]
      .concat(rec.title.split('/'))
      .map(normalizeText)
      .filter(Boolean);
    return context.items.some(item => {
      const name = normalizeText(item.name);
      return needles.some(needle => needle.length >= 2 && name.includes(needle.replace('로켓프레시 ', '')));
    });
  }

  function priceFitScore(rec, required, maxExtra) {
    if (required <= 0) return 0;
    const maxAllowed = required + Math.max(1500, maxExtra || 4000);
    const mid = (rec.approxMin + rec.approxMax) / 2;

    if (rec.approxMin <= required && rec.approxMax >= required) return 30;
    if (rec.approxMin <= maxAllowed && mid <= maxAllowed) return 24;
    if (rec.approxMin <= maxAllowed) return 18;
    if (rec.approxMin <= required + 7000) return 8;
    return -12;
  }

  function lowGapBoost(rec, required) {
    if (required <= 0) return 0;
    if (required <= 2500 && rec.approxMin <= 2500) return 18;
    if (required <= 4000 && rec.approxMin <= 4000) return 12;
    if (required <= 7000 && rec.approxMin <= 7000) return 8;
    return 0;
  }

  function matchedCartItems(rec, context) {
    return context.items.filter(item => {
      const categories = detectCategoriesFromName(item.name);
      return overlapCount(rec.pairsWith || [], categories) > 0;
    });
  }

  function buildReason(rec, context, pairScore, required) {
    const matched = matchedCartItems(rec, context).slice(0, 2).map(item => item.name).filter(Boolean);
    const pieces = [];
    if (matched.length > 0) {
      pieces.push(`현재 장바구니의 ${matched.map(name => withKoreanParticle(name, '과/와')).join(', ')} 같이 쓰기 좋습니다.`);
    } else if (context.categories.length === 0) {
      pieces.push('장바구니 식재료를 더 넣으면 추천 정확도가 올라갑니다. 지금은 범용성이 높은 기본템 기준입니다.');
    } else {
      pieces.push(rec.reasons[0]);
    }

    if (required > 0) {
      if (rec.approxMin <= required && rec.approxMax >= required) {
        pieces.push(`부족 금액 ${formatWon(required)} 근처에서 찾기 좋습니다.`);
      } else if (rec.approxMin <= required + 3000) {
        pieces.push(`조금만 초과해도 활용성이 높은 편입니다.`);
      } else {
        pieces.push(`부족분보다 비쌀 수 있어 가격순 확인이 필요합니다.`);
      }
    }

    if (rec.reasons[1]) pieces.push(rec.reasons[1]);
    return pieces.join(' ');
  }

  function createSearchUrl(query, options) {
    const opts = options || {};
    const q = opts.rawQuery ? query : query;
    return `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(q)}&channel=user`;
  }

  function scoreRecommendation(rec, context, required, options) {
    const maxExtra = options.maxExtra ?? 4000;
    const pairScore = overlapCount(rec.pairsWith || [], context.categories);
    const categoryDuplicate = overlapCount(rec.categories || [], context.categories);
    const already = itemAlreadyInCart(rec, context);

    let score = 0;
    score += rec.versatility * 4;
    score += rec.shelfScore * 2;
    score += pairScore * 12;
    score += priceFitScore(rec, required, maxExtra);
    score += lowGapBoost(rec, required);

    if (context.categories.length === 0) score += rec.shelfScore + rec.versatility;
    if (already) score -= 45;
    if (categoryDuplicate > 0 && !['green-onion', 'onion', 'garlic', 'soy-sauce'].includes(rec.id)) score -= 4 * categoryDuplicate;

    // Keep extremely fresh/short-lived items from dominating unless they pair well.
    if (rec.shelfScore <= 4 && pairScore === 0) score -= 10;

    return { score, pairScore, already };
  }

  function recommend(items, options) {
    const opts = {
      minAmount: DEFAULT_MIN_AMOUNT,
      limit: 8,
      maxExtra: 4000,
      ...options
    };

    const context = analyzeCart(items);
    const required = Math.max(0, parsePrice(opts.minAmount) - context.total);

    const recommendations = RECOMMENDATION_CATALOG
      .map(rec => {
        const scored = scoreRecommendation(rec, context, required, opts);
        const link = createSearchUrl(rec.searchQuery);
        return {
          ...rec,
          score: Math.round(scored.score),
          reason: buildReason(rec, context, scored.pairScore, required),
          alreadyInCart: scored.already,
          priceRangeText: `${formatWon(rec.approxMin)}~${formatWon(rec.approxMax)}`,
          link,
          linkLabel: `쿠팡에서 ${rec.title} 보기`
        };
      })
      .filter(rec => !rec.alreadyInCart || opts.includeDuplicates)
      .sort((a, b) => b.score - a.score)
      .slice(0, opts.limit);

    const fallbackLinks = [
      { title: '로켓프레시 5천원 미만 상품', url: 'https://www.coupang.com/np/campaigns/2157' },
      { title: '로켓프레시 전체', url: 'https://www.coupang.com/np/categories/393760' },
      { title: '로켓프레시 가격순 검색', url: createSearchUrl('로켓프레시 3000원 이하') }
    ];

    return {
      minAmount: parsePrice(opts.minAmount),
      total: context.total,
      required,
      isReady: required <= 0,
      context,
      recommendations,
      fallbackLinks,
      generatedAt: new Date().toISOString()
    };
  }

  const sampleCart = [
    { name: '서울우유 1급A 우유', price: 5000, qty: 1 },
    { name: '무항생제 신선한 대란', price: 8000, qty: 1 }
  ];

  return {
    DEFAULT_MIN_AMOUNT,
    CATEGORY_LEXICON,
    RECOMMENDATION_CATALOG,
    normalizeText,
    parsePrice,
    formatWon,
    detectCategoriesFromName,
    sanitizeItems,
    analyzeCart,
    recommend,
    createSearchUrl,
    hasFinalConsonantKorean,
    withKoreanParticle,
    sampleCart
  };
});
