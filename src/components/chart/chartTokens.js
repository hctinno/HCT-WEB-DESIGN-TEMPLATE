/**
 * 차트 색 배정 규칙.
 *
 * 두 가지 색 체계를 구분합니다:
 *
 *   상태 색   무엇인가의 **상태**를 그릴 때 (완료/진행중/차단됨)
 *             → StatusBadge 와 같은 색을 씁니다. 표와 차트가 어긋나면 안 됩니다.
 *   계열 색   임의 **차원**을 그릴 때 (시스템별, 담당자별)
 *             → 아래 CHART_SERIES 를 고정 순서로 배정합니다.
 *
 * 규칙:
 *   - **순환시키지 마세요.** 7번째 계열은 새 색을 만드는 게 아니라 '기타'로 묶습니다.
 *     색이 8개를 넘으면 사람이 범례를 못 외웁니다.
 *   - **색은 항목에 붙습니다. 순위가 아니라.** 필터로 계열이 사라져도 남은
 *     항목의 색이 바뀌면 안 됩니다. 그래서 인덱스가 아니라 key 로 배정합니다.
 *   - 텍스트에 계열 색을 쓰지 마세요. 값·라벨·범례 글자는 항상 텍스트 토큰입니다.
 */

export const CHART_SERIES = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)',
]

export const MAX_SERIES = CHART_SERIES.length

/**
 * key 목록에 색을 고정 배정합니다.
 * 같은 key 는 어느 차트에서든 같은 색을 받습니다.
 *
 * @param {string[]} keys
 * @returns {Record<string, string>}
 */
export function assignSeriesColors(keys = []) {
  const map = {}
  keys.slice(0, MAX_SERIES).forEach((key, i) => { map[key] = CHART_SERIES[i] })
  /* 넘치는 계열은 중립색으로 — 새 색을 만들지 않습니다 */
  keys.slice(MAX_SERIES).forEach((key) => { map[key] = 'var(--color-neutral-solid)' })
  return map
}

/**
 * 계열이 너무 많으면 상위 N개만 두고 나머지를 '기타'로 접습니다.
 * @param {{key: string, value: number}[]} items
 * @param {number} [limit]
 */
export function foldToOther(items = [], limit = MAX_SERIES) {
  if (items.length <= limit) return items
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const head = sorted.slice(0, limit - 1)
  const rest = sorted.slice(limit - 1)
  return [...head, {
    key: '__other__',
    label: `기타 ${rest.length}개`,
    value: rest.reduce((sum, r) => sum + r.value, 0),
  }]
}

/** 상태 필드를 그릴 때 쓰는 색 — StatusBadge 와 동일해야 합니다 */
export const STATUS_CHART_COLOR = {
  todo: 'var(--color-neutral-solid)',
  inProgress: 'var(--color-info-solid)',
  inReview: 'var(--color-review-solid)',
  blocked: 'var(--color-danger-solid)',
  done: 'var(--color-success-solid)',
  failed: 'var(--color-danger-solid)',
  warning: 'var(--color-warning-solid)',
}

/**
 * Y축 라벨이 들어갈 왼쪽 여백을 라벨 길이에서 구합니다.
 *
 * 고정 44px 로 두면 "200천회" 처럼 긴 라벨이 왼쪽으로 잘려 나갑니다.
 * SVG 는 넘친 글자를 지워버리므로 화면에는 "00천회" 만 남고, 차트가
 * 조용히 거짓말을 하게 됩니다. 축 라벨은 잘리면 안 되는 값입니다.
 *
 * 실제 글자 폭을 재려면 렌더 후 측정이 필요하지만, 축 라벨은 숫자와
 * 짧은 단위뿐이라 문자 종류로 어림해도 충분합니다(한글·전각은 넓게).
 */
export function axisPadLeft(labels, { min = 44, gutter = 12 } = {}) {
  const width = (text) => {
    let w = 0
    for (const ch of String(text)) w += /[\u3000-\u9fff\uac00-\ud7af]/.test(ch) ? 11 : 6.2
    return w
  }
  const widest = labels.reduce((m, l) => Math.max(m, width(l)), 0)
  return Math.max(min, Math.ceil(widest) + gutter)
}
