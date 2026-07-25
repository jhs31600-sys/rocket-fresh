# Railway 배포

1. 이 폴더 안의 파일 전체를 GitHub 저장소 루트에 업로드합니다.
2. Railway에서 **New Project → Deploy from GitHub repo**를 선택합니다.
3. 해당 저장소를 선택합니다. `railway.toml`과 `npm start`가 자동 적용됩니다.
4. 배포 후 **Settings → Networking → Generate Domain**을 눌러 공개 주소를 만듭니다.
5. 쿠팡 파트너스 API를 연동할 경우 Railway **Variables**에 다음을 추가합니다.

```text
COUPANG_ACCESS_KEY=...
COUPANG_SECRET_KEY=...
COUPANG_SUB_ID=freshfill
ALLOWED_ORIGINS=https://생성된주소.up.railway.app
```

API 키가 없어도 추천 기능과 쿠팡 검색 링크는 작동합니다.

## 중요

- ZIP 파일 자체를 GitHub에 한 파일로 올리지 말고, 압축을 푼 뒤 그 안의 파일과 폴더를 업로드하세요.
- `.env`는 업로드하지 마세요. 비밀키는 Railway Variables에만 넣으세요.
- GitHub 저장소 루트에서 `package.json`, `server.js`, `public`, `api`, `lib`, `railway.toml`이 바로 보여야 합니다.
