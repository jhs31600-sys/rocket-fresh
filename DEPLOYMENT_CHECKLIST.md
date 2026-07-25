# 공개 배포 점검표

## 필수

- [ ] `npm test`와 `npm run check` 통과
- [ ] Vercel 배포 주소에서 장바구니 입력·추천·쿠팡 링크 확인
- [ ] 모바일 화면에서 상품 행과 추천 카드 확인
- [ ] 실제 운영자 이름 또는 사업자 정보, 문의처 추가
- [ ] `public/privacy.html`을 실제 수집 항목과 호스팅 정책에 맞게 수정
- [ ] `public/terms.html`을 실제 운영 조건에 맞게 수정
- [ ] 서비스가 쿠팡 공식 도구가 아니라는 문구 유지
- [ ] 기본 최소 주문금액이 현재 주문 조건과 맞는지 확인

## 쿠팡 파트너스 API 사용 시

- [ ] `COUPANG_ACCESS_KEY`, `COUPANG_SECRET_KEY`를 Vercel 환경변수로만 저장
- [ ] 키가 Git 기록이나 브라우저 번들에 들어가지 않았는지 확인
- [ ] `/api/health`에서 `apiConfigured: true` 확인
- [ ] 실제 상품 불러오기 버튼과 직접 링크 확인
- [ ] 화면의 쿠팡 파트너스 경제적 이해관계 고지 확인
- [ ] 최신 쿠팡 파트너스 이용정책, API 호출 제한, 링크 표시 규칙 확인
- [ ] 비용·호출량 모니터링 및 필요 시 Vercel WAF/외부 Rate Limit 적용

## 도메인과 보안

- [ ] HTTPS 커스텀 도메인 연결
- [ ] `ALLOWED_ORIGINS`를 실제 도메인으로 설정
- [ ] Vercel 환경변수를 Production/Preview 범위에 맞게 분리
- [ ] 배포 로그에 비밀키나 원문 API 응답이 찍히지 않는지 확인
- [ ] 외부 상품 이미지와 링크가 정상 작동하는지 확인

## Chrome Web Store 등록 시

- [ ] `rocket-fresh-fill-extension.zip` 사용
- [ ] 확장 설명, 아이콘, 스크린샷 준비
- [ ] 개인정보 처리방침 공개 URL 입력
- [ ] 쿠팡 페이지 접근 권한의 사용 목적을 스토어 심사 설명에 명확히 기재
- [ ] 쿠팡 장바구니 페이지에서 자동 인식 정확도 재검증
