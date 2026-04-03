---
name: integration-qa
description: "API-Frontend 타입 교차 검증, 경계면 버그 탐지, 파일경로-링크 매핑, DB 스키마-쿼리 일치 확인. 빌드 에러, 타입 불일치, shape 오류, 통합 테스트, QA 관련 작업 시 반드시 이 스킬을 사용한다."
---

# Integration QA — 통합 정합성 검증

## 검증 방법론

### ICV-1: API Response ↔ Frontend Hook

양쪽을 동시에 열어 비교한다:

```
1. API Route 파일에서 NextResponse.json()의 반환 shape 추출
2. Frontend 훅에서 useQuery<T>의 T 타입 추출
3. 필드명, 타입, 중첩 구조 비교
4. snake_case ↔ camelCase 변환 확인
5. wrapping 확인 ({data: []} vs [] 직접 반환)
```

### ICV-2: File Path ↔ Link Path

```
1. src/app/ 하위의 모든 page.tsx 파일 경로 수집
2. 소스 전체에서 href=, router.push(), redirect() 값 수집
3. 1:1 매핑 확인 (route groups, dynamic segments 고려)
4. 404가 될 링크 식별
```

### ICV-3: DB Schema ↔ API Query

```
1. supabase/migrations/에서 테이블 스키마 추출
2. API Route의 Supabase 쿼리에서 사용하는 컬럼명 수집
3. 불일치 컬럼, 누락 필수값, 잘못된 타입 식별
```

### ICV-4: 빌드 검증

```bash
npm run build 2>&1
# TypeScript 에러, import 오류, 미사용 변수 확인
```

## 리포트 형식

```markdown
## QA 리포트 — {모듈명}

### 검증 결과
| 검증 | 상태 | 이슈 |
|------|------|------|
| API-Hook 타입 | ✅/❌ | {상세} |
| 경로-링크 | ✅/❌ | {상세} |
| DB-쿼리 | ✅/❌ | {상세} |
| 빌드 | ✅/❌ | {상세} |

### 수정 요청
- {에이전트명}: {구체적 수정 내용}
```

## 점진적 QA 타이밍

| 완료 시점 | QA 범위 |
|----------|---------|
| KIS 잔고 API + 훅 | ICV-1 (balance shape) |
| 대시보드 페이지 | ICV-2 (네비게이션 링크) |
| 스냅샷 API + DB | ICV-3 (snapshots 스키마) |
| 각 페이지 완료 시 | ICV-1 + ICV-2 |
| 전체 완료 | ICV-1~4 전체 + 빌드 |
