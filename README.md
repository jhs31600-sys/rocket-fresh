# 프레시필 — 외부 배포용

로켓프레시 장바구니 합계가 기본 최소 주문금액인 15,000원에 못 미칠 때, 현재 식재료와 같이 쓰기 좋은 추가 식재료를 추천하고 쿠팡 검색 또는 실제 상품 링크로 보내주는 웹앱입니다.

이 저장소는 **Railway에 그대로 배포할 수 있는 구조**입니다.

## 기능

- 상품명·가격·수량 입력 또는 여러 줄 붙여넣기
- 장바구니 합계, 부족 금액, 달성률 자동 계산
- 조합성·보관성·가격 적합도·중복 회피 기반 추천
- API 키 없이 쿠팡 검색 링크로 동작
- 쿠팡 파트너스 API 키 설정 시 실제 상품명·가격·이미지·직접 링크 표시
- 모바일 설치 가능한 PWA 및 오프라인 기본 추천
- 브라우저 로컬 저장, 개인정보/이용 안내 페이지 포함
- 동일 출처 제한, 입력 검증, 간이 요청 제한, 보안 헤더 포함

## Railway 배포

Node.js 22 이상이 설치된 환경에서 실행합니다.

```bash
unzip rocket-fresh-fill-deploy.zip
cd rocket-fresh-fill-deploy
npm test
npm run deploy
```

처음 실행하면 Vercel 로그인을 요구합니다. 프로젝트 설정 질문에는 기본값을 사용하면 됩니다. 배포가 끝나면 `https://...vercel.app` 공개 주소가 생성됩니다.

로컬 확인은 다음 명령으로 합니다.

```bash
npm run dev
```

## GitHub를 통한 배포

1. 이 폴더 전체를 새 GitHub 저장소에 올립니다.
2. Vercel 대시보드에서 **Add New → Project**로 저장소를 가져옵니다.
3. Framework Preset은 `Other`로 두고 Build Command와 Output Directory는 비워둡니다.
4. Deploy를 누릅니다.

정적 파일은 `public/`, 서버리스 함수는 `api/`에서 자동 배포됩니다.

## 쿠팡 실제 상품 API 연결

API 키를 설정하지 않아도 서비스는 정상 동작합니다. 다만 실제 상품 카드 대신 쿠팡 검색 링크가 표시됩니다.

실상품 연동을 켜려면 Vercel 프로젝트의 **Settings → Environment Variables**에 아래 값을 추가한 뒤 재배포합니다.

```text
COUPANG_ACCESS_KEY=발급받은_ACCESS_KEY
COUPANG_SECRET_KEY=발급받은_SECRET_KEY
COUPANG_SUB_ID=freshfill
```

선택적으로 허용 도메인을 고정할 수 있습니다.

```text
ALLOWED_ORIGINS=https://내도메인.example,https://www.내도메인.example
```

중요한 점:

- Access Key와 Secret Key는 절대 `public/`, 브라우저 코드, Chrome 확장에 넣지 마세요.
- API 키는 Vercel 환경변수에만 저장합니다.
- 키 설정 후 `/api/health`의 `apiConfigured`가 `true`인지 확인합니다.
- 검색 API 호출을 줄이기 위해 실상품은 사용자가 버튼을 누를 때만 불러오며, 서버·CDN 캐시를 사용합니다.

## 커스텀 도메인

Vercel 프로젝트의 **Settings → Domains**에서 소유한 도메인을 연결합니다. 연결 후 `ALLOWED_ORIGINS`를 실제 HTTPS 도메인으로 설정하면 외부 사이트에서 API를 호출하는 것을 줄일 수 있습니다.

## 공개 전 반드시 수정할 것

`DEPLOYMENT_CHECKLIST.md`를 확인하세요. 특히 다음은 운영자가 직접 결정해야 합니다.

- 서비스명과 운영자 문의처
- 개인정보 처리 안내의 실제 호스팅·분석 도구 내용
- 쿠팡 파트너스 고지와 최신 정책 준수 여부
- 기본 최소 주문금액과 추천 가격 범위
- 도메인 및 `ALLOWED_ORIGINS`

## 폴더 구조

```text
public/                  웹앱, PWA, 정책 페이지
api/                     Vercel 서버리스 API
lib/                     HMAC, 캐시, 입력 검증, 요청 제한
extension/               Chrome 확장 원본
 tests/                  추천 엔진 및 보안 유틸 테스트
vercel.json              서울 리전·보안 헤더·함수 설정
.env.example             선택 환경변수 예시
DEPLOYMENT_CHECKLIST.md  공개 전 점검표
```

## Chrome 확장 배포

`extension/` 폴더는 쿠팡 장바구니 웹페이지에서 상품명과 가격을 읽어 추천 패널을 띄웁니다. 웹앱 배포와 Chrome Web Store 등록은 별개입니다.

스토어 등록용 ZIP은 프로젝트와 함께 제공되는 `rocket-fresh-fill-extension.zip`을 사용하면 됩니다. 스토어 등록 전 개인정보 처리방침 URL, 스크린샷, 설명, 운영자 연락처를 준비해야 합니다.

## 제한

- 일반 웹앱은 쿠팡 모바일 앱 내부 장바구니를 자동으로 읽을 수 없습니다. 웹앱에서는 수동 입력·붙여넣기를 사용합니다.
- Chrome 확장은 쿠팡 페이지 구조 변경에 따라 자동 인식이 깨질 수 있습니다.
- API 검색 결과가 로켓배송이라고 표시되어도 로켓프레시 적용 여부는 최종 상품 페이지에서 확인해야 합니다.
- 추천 가격대는 계산용 추정치이며 실시간 판매가가 아닙니다.
- 쿠팡의 주문 조건이나 API 정책이 바뀌면 기본값과 연동 코드를 조정해야 합니다.

## 테스트

```bash
npm test
npm run check
```

## 라이선스와 상표

소스코드는 MIT License입니다. 쿠팡, 로켓프레시 및 관련 표장은 각 권리자에게 속하며, 이 프로젝트는 쿠팡 공식 서비스가 아닙니다.
