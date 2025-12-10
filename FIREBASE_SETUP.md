# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: "rainbow-talk")
4. Google Analytics는 선택 사항

## 2. Authentication 설정

1. 왼쪽 메뉴에서 **"Authentication"** 클릭
2. "시작하기" 클릭
3. **"Sign-in method"** 탭 클릭
4. **"Google"** 제공업체 클릭
5. "사용 설정" 토글 ON
6. 프로젝트 지원 이메일 선택
7. "저장" 클릭

## 3. Firestore Database 설정

1. 왼쪽 메뉴에서 **"Firestore Database"** 클릭
2. "데이터베이스 만들기" 클릭
3. **"테스트 모드로 시작"** 선택 (나중에 보안 규칙 설정)
4. 위치 선택 (asia-northeast3 권장 - 서울)
5. "사용 설정" 클릭

### Firestore 보안 규칙 설정

1. Firestore Database 페이지에서 **"규칙"** 탭 클릭
2. 아래 규칙을 복사하여 붙여넣기:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /pets/{petId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /messages/{messageId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /subscriptions/{subscriptionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /dreams/{dreamId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /gifts/{giftId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

3. "게시" 클릭

## 4. Storage 설정

1. 왼쪽 메뉴에서 **"Storage"** 클릭
2. "시작하기" 클릭
3. **"테스트 모드로 시작"** 선택
4. 위치 선택 (Firestore와 동일하게)
5. "완료" 클릭

### Storage 보안 규칙 설정

1. Storage 페이지에서 **"규칙"** 탭 클릭
2. 아래 규칙을 복사하여 붙여넣기:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/photos/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. "게시" 클릭

## 5. 웹 앱 등록 및 설정 정보 가져오기

1. 프로젝트 설정(톱니바퀴 아이콘) 클릭
2. "내 앱" 섹션에서 **웹 아이콘(</>)** 클릭
3. 앱 닉네임 입력 (예: "rainbow-talk-web")
4. "앱 등록" 클릭
5. 표시된 설정 정보 복사

## 6. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 내용을 추가:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 7. 테스트

1. 개발 서버 재시작: `npm run dev`
2. 브라우저에서 `http://localhost:3000` 접속
3. Google 로그인 테스트
4. 온보딩 → 채팅 플로우 테스트

## 주의사항

- **보안 규칙**: 프로덕션 환경에서는 보안 규칙을 더 엄격하게 설정하세요
- **환경 변수**: `.env.local` 파일은 절대 Git에 커밋하지 마세요
- **테스트 모드**: 현재는 테스트 모드로 설정되어 있어, 인증된 사용자만 접근 가능합니다

