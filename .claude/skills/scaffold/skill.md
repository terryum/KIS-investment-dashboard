---
name: scaffold
description: "Next.js 16 프로젝트 초기화, shadcn/ui + Tailwind v4 설정, 디렉토리 구조 생성, 레이아웃 셸 구성, 보안 기반 파일(.gitignore, .env.example, gitleaks) 설정. 프로젝트 시작, 초기 세팅, 스캐폴딩 요청 시 반드시 이 스킬을 사용한다."
---

# Scaffold — 프로젝트 초기화

## 실행 순서

### 1. 보안 기반 (가장 먼저)
```bash
# gitleaks 설치 확인
which gitleaks || brew install gitleaks

# husky 설정 (package.json 생성 후)
npx husky init
echo "gitleaks protect --staged --verbose" > .husky/pre-commit
```

`.gitleaks.toml` 생성: `docs/security_architecture.md`의 커스텀 룰 적용.

### 2. Next.js 16 초기화
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

### 3. shadcn/ui 초기화
```bash
npx shadcn@latest init
# 필요한 컴포넌트 추가
npx shadcn@latest add button card input table tabs accordion dialog sheet badge tooltip popover select
```

### 4. 의존성 설치
```bash
npm install zustand @tanstack/react-query recharts @supabase/supabase-js ai @ai-sdk/openai date-fns lucide-react
```

### 5. 디렉토리 구조
```
src/
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx            # PIN 로그인 → /dashboard 리디렉트
│   ├── dashboard/page.tsx
│   ├── accounts/page.tsx
│   ├── allocation/page.tsx
│   ├── performance/page.tsx
│   ├── insights/page.tsx
│   ├── journal/page.tsx
│   ├── settings/page.tsx
│   └── api/               # API Routes
├── components/
│   ├── layout/            # Sidebar, BottomTabBar, AppHeader
│   ├── ui/                # shadcn 컴포넌트
│   └── common/            # MoneyDisplay, PercentDisplay 등
├── lib/
│   ├── kis/               # KIS API 클라이언트
│   ├── supabase/          # Supabase 클라이언트
│   ├── allocation/        # 자산배분 계산
│   ├── cache/             # IndexedDB 캐시
│   └── utils/             # 유틸리티
├── hooks/                 # 커스텀 훅
├── stores/                # Zustand 스토어
└── types/                 # 공통 타입
```

### 6. .env.example 생성
`docs/security_architecture.md` 기반 플레이스홀더 값만 포함.

### 7. 레이아웃 셸
`docs/ui_spec.md` 기반으로:
- PC: 사이드바 (240px, 접기 가능) + 메인 콘텐츠
- 모바일: 하단 탭 바 (6개 메뉴) + 메인 콘텐츠
- 공통: 상단 헤더 (앱 이름, 날짜, 새로고침)

## 참조 문서
- `docs/tech_stack.md` — 버전 정보
- `docs/ui_spec.md` — 레이아웃 구조
- `docs/security_architecture.md` — 보안 설정
