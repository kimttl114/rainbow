# Firebase 보안 규칙 설정 가이드

## ⚠️ 중요: 이 규칙을 반드시 설정해야 합니다!

Firebase Console에서 아래 규칙을 설정하지 않으면 "Missing or insufficient permissions" 오류가 발생합니다.

## 1. Firestore 보안 규칙 설정

### 설정 방법:
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **"Firestore Database"** 클릭
4. 상단 탭에서 **"규칙"** 클릭
5. 아래 코드를 복사하여 붙여넣기
6. **"게시"** 버튼 클릭

### 규칙 코드:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 데이터
    match /users/{userId} {
      // 사용자는 자신의 데이터만 읽고 쓸 수 있음
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // 펫 정보
      match /pets/{petId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // 메시지
      match /messages/{messageId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // 구독 정보
      match /subscriptions/{subscriptionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // 꿈 일기
      match /dreams/{dreamId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // 가상 선물
      match /gifts/{giftId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## 2. Storage 보안 규칙 설정

### 설정 방법:
1. Firebase Console에서 왼쪽 메뉴 **"Storage"** 클릭
2. 상단 탭에서 **"규칙"** 클릭
3. 아래 코드를 복사하여 붙여넣기
4. **"게시"** 버튼 클릭

### 규칙 코드:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 사용자 사진 폴더
    match /users/{userId}/photos/{fileName} {
      // 사용자는 자신의 사진만 업로드/다운로드/삭제 가능
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 3. 테스트 모드 (개발 중 임시 사용)

개발 중에는 아래 규칙을 사용할 수 있지만, **프로덕션에서는 절대 사용하지 마세요!**

### Firestore 테스트 모드:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage 테스트 모드:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 확인 방법

규칙을 설정한 후:
1. 브라우저를 새로고침
2. 다시 로그인 시도
3. 온보딩 페이지에서 데이터 저장 시도
4. 콘솔에서 권한 오류가 사라졌는지 확인

## 문제 해결

여전히 권한 오류가 발생하면:
1. Firebase Console에서 규칙이 제대로 게시되었는지 확인
2. 사용자가 로그인되어 있는지 확인
3. 브라우저 콘솔에서 Firebase 인증 상태 확인
4. 환경 변수가 올바르게 설정되었는지 확인

