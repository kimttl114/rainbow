# 아이콘 생성 가이드

아이폰 사파리에서 홈 화면에 추가하기 기능을 사용하려면 다음 아이콘 파일들이 필요합니다.

## 필요한 아이콘 파일

1. **apple-touch-icon.png** (180x180 픽셀)
   - iOS Safari 홈 화면 아이콘
   - 위치: `public/apple-touch-icon.png`

2. **icon-192.png** (192x192 픽셀)
   - PWA 아이콘 (작은 크기)
   - 위치: `public/icon-192.png`

3. **icon-512.png** (512x512 픽셀)
   - PWA 아이콘 (큰 크기)
   - 위치: `public/icon-512.png`

## 아이콘 디자인 가이드

- **배경**: 무지개톡 브랜드 컬러 또는 투명 배경
- **이미지**: 무지개톡 로고 또는 대표 이미지
- **형식**: PNG (투명 배경 가능)
- **스타일**: 둥근 모서리 (iOS는 자동으로 적용)

## 생성 방법

1. **온라인 도구 사용**
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator

2. **이미지 편집 도구 사용**
   - Photoshop, Figma, Canva 등
   - 각 크기로 리사이즈 후 저장

3. **기존 이미지 활용**
   - `og-image.png`를 기반으로 아이콘 생성 가능

## 파일 배치

모든 아이콘 파일을 `public/` 폴더에 배치하세요:
```
public/
  ├── apple-touch-icon.png (180x180)
  ├── icon-192.png (192x192)
  └── icon-512.png (512x512)
```

## 참고

- 아이콘이 없어도 앱은 작동하지만, 홈 화면에 추가할 때 기본 아이콘이 표시됩니다
- 아이콘을 추가하면 더 전문적이고 브랜드 일관성을 유지할 수 있습니다

