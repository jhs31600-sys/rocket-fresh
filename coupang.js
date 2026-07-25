{
  "manifest_version": 3,
  "name": "프레시필 — 로켓프레시 채우기",
  "short_name": "프레시필",
  "version": "1.0.0",
  "minimum_chrome_version": "109",
  "description": "쿠팡 장바구니의 상품명과 가격을 읽고, 최소 주문금액까지 활용도 높은 식재료를 추천하는 비공식 도구입니다.",
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "host_permissions": [
    "https://cart.coupang.com/*",
    "https://www.coupang.com/*",
    "https://m.coupang.com/*"
  ],
  "content_scripts": [
    {
      "matches": [
        "https://cart.coupang.com/*",
        "https://www.coupang.com/*",
        "https://m.coupang.com/*"
      ],
      "js": ["shared/recommender.js", "content.js"],
      "css": ["panel.css"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_title": "프레시필",
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png"
    }
  }
}
