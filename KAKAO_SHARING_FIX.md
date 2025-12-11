# 카카오톡 공유 이미지 문제 해결 가이드

## 문제
카카오톡 공유창에서 이미지가 빈칸으로 표시되는 경우

## 해결 방법

### 1. 카카오톡 링크 프리뷰 캐시 갱신
카카오톡은 링크 정보를 캐시하므로, 변경 후 캐시를 갱신해야 합니다.

**카카오톡 링크 프리뷰 API 사용:**
1. https://developers.kakao.com/tool/clear/og 접속
2. 공유할 URL 입력 (예: https://rainbowtalkk.vercel.app)
3. "캐시 삭제" 클릭

### 2. 이미지 확인 사항
- ✅ 이미지가 HTTPS로 접근 가능한지 확인
- ✅ 이미지 크기: 1200x630 픽셀 (권장)
- ✅ 이미지 형식: PNG 또는 JPG
- ✅ 이미지 용량: 1MB 이하 권장
- ✅ 이미지 URL이 절대 경로인지 확인

### 3. 환경 변수 설정
Vercel 환경 변수에 다음을 추가:
```
NEXT_PUBLIC_SITE_URL=https://your-actual-domain.vercel.app
```

### 4. 메타태그 확인
브라우저 개발자 도구에서 다음 메타태그가 있는지 확인:
```html
<meta property="og:image" content="https://your-domain.com/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### 5. 이미지 접근 테스트
브라우저에서 직접 이미지 URL 접근:
```
https://your-domain.com/og-image.png
```
이미지가 정상적으로 표시되어야 합니다.

## 참고
- 카카오톡은 이미지가 너무 크면 표시하지 않을 수 있습니다 (최대 8MB)
- 이미지가 로드되지 않으면 기본 이미지가 표시됩니다
- 변경 후 최대 24시간까지 캐시가 유지될 수 있습니다

