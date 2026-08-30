/**
 * 필드 타입 시스템 — 이 디자인 시스템의 원자(atom).
 *
 * 노션의 데이터베이스 속성, 지라의 이슈 필드에 해당합니다.
 * 하나의 필드 정의로 다음이 모두 결정됩니다:
 *
 *   표시     → 표/보드/상세에서 어떻게 그려지는가
 *   편집     → 클릭했을 때 어떤 에디터가 뜨는가
 *   필터     → 어떤 연산자를 쓸 수 있는가
 *   정렬     → 어떻게 비교하는가
 *   그룹핑   → 그룹으로 묶을 수 있는가
 *
 * 이 구조가 있어야 "같은 데이터를 표로도 보드로도 본다"가 가능합니다.
 * 화면마다 컬럼을 따로 정의하면 뷰 전환이 성립하지 않습니다.
 *
 * 개발 에이전트 사용 규칙:
 *   - 데이터를 화면에 뿌리기 전에 먼저 필드 스키마를 정의하세요.
 *   - 컬럼 정의를 화면에 하드코딩하지 마세요. 스키마에서 파생시킵니다.
 *   - 새 타입이 필요하면 여기에 추가합니다. 화면에서 특수 처리하지 마세요.
 */

/** @typedef {'text'|'longtext'|'number'|'select'|'tags'|'user'|'date'|'checkbox'|'link'} FieldType */

/**
 * @typedef {object} Field
 * @property {string} key
 * @property {string} label
 * @property {FieldType} type
 * @property {boolean} [editable]     - 인라인 편집 허용 (기본 true)
 * @property {boolean} [groupable]    - 그룹핑 가능 (select/user/checkbox 기본 true)
 * @property {string} [width]         - 표 뷰 열 너비
 * @property {Array<{value: string, label: string, status?: string}>} [options] - select/tags 용
 * @property {string} [unit]          - number 용
 * @property {string} [description]
 */

/* ─────────────────────────────────────────────────────────────
   연산자 — 필드 타입마다 쓸 수 있는 것이 다릅니다
   ───────────────────────────────────────────────────────────── */

export const OPERATORS = {
  eq:          { label: '=',        symbol: '=',  arity: 1 },
  neq:         { label: '≠',        symbol: '!=', arity: 1 },
  contains:    { label: '포함',      symbol: '~',  arity: 1 },
  notContains: { label: '포함 안 함', symbol: '!~', arity: 1 },
  in:          { label: '다음 중 하나', symbol: 'in', arity: 'many' },
  notIn:       { label: '다음이 아님',  symbol: 'not in', arity: 'many' },
  gt:          { label: '>',        symbol: '>',  arity: 1 },
  gte:         { label: '≥',        symbol: '>=', arity: 1 },
  lt:          { label: '<',        symbol: '<',  arity: 1 },
  lte:         { label: '≤',        symbol: '<=', arity: 1 },
  before:      { label: '이전',      symbol: '<',  arity: 1 },
  after:       { label: '이후',      symbol: '>',  arity: 1 },
  isEmpty:     { label: '비어 있음',  symbol: 'is empty',     arity: 0 },
  isNotEmpty:  { label: '값 있음',    symbol: 'is not empty', arity: 0 },
  isTrue:      { label: '예',        symbol: '= true',  arity: 0 },
  isFalse:     { label: '아니오',     symbol: '= false', arity: 0 },
}

/** 타입별 사용 가능 연산자 (첫 번째가 기본값) */
export const TYPE_OPERATORS = {
  text:     ['contains', 'eq', 'neq', 'notContains', 'isEmpty', 'isNotEmpty'],
  longtext: ['contains', 'notContains', 'isEmpty', 'isNotEmpty'],
  number:   ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'],
  select:   ['in', 'notIn', 'eq', 'neq', 'isEmpty', 'isNotEmpty'],
  tags:     ['in', 'notIn', 'isEmpty', 'isNotEmpty'],
  user:     ['in', 'notIn', 'eq', 'neq', 'isEmpty', 'isNotEmpty'],
  date:     ['after', 'before', 'eq', 'isEmpty', 'isNotEmpty'],
  checkbox: ['isTrue', 'isFalse'],
  link:     ['contains', 'isEmpty', 'isNotEmpty'],
}

/** 타입별 기본 속성 */
export const TYPE_DEFAULTS = {
  text:     { groupable: false, sortable: true,  align: 'left'  },
  longtext: { groupable: false, sortable: false, align: 'left'  },
  number:   { groupable: false, sortable: true,  align: 'right' },
  select:   { groupable: true,  sortable: true,  align: 'left'  },
  tags:     { groupable: false, sortable: false, align: 'left'  },
  user:     { groupable: true,  sortable: true,  align: 'left'  },
  date:     { groupable: false, sortable: true,  align: 'right' },
  checkbox: { groupable: true,  sortable: true,  align: 'center'},
  link:     { groupable: false, sortable: false, align: 'left'  },
}

/**
 * 필드 정의를 기본값으로 채웁니다.
 * @param {Field} field
 */
export function normalizeField(field) {
  const defaults = TYPE_DEFAULTS[field.type] ?? TYPE_DEFAULTS.text
  return {
    editable: true,
    /* 이 필드 없이는 레코드가 성립하지 않는가. 만들기 폼과 가져오기
       검증이 함께 봅니다 — 두 곳이 따로 정하면 규칙이 갈라집니다. */
    required: false,
    ...defaults,
    ...field,
    operators: TYPE_OPERATORS[field.type] ?? TYPE_OPERATORS.text,
  }
}

/** @param {Field[]} fields */
export function normalizeFields(fields) {
  return fields.map(normalizeField)
}

/** 스키마를 key → field 맵으로 */
export function fieldMap(fields) {
  return Object.fromEntries(fields.map((f) => [f.key, f]))
}

/* ─────────────────────────────────────────────────────────────
   값 처리 — 정렬·그룹핑·필터가 공통으로 씁니다
   ───────────────────────────────────────────────────────────── */

/** 정렬·비교를 위한 원시값 */
export function comparableValue(field, value) {
  if (value == null) return null
  switch (field.type) {
    case 'number':
      return typeof value === 'number' ? value : Number(value)
    case 'date':
      return value instanceof Date ? value.getTime() : new Date(value).getTime()
    case 'checkbox':
      return value ? 1 : 0
    case 'select': {
      /* 선택지 정의 순서대로 정렬합니다. 알파벳순은 '대기 < 완료 < 진행중'
         같은 무의미한 순서를 만듭니다. */
      const idx = field.options?.findIndex((o) => o.value === value)
      return idx == null || idx < 0 ? Number.MAX_SAFE_INTEGER : idx
    }
    case 'user':
      return typeof value === 'object' ? (value.name ?? '') : String(value)
    default:
      return String(value).toLowerCase()
  }
}

/** 그룹핑 키 (그룹 헤더 라벨 포함) */
export function groupKeyOf(field, value) {
  if (value == null || value === '') return { key: '__empty__', label: '없음', option: null }
  switch (field.type) {
    case 'select': {
      const option = field.options?.find((o) => o.value === value)
      return { key: String(value), label: option?.label ?? String(value), option }
    }
    case 'user': {
      const name = typeof value === 'object' ? value.name : value
      return { key: String(name), label: String(name), option: null }
    }
    case 'checkbox':
      return { key: value ? 'true' : 'false', label: value ? '예' : '아니오', option: null }
    default:
      return { key: String(value), label: String(value), option: null }
  }
}

/** 검색창(전문 검색)이 훑을 텍스트 */
export function searchableText(field, value) {
  if (value == null) return ''
  switch (field.type) {
    case 'select': {
      const option = field.options?.find((o) => o.value === value)
      return option?.label ?? String(value)
    }
    case 'tags':
      return Array.isArray(value) ? value.join(' ') : String(value)
    case 'user':
      return typeof value === 'object' ? (value.name ?? '') : String(value)
    case 'checkbox':
      return value ? '예' : '아니오'
    default:
      return String(value)
  }
}

/** 빈 값 판정 */
export function isEmptyValue(value) {
  if (value == null || value === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

/** 사람이 읽는 표시 문자열 (내보내기·툴팁·질의 텍스트에 사용) */
export function formatValue(field, value) {
  if (isEmptyValue(value)) return ''
  switch (field.type) {
    case 'number':
      return typeof value === 'number'
        ? value.toLocaleString('ko-KR') + (field.unit ? ` ${field.unit}` : '')
        : String(value)
    case 'select':
      return field.options?.find((o) => o.value === value)?.label ?? String(value)
    case 'tags':
      return Array.isArray(value) ? value.join(', ') : String(value)
    case 'user':
      return typeof value === 'object' ? (value.name ?? '') : String(value)
    case 'checkbox':
      return value ? '예' : '아니오'
    case 'date':
      return formatDate(value)
    default:
      return String(value)
  }
}

/** 상대 시간 — 관리도구는 절대 시각보다 '몇 분 전'이 유용한 경우가 많습니다 */
export function formatRelative(value, now = Date.now()) {
  /*
   * 빈 값을 먼저 걸러냅니다. NaN 검사만으로는 부족합니다 —
   * `new Date(null)` 은 NaN 이 아니라 **에포크(1970-01-01)** 입니다.
   * 그래서 값이 없는 날짜가 "1970.01.01" 로 표시됐습니다. 한 번도 성공한
   * 적 없는 작업의 "마지막 성공" 이 1970년으로 나오는 식입니다.
   */
  if (isEmptyValue(value)) return ''
  const t = value instanceof Date ? value.getTime() : new Date(value).getTime()
  if (Number.isNaN(t)) return ''

  /*
   * 과거와 미래를 모두 다룹니다.
   *
   * 과거만 가정하면 미래 날짜가 전부 "방금"으로 나옵니다. 관리도구에는
   * 만료일·기한·다음 실행처럼 **미래를 가리키는 날짜가 흔합니다** —
   * 교정 만료가 9일 남았는데 "방금"이라고 쓰면 당장 만료된 것처럼 읽힙니다.
   * (실제로 장비 모니터링 화면을 만들다 발견했습니다.)
   */
  const diff = Math.floor((now - t) / 1000)
  const abs = Math.abs(diff)
  const suffix = diff < 0 ? '후' : '전'

  if (abs < 60) return '방금'
  if (abs < 3600) return `${Math.floor(abs / 60)}분 ${suffix}`
  if (abs < 86400) return `${Math.floor(abs / 3600)}시간 ${suffix}`
  if (abs < 604800) return `${Math.floor(abs / 86400)}일 ${suffix}`
  /* 일주일을 넘어가면 상대 시간은 감이 안 옵니다. 날짜를 그대로 보여줍니다. */
  return formatDate(value)
}

export function formatDate(value) {
  /* new Date(null) === 에포크. formatRelative 와 같은 이유로 먼저 걸러냅니다. */
  if (isEmptyValue(value)) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
