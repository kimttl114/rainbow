# Vercel 배포 가이드

## 📋 사전 준비

### 1. GitHub 저장소 준비

1. GitHub 계정이 없다면 [GitHub](https://github.com)에서 계정 생성
2. 새 저장소 생성:
   - Repository name: `rainbow-talk` (또는 원하는 이름)
   - Public 또는 Private 선택
   - README, .gitignore, license는 추가하지 않음 (이미 있음)

3. 로컬에서 Git 초기화 및 푸시:

```bash
# Git 초기화 (아직 안 했다면)
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: 무지개톡 프로젝트"

# GitHub 저장소 연결 (YOUR_USERNAME을 본인 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/rainbow-talk.git

# 메인 브랜치로 푸시
git branch -M main
git push -u origin main
```

### 2. Vercel 계정 생성

1. [Vercel](https://vercel.com) 접속
2. "Sign Up" 클릭
3. GitHub 계정으로 로그인 (권장)

## 🚀 Vercel 배포 단계

### 방법 1: Vercel 웹 대시보드 사용 (추천)

1. **프로젝트 가져오기**
   - Vercel 대시보드에서 "Add New..." → "Project" 클릭
   - GitHub 저장소 선택: `rainbow-talk`
   - "Import" 클릭

2. **프로젝트 설정**
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)
   - **Install Command**: `npm install` (기본값)

3. **환경 변수 설정** (중요!)
   - "Environment Variables" 섹션 클릭
   - 아래 변수들을 하나씩 추가:

```
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

   - 각 변수 추가 후:
     - **Environment**: Production, Preview, Development 모두 선택
     - "Save" 클릭

4. **배포 시작**
   - "Deploy" 버튼 클릭
   - 빌드 진행 상황 확인 (약 2-3분 소요)

5. **배포 완료**
   - 배포가 완료되면 자동으로 URL이 생성됨
   - 예: `rainbow-talk-abc123.vercel.app`
   - "Visit" 버튼으로 사이트 확인

### 방법 2: Vercel CLI 사용

1. **Vercel CLI 설치**
```bash
npm i -g vercel
```

2. **로그인**
```bash
vercel login
```

3. **배포**
```bash
# 프로젝트 루트에서 실행
vercel
```

4. **환경 변수 설정**
```bash
# 각 환경 변수 추가
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
```

5. **프로덕션 배포**
```bash
vercel --prod
```

## 🔧 배포 후 확인 사항

### 1. Firebase 설정 확인

Firebase Console에서 **Authorized domains**에 Vercel 도메인 추가:

1. Firebase Console → Authentication → Settings
2. "Authorized domains" 섹션
3. "Add domain" 클릭
4. Vercel 도메인 추가:
   - `your-project.vercel.app`
   - 커스텀 도메인 사용 시 해당 도메인도 추가

### 2. Firebase Storage CORS 설정

Firebase Storage에서 CORS 설정 확인:

1. Firebase Console → Storage → Rules
2. CORS 설정이 필요할 수 있음 (이미 설정되어 있을 수 있음)

### 3. 테스트

배포된 사이트에서 다음 기능 테스트:

- [ ] Google 로그인
- [ ] 온보딩 프로세스
- [ ] 채팅 기능
- [ ] 사진 업로드
- [ ] 무지개 편지 생성
- [ ] 꿈 일기
- [ ] 가상 선물

## 🌐 커스텀 도메인 연결

### 1. 도메인 구매

- 가비아, 후이즈, Namecheap 등에서 도메인 구매

### 2. Vercel에 도메인 추가

1. Vercel 대시보드 → 프로젝트 → Settings → Domains
2. "Add Domain" 클릭
3. 도메인 입력 (예: `rainbowtalk.com`)
4. DNS 설정 안내 확인

### 3. DNS 설정

도메인 등록 사이트에서 DNS 레코드 추가:

**Vercel이 제공하는 DNS 정보:**
- Type: `A` 또는 `CNAME`
- Name: `@` (루트 도메인) 또는 `www`
- Value: Vercel이 제공하는 IP 주소 또는 CNAME 값

**예시:**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 4. SSL 인증서

- Vercel이 자동으로 SSL 인증서 발급 (Let's Encrypt)
- 몇 분에서 몇 시간 소요

## 🔄 자동 배포 설정

GitHub에 코드를 푸시하면 자동으로 배포됩니다:

1. **자동 배포 활성화** (기본적으로 활성화됨)
   - Vercel → Settings → Git
   - Production Branch: `main` (또는 `master`)

2. **배포 브랜치**
   - `main` 브랜치 푸시 → Production 배포
   - 다른 브랜치 푸시 → Preview 배포

## 📊 모니터링

Vercel 대시보드에서 확인 가능:

- 배포 히스토리
- 빌드 로그
- 성능 메트릭
- 에러 로그
- 트래픽 통계

## 🐛 문제 해결

### 빌드 실패

1. **로컬에서 빌드 테스트**
```bash
npm run build
```

2. **에러 확인**
   - Vercel 대시보드 → Deployments → 실패한 배포 클릭
   - Build Logs 확인

3. **일반적인 문제**
   - 환경 변수 누락
   - TypeScript 오류
   - 의존성 문제

### 환경 변수 문제

1. Vercel → Settings → Environment Variables
2. 모든 변수가 올바르게 설정되었는지 확인
3. Production, Preview, Development 모두 설정되었는지 확인

### Firebase 인증 오류

1. Firebase Console → Authentication → Settings
2. Authorized domains에 Vercel 도메인 추가 확인

## 📝 추가 참고사항

- Vercel 무료 플랜: 무제한 배포, 100GB 대역폭
- 프로덕션 빌드 최적화 자동 적용
- CDN 자동 설정
- 자동 HTTPS

## 🎉 완료!

배포가 완료되면 사용자들이 접속할 수 있습니다!

