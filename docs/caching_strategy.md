# 캐싱 전략

> 2단 캐시: IndexedDB (브라우저 영구) + React Query (메모리).
> v1에서 검증된 패턴 기반.
> 이 문서는 하네스 에이전트의 초기 가이드라인이다.

---

## 캐싱 아키텍처

```
[사용자 요청]
    │
    ▼
[React Query 캐시] ─── staleTime 이내 → 즉시 반환 (fresh)
    │ stale 또는 miss
    ▼
[IndexedDB 캐시] ─── 존재 → 즉시 표시 + 백그라운드 리페치
    │ miss
    ▼
[Next.js API Route]
    │
    ▼
[KIS API / Supabase]
    │
    ▼
[응답] → IndexedDB 저장 → React Query 갱신 → UI 업데이트
```

---

## React Query 설정

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,    // 2분: 이 시간 내 재요청은 캐시 사용
      gcTime: 30 * 60 * 1000,       // 30분: 미사용 데이터 가비지 컬렉션
      retry: 2,                      // 실패 시 2회 재시도
      refetchOnWindowFocus: false,   // 포커스 시 자동 리페치 비활성
    },
  },
});
```

### 데이터별 staleTime

| 데이터 | staleTime | 이유 |
|--------|-----------|------|
| 포트폴리오 잔고 | 2분 | 실시간 불필요, 적당한 최신성 |
| 환율 | 1시간 | 하루 1-2회 변동 |
| 채권 발행정보 | 24시간 | 거의 변하지 않음 |
| 스냅샷 이력 | 5분 | 자주 변하지 않음 |
| AI 인사이트 | 1시간 | API 비용 절약 |
| 뉴스/마켓 | 15분 | 적당한 갱신 주기 |

---

## IndexedDB 캐시

### 저장소 구조

```typescript
// DB: 'kis-dashboard-cache'
// Store: 'api-cache'

interface CacheEntry {
  key: string;         // API 경로 + 파라미터 해시
  data: any;           // 응답 데이터
  timestamp: number;   // 저장 시각 (ms)
  expiresAt: number;   // 만료 시각 (ms)
}
```

### 만료 정책

| 데이터 | IndexedDB TTL | 비고 |
|--------|---------------|------|
| 포트폴리오 잔고 | 30분 | 앱 재시작 시 빠른 로딩 |
| 채권 발행정보 | 7일 | 매우 안정적 |
| 환율 | 12시간 | 하루 단위 |
| 스냅샷 | 1시간 | |

### 캐시 키 생성

```typescript
function getCacheKey(path: string, params?: Record<string, string>): string {
  const sorted = params
    ? Object.entries(params).sort().map(([k, v]) => `${k}=${v}`).join('&')
    : '';
  return `${path}?${sorted}`;
}
```

---

## 로딩 UX 패턴

### 초기 로딩 (앱 시작)
1. IndexedDB에서 캐시 데이터 즉시 로드
2. 캐시 있으면 → 즉시 UI 표시 (stale 데이터) + 배경에서 API 호출
3. 캐시 없으면 → 로딩 스피너 + API 호출

### 새로고침 (수동)
1. 헤더의 새로고침 버튼 클릭
2. React Query `invalidateQueries` → 전체 리페치
3. 진행 상태 토스트 표시 (n/6 계좌 로딩 중...)
4. IndexedDB 캐시도 갱신

### 캐시 상태 표시
- `CacheStatusBadge`: "캐시됨 (3분 전)" / "실시간" / "오프라인"
- 사용자가 현재 데이터가 얼마나 최신인지 알 수 있도록

---

## 캐시 무효화

| 트리거 | 무효화 대상 |
|--------|-----------|
| 수동 새로고침 | 전체 |
| 스냅샷 캡처 | 스냅샷 + 포트폴리오 |
| 수동 자산 CRUD | 수동 자산 + 대시보드 |
| 태그 편집 | 자산 배분 |
| 현금흐름 입력 | 현금흐름 + 수익률 |

---

## 오프라인 지원

- IndexedDB 캐시로 오프라인에서도 마지막 데이터 조회 가능
- 네트워크 에러 시 캐시 데이터 표시 + "오프라인" 배지
- 쓰기 작업(수동 자산, 저널 등)은 온라인 필수
