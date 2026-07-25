# Railway Healthcheck 수정판 적용법

## GitHub에서 교체할 파일

가장 안전한 방법은 이 수정판 폴더의 전체 내용을 저장소 루트에 덮어쓰는 것입니다.
특히 다음 파일이 반드시 저장소 최상단에 있어야 합니다.

- `package.json`
- `server.js`
- `railway.json`
- `public/`
- `api/`
- `lib/`

기존 `railway.toml`과 `vercel.json`은 삭제합니다. 서로 다른 배포 설정이 남지 않게 하기 위해서입니다.

## Railway 재배포

1. GitHub에 변경사항을 커밋합니다.
2. Railway 서비스에서 새 배포가 자동 시작되는지 확인합니다.
3. 자동 시작되지 않으면 Deployments에서 `Redeploy`를 누릅니다.
4. 배포 로그에 다음과 비슷한 문구가 보여야 합니다.

```text
[startup] listening on http://0.0.0.0:xxxxx
[startup] NODE_ENV=production PORT=xxxxx
```

5. Healthcheck 경로는 `/health`입니다.

## Railway 설정에서 확인할 것

- Start Command: 비워두거나 `node server.js`
- Healthcheck Path: `/health`
- Healthcheck Timeout: `300`
- Root Directory: 저장소 루트에 파일을 올렸다면 비워둠
- `PORT` 변수: 직접 만들지 말고 Railway 자동 값을 사용
- Networking의 Target Port: 수동으로 잘못 지정했다면 제거하고 자동 감지를 사용

## 정상 확인

공개 도메인을 만든 뒤 다음 주소가 200과 JSON을 반환해야 합니다.

```text
https://내도메인.up.railway.app/health
```

앱 화면은 도메인 루트(`/`)에서 열립니다.
