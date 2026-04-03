# UI/UX 설계

> shadcn/ui + Tailwind CSS v4 + Recharts 3.
> PC 사이드바 + 모바일 하단탭 반응형 레이아웃.
> 이 문서는 하네스 에이전트의 초기 가이드라인이다.

---

## 레이아웃 구조

### PC (md 이상: ≥768px)

```
┌─────────────────────────────────────────────┐
│ Header (앱 이름, 날짜, 새로고침, 설정)         │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │         Main Content             │
│          │                                  │
│ 대시보드  │   (선택된 메뉴의 페이지)            │
│ 계좌별   │                                  │
│ 자산배분  │                                  │
│ 수익률   │                                  │
│ 마켓     │                                  │
│ 저널     │                                  │
│          │                                  │
│ ──────── │                                  │
│ 설정     │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

- 사이드바 폭: ~240px (접기 가능 → 아이콘 모드 ~64px)
- 메뉴 항목: 아이콘 + 텍스트
- 하단에 설정 메뉴

### 모바일 (< 768px)

```
┌──────────────────────┐
│ Header (간소화)       │
├──────────────────────┤
│                      │
│    Main Content      │
│    (스크롤)           │
│                      │
├──────────────────────┤
│ 🏠  📊  🎯  📈  💡  📝 │
│ Tab Bar (6개 메뉴)    │
└──────────────────────┘
```

- 하단 탭: 아이콘 + 짧은 라벨
- 6개 메뉴가 많으면 5개 + "더보기" 패턴 고려
- 헤더 간소화 (날짜 + 새로고침만)

---

## 색상 규칙

### 한국 금융 컨벤션
| 의미 | 색상 | 용도 |
|------|------|------|
| 상승 / 양수 | 빨간색 (`red-500`) | 주가 상승, 수익 |
| 하락 / 음수 | 파란색 (`blue-500`) | 주가 하락, 손실 |
| 보합 | 회색 (`gray-500`) | 변동 없음 |

### 자산군 색상
| 자산군 | 색상 | 비고 |
|--------|------|------|
| 주식 | blue | |
| 채권 | green | |
| 현금 | gray | |
| 금/원자재 | amber/yellow | |
| 대체투자 | purple | 암호화폐 ETF 등 |
| 부동산 | orange | |

### UI 테마
- 라이트 모드 기본
- 다크 모드 지원 (shadcn 기본 제공)
- 숫자: 모노스페이스 폰트 (`tabular-nums`)

---

## 페이지별 컴포넌트 구조

### 1. 대시보드 (`/dashboard`)

```
DashboardPage
├── TotalAssetCard          — 총 자산 금액 + 전주 대비 변동
├── DailyChangeCard         — 전일 대비 손익 (금액 + %)
├── AssetAllocationMiniChart — 자산군별 파이/도넛 (요약)
├── TopHoldingsBarList      — 상위 10 종목 바 리스트
├── PortfolioValueMiniChart — 최근 1개월 가치 추이 라인
├── RecentIncomeCard        — 최근 배당/이자 요약
└── ManualAssetsSummaryCard — 수동 자산 합계 카드
```

### 2. 계좌별 현황 (`/accounts`)

```
AccountsPage
├── PortfolioSummaryCard    — 전체 평가금 + 손익 + 수익률
├── DateSelector            — 과거 날짜 조회 (타임머신)
├── AccountAccordion[]      — 계좌별 아코디언
│   ├── CategoryCard (국내주식)
│   │   └── HoldingItemCard[]
│   ├── CategoryCard (해외주식)
│   ├── CategoryCard (채권)
│   ├── CategoryCard (ELS/RP/발행어음)
│   ├── CategoryCard (현금)
│   └── CategoryCard (수동자산)
├── AddManualAssetButton    — 수동 자산 추가
└── Modals
    ├── ItemDetailModal     — 종목 상세 + 태그 편집
    ├── AddManualAssetModal — 수동 자산 입력 폼
    └── CashDetailModal     — 현금 상세 (원화/외화)
```

### 3. 자산 배분 (`/allocation`)

```
AllocationPage
├── AllocationSection (자산군별)
│   ├── DonutChart + Legend
│   ├── AllocationDetailTable
│   └── AIInsightCard
├── AllocationSection (국가별)
├── AllocationSection (통화별)
├── AllocationSection (주식 구조)
│   └── (Broad ETF / Factor / Sector / Theme / 개별주)
├── AllocationSection (채권 구조)
│   └── (만기 래더 바 차트 + HTM/MTM 분류)
└── HoldingListPopup        — 차트 클릭 시 구성종목 팝업
```

### 4. 수익률 분석 (`/performance`)

```
PerformancePage
├── Tabs: [수익률 | 현금흐름 | 인컴]
│
├── Tab: 수익률
│   ├── PeriodSelector       — 1W/1M/3M/6M/YTD/1Y/ALL
│   ├── ReturnsSummaryCard   — 총 수익률 + 벤치마크 대비
│   ├── ReturnsLineChart     — 시계열 수익률 차트
│   ├── UnrealizedPnLCard    — 미실현 손익 현황
│   ├── HoldingsReturnTable  — 종목별 수익률 랭킹
│   └── SnapshotButton       — "지금 스냅샷 찍기" 버튼
│
├── Tab: 현금흐름
│   ├── MonthlyCashFlowChart — 월별 순입금/순출금 바 차트
│   ├── AssetGrowthBreakdown — 자산 증가 분해 (투자수익 + 신규유입 + 인컴)
│   ├── CashFlowTable        — 입출금 내역 테이블
│   └── AddCashFlowButton    — 현금흐름 수동 입력
│
└── Tab: 인컴
    ├── YearSelector         — 연도 선택
    ├── IncomeSummaryCard    — YTD 합계 + 월평균
    ├── IncomeTypeChart      — 유형별 차트 (배당/분배/이자)
    ├── IncomeTable          — 인컴 내역 테이블
    └── DividendSchedule     — 배당 예정 일정
```

### 5. 마켓 인사이트 (`/insights`)

```
InsightsPage
├── Tabs: [뉴스 | 소스관리 | 워치리스트]
│
├── Tab: 뉴스
│   ├── AIPortfolioComment   — AI 포트폴리오 종합 코멘트
│   ├── NewsFeed[]           — 보유종목 관련 뉴스 (요약 포함)
│   ├── AnalystOpinions      — 투자의견 테이블
│   └── EstimatedEarnings    — 추정실적 테이블
│
├── Tab: 소스관리
│   ├── SourceList           — 팔로우 중인 소스 목록
│   ├── SourcePerspectiveTag — 관점 태그 (상승/하락/가치/성장 등)
│   ├── AddSourceButton      — 소스 추가
│   └── AISourceRecommend    — AI 소스 추천 카드
│
└── Tab: 워치리스트
    ├── WatchlistTable       — 관심 종목 테이블
    └── AddWatchButton       — 관심 종목 추가
```

### 6. 투자 저널 (`/journal`)

```
JournalPage
├── JournalSearchBar        — 검색 + 필터 (종목, 태그, 유형)
├── JournalList             — 저널 목록 (카드/리스트 뷰 전환)
│   └── JournalCard[]       — 개별 저널 카드
├── CreateJournalButton     — 새 저널 작성
└── Modals
    ├── JournalDetailModal  — 저널 상세 보기
    ├── JournalEditModal    — 저널 작성/수정 폼
    └── OutcomeAnalysis     — 당시 판단 vs 실제 결과
```

---

## 공통 컴포넌트

### 레이아웃
- `AppLayout` — 사이드바/하단탭 + 헤더 + 메인
- `Sidebar` — PC 네비게이션
- `BottomTabBar` — 모바일 네비게이션
- `AppHeader` — 상단 헤더

### UI 기본 (shadcn)
- `Card`, `Button`, `Input`, `Select`
- `Table`, `Tabs`, `Accordion`
- `Dialog`, `Sheet`, `Popover`
- `Badge`, `Tooltip`

### 도메인 공통
- `PinLogin` — PIN 입력 화면
- `LoadingProgress` — 로딩 진행바
- `CacheStatusBadge` — 캐시 상태 표시
- `MoneyDisplay` — 금액 표시 (원화 포맷, 색상, +/- 부호)
- `PercentDisplay` — 수익률 표시 (색상 자동)
- `TickerBadge` — 종목 코드/이름 배지
- `AssetTagEditor` — 자산 분류 태그 편집기

---

## 인터랙션 패턴

### 데이터 로딩
1. 캐시 히트 → 즉시 표시 (stale 데이터)
2. 백그라운드 리페치 → 완료 시 자연스럽게 갱신
3. 전체 새로고침 → 헤더 새로고침 버튼 + 로딩 프로그레스

### 차트 인터랙션
- 도넛/파이 범례 클릭 → 구성종목 팝업
- 구성종목 클릭 → 종목 상세 모달
- 라인 차트 호버 → 날짜별 값 툴팁

### 반응형 브레이크포인트
| 크기 | Tailwind | 레이아웃 |
|------|----------|---------|
| < 640px | `sm` 미만 | 모바일: 하단탭, 1컬럼 |
| 640-767px | `sm` | 모바일: 하단탭, 1-2컬럼 |
| 768-1023px | `md` | PC: 사이드바(접힘), 2컬럼 |
| ≥ 1024px | `lg` | PC: 사이드바(펼침), 2-3컬럼 |
