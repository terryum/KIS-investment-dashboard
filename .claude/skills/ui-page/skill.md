---
name: ui-page
description: "shadcn/ui 기반 페이지 컴포넌트 구현, Recharts 차트, React Query 훅, 반응형 레이아웃. 대시보드, 계좌, 자산배분, 수익률, 인사이트, 저널 페이지 UI 구현 시 반드시 이 스킬을 사용한다."
---

# UI Page — 페이지 컴포넌트 구현

## 구현 순서

### Phase 1: 공통 컴포넌트
1. `MoneyDisplay` — 원화 포맷, 색상 (빨간=양수, 파란=음수), tabular-nums
2. `PercentDisplay` — 수익률 표시, +/- 부호, 색상
3. `LoadingProgress` — 로딩 진행바 (n/6 계좌 로딩 중)
4. `CacheStatusBadge` — 캐시 상태 ("3분 전", "실시간")
5. `PinLogin` — PIN 입력 화면

### Phase 2: 대시보드 + 계좌 (P0)
6. Dashboard page — `docs/ui_spec.md` 3.1절 참조
7. Accounts page — 3.2절 참조

### Phase 3: 자산배분 + 수익률 (P0-P1)
8. Allocation page — 3.3절 참조 (5개 배분 차원)
9. Performance page — 3.4절 참조 (수익률 + 현금흐름 + 인컴 탭)

### Phase 4: 인사이트 + 저널 (P1)
10. Insights page — 3.5절 참조 (뉴스 + 소스관리 + 워치리스트 탭)
11. Journal page — 3.6절 참조

## 한국 금융 UI 규칙
- 상승/양수: `text-red-500` (빨간)
- 하락/음수: `text-blue-500` (파란)
- 보합: `text-gray-500`
- 금액: 천 단위 콤마, "원" 접미사
- 수익률: +/- 부호 + % 접미사

## React Query 훅 패턴
```typescript
// 각 페이지의 데이터 페칭 훅
function usePortfolioBalance() {
  return useQuery({
    queryKey: ['portfolio', 'balance'],
    queryFn: () => fetchJson('/api/kis/balance'),
    staleTime: 2 * 60 * 1000,
  });
}
```

## 차트 패턴 (Recharts 3)
- 도넛: PieChart + Cell + Legend (자산배분)
- 바: BarChart + Bar (상위종목, 월별 인컴)
- 라인: LineChart + Line + Tooltip (수익률 시계열)
- 인터랙션: Legend 클릭 → 구성종목 팝업

## 참조 문서
- `docs/ui_spec.md` — 컴포넌트 구조
- `docs/caching_strategy.md` — 캐싱 전략
