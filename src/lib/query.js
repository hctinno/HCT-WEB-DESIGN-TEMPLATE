/**
 * 질의(Query) 모델 — 지라 JQL, 노션 필터 빌더에 해당합니다.
 *
 * 왜 필요한가:
 *   필터를 컴포넌트 state 로만 들고 있으면 저장할 수도, 공유할 수도, URL 에
 *   담을 수도 없습니다. 지라에서 필터가 강력한 이유는 그것이 **저장 가능한
 *   객체**이기 때문입니다. 저장된 질의가 곧 내비게이션이 됩니다.
 *
 * 질의 구조:
 *   {
 *     search: '결제',                                  // 전문 검색
 *     match: 'all' | 'any',                            // 조건 결합 방식
 *     conditions: [ { field, operator, value } ],
 *     sort: [ { field, direction } ],
 *     groupBy: 'status' | null,
 *   }
 *
 * 개발 에이전트 사용 규칙:
 *   - 필터를 개별 useState 로 흩어놓지 마세요. 질의 객체 하나로 관리합니다.
 *   - 그래야 저장·복원·URL 동기화·뷰 전환이 전부 공짜로 따라옵니다.
 */

import { comparableValue, isEmptyValue, searchableText, formatValue, OPERATORS } from './fields'

/** 빈 질의 */
export function emptyQuery() {
  return { search: '', match: 'all', conditions: [], sort: [], groupBy: null }
}

/** 질의에 걸린 조건이 하나라도 있는가 (필터 초기화 버튼 노출 판단) */
export function isQueryActive(query) {
  return Boolean(query.search) || query.conditions.length > 0
}

/* ─────────────────────────────────────────────────────────────
   조건 평가
   ───────────────────────────────────────────────────────────── */

function evaluateCondition(condition, record, fields) {
  const field = fields[condition.field]
  if (!field) return true

  const raw = record[condition.field]
  const { operator, value } = condition

  switch (operator) {
    case 'isEmpty':    return isEmptyValue(raw)
    case 'isNotEmpty': return !isEmptyValue(raw)
    case 'isTrue':     return Boolean(raw)
    case 'isFalse':    return !raw
    default: break
  }

  if (isEmptyValue(value)) return true /* 값이 안 정해진 조건은 무시 */

  const a = comparableValue(field, raw)
  const b = comparableValue(field, value)

  switch (operator) {
    case 'eq':  return a === b
    case 'neq': return a !== b
    case 'gt':  return a != null && a > b
    case 'gte': return a != null && a >= b
    case 'lt':  return a != null && a < b
    case 'lte': return a != null && a <= b
    case 'after':  return a != null && a > b
    case 'before': return a != null && a < b
    case 'contains':
      return searchableText(field, raw).toLowerCase().includes(String(value).toLowerCase())
    case 'notContains':
      return !searchableText(field, raw).toLowerCase().includes(String(value).toLowerCase())
    case 'in': {
      const list = Array.isArray(value) ? value : [value]
      if (field.type === 'tags') {
        const own = Array.isArray(raw) ? raw : []
        return list.some((v) => own.includes(v))
      }
      return list.includes(raw)
    }
    case 'notIn': {
      const list = Array.isArray(value) ? value : [value]
      if (field.type === 'tags') {
        const own = Array.isArray(raw) ? raw : []
        return !list.some((v) => own.includes(v))
      }
      return !list.includes(raw)
    }
    default:
      return true
  }
}

/**
 * 질의를 레코드 배열에 적용합니다. 필터 → 정렬 순서로 처리합니다.
 *
 * @param {any[]} records
 * @param {object} query
 * @param {Record<string, any>} fields - fieldMap() 결과
 */
export function applyQuery(records, query, fields) {
  const fieldList = Object.values(fields)
  let out = records

  /* 전문 검색 — 모든 필드의 표시 텍스트를 훑습니다 */
  if (query.search) {
    const q = query.search.toLowerCase()
    out = out.filter((r) =>
      fieldList.some((f) => searchableText(f, r[f.key]).toLowerCase().includes(q)),
    )
  }

  /* 조건 */
  if (query.conditions.length > 0) {
    out = out.filter((r) => {
      const results = query.conditions.map((c) => evaluateCondition(c, r, fields))
      return query.match === 'any' ? results.some(Boolean) : results.every(Boolean)
    })
  }

  /* 정렬 — 다중 정렬 지원 */
  if (query.sort.length > 0) {
    out = [...out].sort((x, y) => {
      for (const { field: key, direction } of query.sort) {
        const f = fields[key]
        if (!f) continue
        const a = comparableValue(f, x[key])
        const b = comparableValue(f, y[key])
        if (a === b) continue
        /* 빈 값은 방향과 무관하게 항상 뒤로 — 목록 맨 위에 빈 행이 오면 쓸모없습니다 */
        if (a == null) return 1
        if (b == null) return -1
        return (a < b ? -1 : 1) * (direction === 'desc' ? -1 : 1)
      }
      return 0
    })
  }

  return out
}

/** 정렬 토글: 없음 → 오름차순 → 내림차순 → 없음 */
export function toggleSort(query, fieldKey) {
  const current = query.sort.find((s) => s.field === fieldKey)
  if (!current) return { ...query, sort: [{ field: fieldKey, direction: 'asc' }] }
  if (current.direction === 'asc') return { ...query, sort: [{ field: fieldKey, direction: 'desc' }] }
  return { ...query, sort: [] }
}

/* ─────────────────────────────────────────────────────────────
   그룹핑
   ───────────────────────────────────────────────────────────── */

/**
 * 레코드를 그룹으로 묶습니다.
 * select 필드로 그룹핑하면 **값이 없는 그룹도 표시**합니다.
 * 지라 보드에서 빈 컬럼이 사라지면 그리로 끌어다 놓을 수 없기 때문입니다.
 */
export function groupRecords(records, field) {
  if (!field) return null

  const buckets = new Map()

  /* select 는 선택지 전체를 미리 만들어 둡니다 (빈 그룹 유지) */
  if (field.type === 'select' && field.options) {
    for (const o of field.options) {
      buckets.set(o.value, { key: o.value, label: o.label, option: o, records: [] })
    }
  }

  for (const r of records) {
    const value = r[field.key]
    const key = isEmptyValue(value) ? '__empty__' : String(value)
    if (!buckets.has(key)) {
      const option = field.options?.find((o) => String(o.value) === key)
      buckets.set(key, {
        key,
        label: key === '__empty__' ? '없음' : (option?.label ?? key),
        option: option ?? null,
        records: [],
      })
    }
    buckets.get(key).records.push(r)
  }

  return [...buckets.values()]
}

/* ─────────────────────────────────────────────────────────────
   텍스트 직렬화 — 질의를 읽고 쓸 수 있게 만듭니다
   지라 JQL 처럼 숙련 사용자가 직접 타이핑할 수 있어야 합니다.
   ───────────────────────────────────────────────────────────── */

/** 질의 → 사람이 읽는 문자열. 예: status in (진행중, 차단됨) AND 담당자 = 김민수 */
export function queryToText(query, fields) {
  const parts = []
  if (query.search) parts.push(`검색 ~ "${query.search}"`)

  for (const c of query.conditions) {
    const field = fields[c.field]
    if (!field) continue
    const op = OPERATORS[c.operator]
    if (!op) continue

    if (op.arity === 0) {
      parts.push(`${field.label} ${op.symbol}`)
    } else if (op.arity === 'many') {
      const list = (Array.isArray(c.value) ? c.value : [c.value])
        .map((v) => formatValue(field, v))
        .filter(Boolean)
      if (list.length === 0) continue
      parts.push(`${field.label} ${op.symbol} (${list.join(', ')})`)
    } else {
      const v = formatValue(field, c.value)
      if (!v) continue
      parts.push(`${field.label} ${op.symbol} ${/\s/.test(v) ? `"${v}"` : v}`)
    }
  }

  const joined = parts.join(query.match === 'any' ? ' OR ' : ' AND ')
  const tail = []
  if (query.sort.length > 0) {
    tail.push('정렬: ' + query.sort
      .map((s) => `${fields[s.field]?.label ?? s.field} ${s.direction === 'desc' ? '↓' : '↑'}`)
      .join(', '))
  }
  if (query.groupBy) tail.push(`그룹: ${fields[query.groupBy]?.label ?? query.groupBy}`)

  return [joined, ...tail].filter(Boolean).join('  ·  ')
}

/** 활성 조건을 태그로 보여주기 위한 요약 목록 */
export function activeFilterChips(query, fields) {
  const chips = []
  if (query.search) {
    chips.push({ id: '__search__', label: '검색', value: query.search })
  }
  query.conditions.forEach((c, i) => {
    const field = fields[c.field]
    if (!field) return
    const op = OPERATORS[c.operator]
    let value
    if (op?.arity === 0) value = op.label
    else if (op?.arity === 'many') {
      const list = (Array.isArray(c.value) ? c.value : [c.value]).filter((v) => !isEmptyValue(v))
      if (list.length === 0) return
      value = list.length > 2
        ? `${formatValue(field, list[0])} 외 ${list.length - 1}`
        : list.map((v) => formatValue(field, v)).join(', ')
    } else {
      if (isEmptyValue(c.value)) return
      value = formatValue(field, c.value)
    }
    chips.push({ id: String(i), index: i, label: field.label, value })
  })
  return chips
}

/** 조건 조작 헬퍼 — 불변 갱신 */
export function addCondition(query, field) {
  const operator = field.operators?.[0] ?? 'eq'
  const value = OPERATORS[operator]?.arity === 'many' ? [] : ''
  return { ...query, conditions: [...query.conditions, { field: field.key, operator, value }] }
}

export function updateCondition(query, index, patch) {
  const conditions = query.conditions.map((c, i) => (i === index ? { ...c, ...patch } : c))
  return { ...query, conditions }
}

export function removeCondition(query, index) {
  return { ...query, conditions: query.conditions.filter((_, i) => i !== index) }
}
