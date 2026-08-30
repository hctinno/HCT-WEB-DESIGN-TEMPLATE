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
 *     색이 8개를 넘으면 사람이 범례를 못 외웁니다. 접는 일은 foldSeries 가 합니다 —
 *     안 접고 넘기면 콘솔이 시끄럽게 알려줍니다.
 *   - **색은 항목에 붙습니다. 순위가 아니라.** 필터로 계열이 사라져도 남은
 *     항목의 색이 바뀌면 안 됩니다. 그래서 인덱스가 아니라 key 로 배정합니다.
 *   - **색만으로 계열을 구분하지 마세요.** 아래 CHART_SERIES 는 명도를 맞추고
 *     색상만 바꾼 팔레트입니다. 순위처럼 보이지 않게 하려는 의도적인 선택인데,
 *     대신 명도로는 서로 구별되지 않습니다(15쌍 전부 3:1 미만). 실제로 재봤습니다.
 *     그래서 선에는 SERIES_DASH 를 **반드시 함께** 씁니다. 이게 없으면 흑백 인쇄와
 *     색각 이상에서 여섯 계열이 한 덩어리가 됩니다.
 *   - 텍스트에 계열 색을 쓰지 마세요. 값·라벨·범례 글자는 항상 텍스트 토큰입니다.
 */

export const CHART_SERIES = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)',
]

export const MAX_SERIES = CHART_SERIES.length

/**
 * 선의 파선 패턴 — 계열 색과 **같은 순서**로 짝지어져 있습니다.
 *
 * 색을 못 보거나(색각 이상), 색이 사라지는 자리(흑백 인쇄, 저품질 프로젝터)에서
 * 계열을 구별하는 두 번째 단서입니다. Carbon 이 말하는 '질감 채널' 입니다.
 *
 * 서로 헷갈리지 않도록 길이 비율을 크게 벌렸습니다. 실선 → 긴 파선 → 점 →
 * 일점쇄선 → 중간 파선 → 아주 긴 파선.
 */
export const SERIES_DASH = ['', '8 4', '2 3', '12 4 2 4', '4 4', '18 5']

/** 접힌 '기타' 묶음이 쓰는 key. 이 key 는 항상 중립색 + 성긴 점선입니다. */
export const OTHER_KEY = '__other__'
const OTHER_COLOR = 'var(--color-neutral-solid)'
const OTHER_DASH = '1 5'

/**
 * key 목록에 색을 고정 배정합니다.
 * 같은 key 는 어느 차트에서든 같은 색을 받습니다.
 *
 * MAX_SERIES 를 넘겨도 조용히 뭉개지 않습니다. 예전에는 넘치는 계열을 **전부
 * 같은 회색**으로 칠했는데, 그러면 범례에는 세 항목이 따로 있으면서 차트에는
 * 똑같은 회색 선 세 개가 겹쳐 있게 됩니다. 사용자는 어느 선이 무엇인지 알
 * 방법이 없습니다. 이제 콘솔에 무엇을 해야 하는지 적습니다.
 *
 * @param {string[]} keys
 * @returns {Record<string, string>}
 */
export function assignSeriesColors(keys = []) {
  const map = {}
  keys.slice(0, MAX_SERIES).forEach((key, i) => { map[key] = CHART_SERIES[i] })

  const overflow = keys.slice(MAX_SERIES)
  if (overflow.length > 0) {
    warnOnce(
      `계열이 ${keys.length}개입니다. 색은 ${MAX_SERIES}개까지만 있습니다. ` +
      `foldSeries() 로 먼저 접으세요 — 안 접으면 ${overflow.length}개가 같은 회색이 되어 서로 구별되지 않습니다.`,
    )
    overflow.forEach((key) => { map[key] = OTHER_COLOR })
  }
  map[OTHER_KEY] = OTHER_COLOR
  return map
}

/**
 * key 목록에 파선 패턴을 배정합니다. assignSeriesColors 와 짝입니다.
 *
 * @param {string[]} keys
 * @returns {Record<string, string>}
 */
export function assignSeriesDash(keys = []) {
  const map = {}
  keys.slice(0, MAX_SERIES).forEach((key, i) => { map[key] = SERIES_DASH[i] })
  keys.slice(MAX_SERIES).forEach((key) => { map[key] = OTHER_DASH })
  map[OTHER_KEY] = OTHER_DASH
  return map
}

/**
 * 계열이 색보다 많으면 상위 N개만 남기고 나머지를 '기타' 하나로 접습니다.
 *
 * 접는 것과 잘라내는 것은 다릅니다. **합계가 유지되어야** 합니다 — 조각을
 * 다 더했는데 총계와 다르면 사용자는 숫자를 믿지 않게 됩니다. 그래서
 * 버리지 않고 하나로 합칩니다.
 *
 * 이 시스템이 만드는 항목은 `{ key, label, count, share }` 형태입니다
 * (breakdownMetric 의 출력). getValue 로 다른 형태도 받을 수 있습니다.
 *
 * **접을 때 큰 값 순으로 재정렬합니다.** 무엇을 남길지 정하려면 크기를 봐야
 * 하기 때문입니다. 상태처럼 순서 자체에 뜻이 있는 목록(대기→진행중→완료)을
 * 넘길 거라면 limit 안에 들어오는지 확인하세요 — limit 이하면 원래 순서
 * 그대로 돌려줍니다.
 *
 * @param {object[]} items
 * 옵션 이름이 `getValue` 인 이유: `valueOf` 로 두면 **기본값이 절대 적용되지
 * 않습니다.** `{ limit }` 같은 객체에서 `valueOf` 를 구조분해하면 없는 게
 * 아니라 `Object.prototype.valueOf` 가 딸려 와서 `??` 가 건너뜁니다. 실제로
 * 그렇게 짰다가 담당자별 분해에서 화면이 죽었습니다. 구조분해하는 이름은
 * `Object.prototype` 을 피하세요.
 *
 * @param {object} [options]
 * @param {number} [options.limit]    - '기타' 를 포함한 최종 개수
 * @param {(item: object) => number} [options.getValue]
 * @returns {object[]}
 */
export function foldSeries(items = [], { limit = MAX_SERIES, getValue } = {}) {
  const read = getValue ?? ((i) => i.count ?? i.value ?? 0)
  if (items.length <= limit) return items

  const sorted = [...items].sort((a, b) => read(b) - read(a))
  const head = sorted.slice(0, limit - 1)
  const rest = sorted.slice(limit - 1)

  const sum = (pick) => rest.reduce((acc, r) => acc + (pick(r) ?? 0), 0)
  const folded = {
    key: OTHER_KEY,
    label: `기타 ${rest.length}개`,
    count: sum((r) => r.count),
    folded: rest,
  }
  /* share 를 쓰는 항목이면 조각 합도 그대로 유지합니다 */
  if (rest.some((r) => r.share != null)) folded.share = Math.round(sum((r) => r.share) * 10) / 10
  if (rest.some((r) => r.value != null)) folded.value = sum((r) => r.value)

  return [...head, folded]
}

/**
 * 순차형 단계 — "얼마나" 를 진하기로 보여줍니다.
 *
 * 배경색과 그 위의 글자색이 **짝으로** 묶여 있습니다. 마지막 단계에서만
 * 글자가 뒤집히는데, 그 규칙을 화면마다 다시 쓰면 반드시 어긋납니다.
 */
export const CHART_SEQ = [
  { bg: 'var(--chart-seq-1)', fg: 'var(--chart-seq-fg)' },
  { bg: 'var(--chart-seq-2)', fg: 'var(--chart-seq-fg)' },
  { bg: 'var(--chart-seq-3)', fg: 'var(--chart-seq-fg)' },
  { bg: 'var(--chart-seq-4)', fg: 'var(--chart-seq-fg)' },
  { bg: 'var(--chart-seq-5)', fg: 'var(--chart-seq-fg-strong)' },
]

/**
 * 값을 순차형 단계로 바꿉니다. 0 은 색을 칠하지 않습니다 — 빈 칸과 '적은 값'은
 * 다른 뜻이고, 옅은 색을 칠하면 둘이 같아 보입니다.
 *
 * @param {number} value
 * @param {number} peak - 이 격자에서 가장 큰 값
 * @returns {{bg: string, fg: string}|null}
 */
export function seqStep(value, peak) {
  if (!(value > 0) || !(peak > 0)) return null
  const i = Math.min(CHART_SEQ.length - 1, Math.ceil((value / peak) * CHART_SEQ.length) - 1)
  return CHART_SEQ[Math.max(0, i)]
}

const warned = new Set()
function warnOnce(message) {
  if (warned.has(message)) return
  warned.add(message)
  console.warn(`[hct/chart] ${message}`)
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
