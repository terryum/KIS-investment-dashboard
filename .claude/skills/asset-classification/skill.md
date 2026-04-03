---
name: asset-classification
description: "ETF 이름 파싱, 자산군/국가/통화/섹터 자동 분류, 채권 분석(표면이율/실질이율/만기), 자산배분 계산 엔진. ETF 분류, 자산 태그, 배분 비율, 채권 만기, 리밸런싱 관련 작업 시 반드시 이 스킬을 사용한다."
---

# Asset Classification — 자산 분류 & 배분 엔진

## ETF 이름 파싱 로직

### 단계 1: 키워드 매칭 (규칙 기반)
```typescript
function classifyETF(name: string): AssetTags {
  // 자산군 판별
  if (/국고채|미국채|회사채|하이일드|채권|bond/i.test(name)) return { real_asset_class: 'bond' };
  if (/골드|금|GOLD/i.test(name)) return { real_asset_class: 'commodity' };
  if (/비트코인|BTC|이더리움|ETH|크립토/i.test(name)) return { real_asset_class: 'alternative' };
  if (/리츠|REIT/i.test(name)) return { real_asset_class: 'reit' };

  // 국가/통화 판별
  if (/차이나|항셍|중국|CSI|상해|심천/i.test(name)) return { country: 'CN', real_currency: 'CNY' };
  if (/인도|NIFTY/i.test(name)) return { country: 'IN' };
  if (/일본|TOPIX|닛케이/i.test(name)) return { country: 'JP' };
  // ...

  // 헤지 판별
  if (/\(H\)|\(합성\)|합성H|환헤지/i.test(name)) return { is_hedged: true, real_currency: 'KRW' };

  return { real_asset_class: 'stock' }; // 기본값
}
```

### 단계 2: AI 분류 (GPT-4o fallback)
규칙으로 분류 불가 시 AI SDK `generateObject`로 structured output 요청.

## 배분 계산 엔진

5개 차원별 계산:
1. **자산군**: real_asset_class 기준 집계
2. **국가**: country 태그 기준 집계
3. **통화**: real_currency 기준 (is_hedged면 KRW)
4. **주식 구조**: etf_structure 기준 (broad/factor/sector/theme/individual)
5. **채권 구조**: 만기 그룹 (1년 이내 / 1-3년 / 3-5년 / 5-10년 / 10년+)

## 채권 분석

| 필드 | 소스 | 설명 |
|------|------|------|
| 표면이율 (쿠폰율) | CTPF1101R `int_rate` | 발행 시 고정 이자율 |
| 실질이율 (YTM) | 매입가 기반 계산 | (쿠폰 + (액면-매입가)/잔존기간) / ((액면+매입가)/2) |
| 만기일 | CTPF1101R `expd_dt` | YYYYMMDD 형식 |
| 만기까지 일수 | 계산 | dayjs diff |
| HTM vs MTM | 수동 태그 | assets_master.tags.bond_strategy |

## 참조 문서
- `.private/my_context.md` — ETF 분류 주의사항 (비공개)
- `docs/database_schema.md` — assets_master.tags 구조
