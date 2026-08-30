import { useCallback, useEffect, useRef } from 'react'
import { emptyQuery } from './query.js'

/**
 * 질의 ↔ URL 직렬화.
 *
 * 팀 도구에서 이게 없으면 "이 화면 좀 봐줘"를 말로 설명해야 합니다.
 * 지라의 필터 URL, 노션의 뷰 링크가 하는 일입니다. 링크 하나로 상대가
 * 정확히 같은 목록을 봅니다.
 *
 * 형식은 사람이 읽고 손으로 고칠 수 있게 유지합니다:
 *
 *   ?q=결제&f=status:in:blocked,doing;priority:eq:urgent&s=errors:desc&g=system&v=board
 *
 * JSON 을 base64 로 넣는 편이 구현은 쉽지만, 링크를 보고 무엇이 걸렸는지
 * 알 수 없고 손으로 고칠 수도 없습니다. 관리도구에서는 그게 손해입니다.
 */

const SEP_COND = ';'
const SEP_PART = ':'
const SEP_LIST = ','

/** 값 안에 구분자가 들어가도 깨지지 않게 인코딩합니다 */
const enc = (v) => encodeURIComponent(String(v))
const dec = (v) => {
  try { return decodeURIComponent(v) } catch { return v }
}

/**
 * URL 은 모든 것을 문자열로 만듭니다. 필드 타입을 알면 원래 타입으로 되돌립니다.
 * 이걸 빠뜨리면 숫자 조건이 "100" 처럼 문자열로 살아나, 저장된 뷰와
 * 링크로 연 뷰가 미묘하게 다른 객체가 됩니다.
 */
function coerce(field, raw) {
  if (!field) return raw
  if (field.type === 'number') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : raw
  }
  if (field.type === 'checkbox') return raw === 'true'
  return raw
}

/**
 * 질의를 URL 검색 문자열로. 기본값은 생략해 링크를 짧게 유지합니다.
 * @param {object} query
 * @returns {string} 예: "q=결제&f=status:in:blocked"
 */
export function encodeQuery(query) {
  /* URLSearchParams.toString() 을 쓰지 않는 이유:
     구분자로 쓰는 : ; , 까지 %3A %3B %2C 로 재인코딩해 버려서
     "사람이 읽고 손으로 고칠 수 있는 링크"라는 목적이 깨집니다.
     값은 enc() 로 이미 안전하게 인코딩되므로 구조 문자만 그대로 둡니다.
     ( : ; , 는 쿼리 문자열에서 그대로 쓸 수 있는 문자입니다 — RFC 3986 ) */
  const parts = []

  if (query.search) parts.push(`q=${enc(query.search)}`)

  if (query.conditions?.length) {
    const f = query.conditions
      .map((c) => {
        const value = Array.isArray(c.value)
          ? c.value.map(enc).join(SEP_LIST)
          : enc(c.value ?? '')
        return [c.field, c.operator, value].join(SEP_PART)
      })
      .join(SEP_COND)
    parts.push(`f=${f}`)
  }

  if (query.match === 'any') parts.push('m=any')

  if (query.sort?.length) {
    parts.push(`s=${query.sort.map((x) => `${x.field}${SEP_PART}${x.direction}`).join(SEP_LIST)}`)
  }

  if (query.groupBy) parts.push(`g=${query.groupBy}`)

  return parts.join('&')
}

/**
 * URL 검색 문자열을 질의로. 알 수 없는 값은 조용히 버립니다 —
 * 손으로 고친 링크나 옛 형식이 화면을 깨뜨리면 안 됩니다.
 *
 * @param {string|URLSearchParams} input
 * @param {Record<string, any>} [fields] - 주면 존재하지 않는 필드 조건을 걸러냅니다
 */
export function decodeQuery(input, fields) {
  const params = typeof input === 'string' ? new URLSearchParams(input) : input
  const query = emptyQuery()

  query.search = params.get('q') ?? ''
  query.match = params.get('m') === 'any' ? 'any' : 'all'

  const f = params.get('f')
  if (f) {
    query.conditions = f.split(SEP_COND)
      .map((part) => {
        const [field, operator, raw = ''] = part.split(SEP_PART)
        if (!field || !operator) return null
        if (fields && !fields[field]) return null
        const def = fields?.[field]
        const value = raw.includes(SEP_LIST) || operator === 'in' || operator === 'notIn'
          ? raw.split(SEP_LIST).filter(Boolean).map((v) => coerce(def, dec(v)))
          : coerce(def, dec(raw))
        return { field, operator, value }
      })
      .filter(Boolean)
  }

  const s = params.get('s')
  if (s) {
    query.sort = s.split(SEP_LIST)
      .map((part) => {
        const [field, direction] = part.split(SEP_PART)
        if (!field) return null
        if (fields && !fields[field]) return null
        return { field, direction: direction === 'desc' ? 'desc' : 'asc' }
      })
      .filter(Boolean)
  }

  const g = params.get('g')
  if (g && (!fields || fields[g])) query.groupBy = g

  return query
}

/** 현재 질의를 담은 공유용 절대 URL */
export function queryToUrl(query, base = typeof location !== 'undefined' ? location.href : '') {
  const url = new URL(base)
  const encoded = encodeQuery(query)
  url.search = encoded
  return url.toString()
}

/**
 * useQuerySync — 질의를 주소창과 양방향으로 묶습니다.
 *
 * - 질의가 바뀌면 주소를 replaceState 로 갱신합니다(뒤로가기 이력을 더럽히지 않게)
 * - 뒤로/앞으로 가기(popstate)로 주소가 바뀌면 질의를 되돌립니다
 *
 * @param {object} query
 * @param {(q: object) => void} setQuery
 * @param {object} [options]
 * @param {Record<string, any>} [options.fields]
 * @param {boolean} [options.enabled]
 */
export function useQuerySync(query, setQuery, { fields, enabled = true } = {}) {
  const lastPushed = useRef(null)

  /* 첫 렌더에서 주소에 담긴 질의를 복원합니다 */
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    const initial = window.location.search.replace(/^\?/, '')
    if (initial) {
      const decoded = decodeQuery(initial, fields)
      lastPushed.current = encodeQuery(decoded)
      setQuery(decoded)
    }
    /* 마운트 시 1회 — query 를 의존성에 넣으면 복원과 갱신이 서로를 덮어씁니다 */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  /* 질의 → 주소 */
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    const encoded = encodeQuery(query)
    if (encoded === lastPushed.current) return
    lastPushed.current = encoded
    const url = encoded ? `${window.location.pathname}?${encoded}` : window.location.pathname
    window.history.replaceState(null, '', url)
  }, [query, enabled])

  /* 주소 → 질의 (뒤로가기) */
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    const onPop = () => {
      const encoded = window.location.search.replace(/^\?/, '')
      lastPushed.current = encoded
      setQuery(decodeQuery(encoded, fields))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [enabled, fields, setQuery])

  /** 공유용 링크를 클립보드에 복사 */
  const copyLink = useCallback(async () => {
    const url = queryToUrl(query)
    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch {
      return false
    }
  }, [query])

  return { copyLink }
}
