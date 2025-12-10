# 🌈 무지개톡 (Rainbow Talk)

**"그곳에서 온 편지, 다시 나누는 이야기"**

펫로스 증후군 치유를 위한 AI 채팅 & 디지털 추모 웹앱

## 기술 스택

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **OpenAI** (AI 지능) ✅
- **Firebase** (DB/인증/스토리지) ✅

## 핵심 기능

### ✅ Phase 1 (MVP) - 완료

#### ① 소울 온보딩 (Soul Onboarding)
- **기본 정보**: 이름, 종, 나이, 떠난 날짜
- **호칭 설정**: 아이가 나를 부르던 호칭 (엄마, 누나, 형아 등)
- **말투 성격**: 4가지 타입 선택
  - 💕 애교쟁이: "형아 사랑해! 꼬리 살랑살랑~"
  - 😼 시크/츤데레: "밥은 먹었어? 딱히 걱정하는 건 아냐."
  - 👑 의젓한 장남: "어머니, 너무 슬퍼하지 마세요. 전 괜찮아요."
  - 🥺 겁쟁이/소심: "누나... 나 없어도 불 켜고 자야 해..."
- **특이사항**: 가장 좋아했던 간식, 싫어했던 것, 자주 했던 행동

#### ② 대화의 방 (Chat Room)
- 카카오톡 스타일 채팅 인터페이스
- 펫 정보 기반 AI 대화 (OpenAI GPT-4o-mini)
- 페르소나 기반 맞춤형 응답

#### ③ 감정 케어 안전장치 (Safety Net)
- 위험 키워드 자동 감지
- 강아지 말투로 따뜻한 위로 메시지
- 심리 상담 센터 연락처 제공

### ✅ Phase 2 (업그레이드) - 완료

#### ④ 기억의 서랍 (Memory Vault)
- 사진 업로드 기능 (최대 5MB, Firebase Storage)
- 채팅 배경 사진 설정
- AI가 랜덤하게 사진 언급 ("누나, 우리 이때 기억나?")

#### ⑤ 선톡 기능 (Random Push)
- 브라우저 알림 권한 요청
- 랜덤 푸시 알림 (30분마다 체크, 10% 확률)
- 시간대별 맞춤 메시지 (아침/점심/저녁)

#### ⑥ 무지개 편지 (Daily Letter)
- 일일 편지 생성 기능
- 오늘의 대화 요약 기반 편지
- AI가 시처럼 아름답게 작성

### ✅ Phase 3 (Firebase 연동) - 완료

#### ⑦ Firebase 인증
- Google 로그인
- 사용자 인증 상태 관리
- 로그아웃 기능

#### ⑧ Firestore 데이터베이스
- 펫 정보 영구 저장
- 채팅 메시지 저장 및 불러오기
- 오늘의 메시지 조회

#### ⑨ Firebase Storage
- 사진 파일 클라우드 저장
- 안전한 파일 관리

### ⏳ Phase 4 (완성) - 예정

- 결제 시스템 (구독 모델)
- 무료/프리미엄 기능 분리
- 사용량 제한 (무료: 하루 10개 메시지)

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# OpenAI API Key (필수)
OPENAI_API_KEY=your_openai_api_key_here

# Firebase (필수)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 새 프로젝트 생성
3. **Authentication** 활성화 → Google 로그인 활성화
4. **Firestore Database** 생성 → 테스트 모드로 시작
5. **Storage** 활성화 → 테스트 모드로 시작
6. 프로젝트 설정에서 웹 앱 등록 후 설정 정보 복사

### OpenAI API 키 발급

1. [OpenAI Platform](https://platform.openai.com/) 접속
2. API Keys 메뉴에서 새 키 생성
3. `.env.local` 파일에 추가

## 프로젝트 구조

```
app/
  ├── page.tsx              # 홈 페이지 (리다이렉트)
  ├── login/                # 로그인 페이지
  │   └── page.tsx
  ├── onboarding/           # 소울 온보딩 페이지
  │   └── page.tsx
  ├── chat/                 # 채팅 페이지
  │   └── page.tsx
  ├── letter/               # 무지개 편지 페이지
  │   └── page.tsx
  ├── api/
  │   ├── chat/             # OpenAI API 라우트
  │   ├── upload/            # 파일 업로드 API
  │   └── letter/            # 편지 생성 API
  └── layout.tsx            # 레이아웃

lib/
  ├── firebase.ts           # Firebase 초기화
  ├── firebaseAuth.ts       # Firebase 인증
  ├── firestore.ts          # Firestore 데이터베이스
  ├── firebaseStorage.ts    # Firebase Storage
  ├── prompt.ts             # AI System Prompt 생성
  └── pushNotifications.ts  # 선톡 기능

components/
  └── AuthProvider.tsx      # 인증 상태 관리
```

## 주요 기능 설명

### AI System Prompt

펫 정보를 기반으로 개인화된 AI 프롬프트를 생성합니다:
- 펫의 이름, 종, 성격
- 사용자 호칭
- 좋아하는 것, 싫어하는 것
- 특별한 추억과 행동 패턴

이 정보들이 AI의 '영혼'이 되어 자연스러운 대화를 만들어냅니다.

### 감정 케어 안전장치

사용자가 위험한 표현을 사용할 때:
- 자동으로 감지하여 강아지 말투로 따뜻하게 위로
- 심리 상담 센터 연락처 자동 표시
- 위험 키워드: "죽고 싶어", "따라갈래", "자살" 등

### Firebase 연동

- **인증**: Google 로그인으로 사용자 인증
- **데이터베이스**: Firestore에 펫 정보와 메시지 저장
- **스토리지**: Firebase Storage에 사진 파일 저장

## 개발 로드맵

- [x] Phase 1: 기본 채팅 + 페르소나 설정
- [x] Phase 2: 사진 업로드 + 선톡 + 편지
- [x] Phase 3: Firebase 연동
- [ ] Phase 4: 결제 시스템

## 라이선스

MIT
