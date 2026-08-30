/**
 * 가져오기 — 열 연결 추측과 행 검증.
 *
 * 여기서 하는 검증은 **필드 스키마(fields.js)에서 그대로 나옵니다.**
 * 가져오기 화면이 자기만의 규칙을 새로 쓰면, 표에서는 허용되는 값이
 * 가져오기에서는 거부되는(혹은 반대) 일이 생깁니다. 스키마가 하나면
 * 그런 어긋남이 구조적으로 불가능합니다.
 */

/** 비교용으로 머리글을 정규화 — 공백·기호·대소문자를 무시합니다 */
function normalize(s) {
  return String(s ?? '').toLowerCase().replace(/[\s_\-()[\]]/g, '')
}

/**
 * CSV 머리글을 필드에 자동 연결합니다.
 *
 * 완벽하게 맞히려 하지 않습니다. 확실할 때만 연결하고 나머지는 비워
 * 사용자가 고르게 둡니다. **틀린 자동 연결은 빈 칸보다 나쁩니다** —
 * 사용자는 이미 채워진 값을 다시 읽지 않습니다.
 */
export function guessMapping(headers, fields) {
  const mapping = {}
  const used = new Set()

  for (const [i, header] of headers.entries()) {
    const h = normalize(header)
    if (!h) continue

    const hit = fields.find((f) => {
      if (used.has(f.key)) return false
      return normalize(f.label) === h || normalize(f.key) === h
    })
    if (hit) {
      mapping[String(i)] = hit.key
      used.add(hit.key)
    }
  }
  return mapping
}

/**
 * 값 하나를 필드 타입에 맞춰 변환하고 검증합니다.
 *
 * @returns {{value: any} | {error: string}}
 */
function coerce(field, raw) {
  const text = String(raw ?? '').trim()

  if (text === '') {
    if (field.required) return { error: `${field.label} 이(가) 비어 있습니다` }
    return { value: null }
  }

  if (field.type === 'number') {
    /* 엑셀이 넣는 천 단위 쉼표를 받아줍니다 — 사람이 만든 파일의 현실입니다 */
    const n = Number(text.replace(/,/g, ''))
    if (Number.isNaN(n)) return { error: `${field.label}: 숫자가 아닙니다 ("${text}")` }
    return { value: n }
  }

  if (field.type === 'date') {
    const d = new Date(text)
    if (Number.isNaN(d.getTime())) {
      return { error: `${field.label}: 날짜를 읽을 수 없습니다 ("${text}"). YYYY-MM-DD 형식을 씁니다` }
    }
    return { value: d.toISOString() }
  }

  if (field.type === 'select' || field.type === 'user') {
    const options = field.options ?? []
    const hit = options.find(
      (o) => normalize(o.value) === normalize(text) || normalize(o.label) === normalize(text),
    )
    if (!hit) {
      /* 허용되는 값을 함께 알려줍니다. "잘못된 값입니다" 만으로는 고칠 수 없습니다 */
      const allowed = options.map((o) => o.label).join(', ')
      return { error: `${field.label}: "${text}" 은(는) 없는 값입니다. 가능한 값: ${allowed}` }
    }
    return { value: hit.value }
  }

  return { value: text }
}

/**
 * 행 전체를 검증합니다.
 *
 * 실행 전에 **전부** 검증합니다. 넣다가 실패하면 절반만 들어간 상태로
 * 멈추고, 그 상태를 정리하는 것은 사용자 몫이 됩니다.
 *
 * @returns {{rows: object[], summary: {total, ok, failed, missingRequired: string[]}}}
 */
export function validateRows({ headers, rows, mapping, fields, existingIds = [] }) {
  const fieldByKey = Object.fromEntries(fields.map((f) => [f.key, f]))
  const mapped = Object.entries(mapping).filter(([, key]) => key)

  /* 연결되지 않은 필수 필드 — 행을 보기 전에 걸러야 하는 문제입니다 */
  const mappedKeys = new Set(mapped.map(([, key]) => key))
  const missingRequired = fields
    .filter((f) => f.required && !mappedKeys.has(f.key))
    .map((f) => f.label)

  /* 한 필드에 두 열을 연결하면 어느 쪽이 이기는지 알 수 없습니다 */
  const counts = {}
  for (const [, key] of mapped) counts[key] = (counts[key] ?? 0) + 1
  const duplicated = Object.entries(counts)
    .filter(([, n]) => n > 1)
    .map(([key]) => fieldByKey[key]?.label ?? key)

  const known = new Set(existingIds)
  const seen = new Set()

  const checked = rows.map((row) => {
    const errors = []
    const values = {}

    if (row.ragged) {
      errors.push(`열 개수가 머리글(${headers.length}개)과 다릅니다 (${row.cells.length}개)`)
    }

    for (const [index, key] of mapped) {
      const field = fieldByKey[key]
      if (!field) continue
      const result = coerce(field, row.cells[Number(index)])
      if (result.error) errors.push(result.error)
      else values[key] = result.value
    }

    /* 파일 안에서의 중복은 파일 자체의 문제이므로 따로 말해줍니다 */
    const id = values.id
    if (id) {
      if (seen.has(id)) errors.push(`같은 파일 안에 ${id} 이(가) 두 번 있습니다`)
      seen.add(id)
    }

    return {
      line: row.line,
      values,
      errors,
      /* 이미 있는 항목 — 오류가 아니라 정책(건너뛰기/덮어쓰기)의 대상입니다 */
      duplicate: Boolean(id) && known.has(id),
    }
  })

  return {
    rows: checked,
    summary: {
      total: checked.length,
      ok: checked.filter((r) => r.errors.length === 0).length,
      failed: checked.filter((r) => r.errors.length > 0).length,
      duplicates: checked.filter((r) => r.duplicate && r.errors.length === 0).length,
      missingRequired,
      duplicated,
    },
  }
}

/** 오류 행만 CSV 로 — 사용자가 고쳐서 다시 올릴 수 있게 합니다 */
export function errorReportCsv(headers, rows, checked) {
  const byLine = new Map(checked.map((r) => [r.line, r]))
  const out = [['줄번호', '오류', ...headers]]
  for (const row of rows) {
    const c = byLine.get(row.line)
    if (!c || c.errors.length === 0) continue
    out.push([String(row.line), c.errors.join(' / '), ...row.cells])
  }
  return out
    .map((cells) => cells.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}
