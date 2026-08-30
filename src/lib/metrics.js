import { applyQuery, groupRecords } from './query.js'

/**
 * 지표(Metric) 모델 — 대시보드가 목록과 같은 언어를 쓰게 만듭니다.
 *
 * 이게 이 대시보드와 흔한 대시보드의 결정적 차이입니다:
 *
 *   흔한 대시보드 → 지표는 서버가 준 숫자. 클릭해도 갈 곳이 없습니다.
 *   이 대시보드   → **지표 = 질의 + 집계**. 숫자가 어떤 레코드에서 나왔는지
 *                   알고 있으므로, 클릭하면 그 질의를 그대로 목록에 넘길 수 있습니다.
 *
 * 그래서 "오류율 1.8% 상승"을 보고 바로 그 오류들의 목록으로 들어갈 수 있습니다.
 * 대시보드가 보기만 하는 화면이 아니라 **작업의 입구**가 됩니다.
 *
 * @typedef {object} Metric
 * @property {string} id
 * @property {string} label
 * @property {object} query                  - 이 지표가 세는 레코드의 조건
 * @property {'count'|'sum'|'avg'|'max'} [aggregate]
 * @property {string} [field]                - sum/avg/max 대상 필드
 * @property {string} [unit]
 * @property {boolean} [lowerIsBetter]       - 오류율·응답시간처럼 낮을수록 좋은 지표
 * @property {{warn?: number, danger?: number}} [threshold] - 임계값
 * @property {string} [breakdownBy]          - 분해 기준 필드 key
 */

/** 지표 하나를 계산합니다. matched 에 실제 레코드가 들어 있어 드릴다운이 가능합니다. */
export function computeMetric(metric, records, fields) {
  const matched = applyQuery(records, metric.query, fields)
  const value = aggregate(matched, metric)
  return {
    ...metric,
    value,
    matched,
    count: matched.length,
    state: thresholdState(value, metric),
  }
}

function aggregate(records, metric) {
  const { aggregate: type = 'count', field } = metric
  if (type === 'count') return records.length
  const values = records
    .map((r) => Number(r[field]))
    .filter((n) => Number.isFinite(n))
  if (values.length === 0) return 0
  switch (type) {
    case 'sum': return values.reduce((a, b) => a + b, 0)
    case 'avg': return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
    case 'max': return Math.max(...values)
    default: return records.length
  }
}

/**
 * 임계값 상태 — 'ok' | 'warn' | 'danger'
 *
 * 지표가 자기 건강 범위를 아는 것이 중요합니다. 숫자만 크게 띄우면
 * 사용자가 매번 "이게 높은 건가 낮은 건가"를 판단해야 합니다.
 */
export function thresholdState(value, metric) {
  const t = metric.threshold
  if (!t) return 'ok'
  const worse = (a, b) => (metric.lowerIsBetter === false ? a <= b : a >= b)
  if (t.danger != null && worse(value, t.danger)) return 'danger'
  if (t.warn != null && worse(value, t.warn)) return 'warn'
  return 'ok'
}

/**
 * 기간 비교 — 이전 구간 대비 증감.
 *
 * "12% 증가"만 보여주면 무엇 대비인지 알 수 없습니다.
 * 비교 대상 값과 기간 라벨을 함께 반환해 화면에서 밝힐 수 있게 합니다.
 */
export function compareMetric(current, previousRecords, metric, fields) {
  const previousMatched = applyQuery(previousRecords, metric.query, fields)
  const previous = aggregate(previousMatched, metric)
  const delta = previous === 0
    ? (current === 0 ? 0 : 100)
    : Math.round(((current - previous) / previous) * 1000) / 10
  return { previous, delta }
}

/**
 * 분해(breakdown) — 지표를 차원별로 쪼갭니다.
 *
 * 분석도구의 핵심 동작입니다. "오류 412건"은 정보가 적지만
 * "인증 380 / 결제 28 / 수집 4"는 바로 행동으로 이어집니다.
 * 각 항목이 자기 질의를 들고 있어 그대로 드릴다운됩니다.
 */
export function breakdownMetric(metric, records, fields, dimensionKey) {
  const matched = applyQuery(records, metric.query, fields)
  const field = fields[dimensionKey]
  if (!field) return []

  const groups = groupRecords(matched, field) ?? []

  /* 분해는 지표와 **같은 집계**를 써야 합니다.
     '오류 총계'를 분해하면서 레코드 수를 세면, 합계와 조각이 맞지 않아
     사용자가 숫자를 신뢰하지 못하게 됩니다. */
  const total = aggregate(matched, metric) || 1

  return groups
    .filter((g) => g.records.length > 0)
    .map((g) => {
      const value = aggregate(g.records, metric)
      return {
      key: g.key,
      label: g.label,
      option: g.option,
      count: value,
      recordCount: g.records.length,
      share: Math.round((value / total) * 1000) / 10,
      /* 이 항목만 보는 질의 — 클릭 시 목록으로 그대로 넘깁니다 */
      query: {
        ...metric.query,
        conditions: [
          ...metric.query.conditions,
          { field: dimensionKey, operator: 'in', value: [g.key] },
        ],
      },
      }
    })
    .sort((a, b) => b.count - a.count)
}

/** 시계열 버킷 — 날짜 필드 기준으로 구간을 나눕니다 */
export function timeSeries(records, dateField, buckets = 12, spanMs = 12 * 3600 * 1000) {
  const now = Date.now()
  const size = spanMs / buckets
  const out = Array.from({ length: buckets }, (_, i) => ({
    start: now - spanMs + i * size,
    end: now - spanMs + (i + 1) * size,
    count: 0,
  }))
  for (const r of records) {
    const t = new Date(r[dateField]).getTime()
    if (Number.isNaN(t)) continue
    const idx = Math.floor((t - (now - spanMs)) / size)
    if (idx >= 0 && idx < buckets) out[idx].count += 1
  }
  return out
}
