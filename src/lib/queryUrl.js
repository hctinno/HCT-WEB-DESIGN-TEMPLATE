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

/**
 * 값 안에 구분자가 들어가도 깨지지 않게 인코딩합니다.
 *
 * encodeURIComponent 는 `:` `;` `,` 를 `%3A` `%3B` `%2C` 로 바꿉니다.
 * 그래서 값 안의 구분자는 구조 구분자와 구별됩니다 — **쪼개기 전에 풀지만
 * 않는다면.** 읽는 쪽(decodeQuery)이 그 순서를 지킵니다.
 */
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
 * 파라미터 값을 **퍼센트 해제하지 않고** 꺼냅니다.
 *
 * URLSearchParams.get() 은 값을 통째로 풀어버립니다. 그러면 값 안의 `%3A` 가
 * `:` 이 되어 **구조 구분자와 구별되지 않습니다.** 쪼개기 전에 풀면
 * `10:30` 이 `10` 으로 잘리고, `a;b` 는 조건 두 개가 됩니다. 조용히요.
 *
 * 그래서 순서를 지킵니다: **원본에서 꺼내고 → 쪼개고 → 조각마다 한 번 푼다.**
 * 두 번 푸는 것도 문제입니다 — 값이 `%3A` 라는 글자를 담고 있으면 그것까지
 * 콜론으로 바뀝니다.
 */
function rawParam(search, name) {
  for (const pair of search.split('&')) {
    const at = pair.indexOf('=')
    if (at < 0) continue
    if (pair.slice(0, at) === name) return pair.slice(at + 1)
  }
  return null
}

let warnedAboutParams = false

/**
 * URL 검색 문자열을 질의로. 알 수 없는 값은 조용히 버립니다 —
 * 손으로 고친 링크나 옛 형식이 화면을 깨뜨리면 안 됩니다.
 *
 * **문자열을 넘기세요.** URLSearchParams 를 넘기면 값이 이미 풀린 뒤라
 * 값 안의 `:` `;` `,` 를 구조 구분자와 구별할 수 없습니다. 그 경우
 * 콘솔로 알려주고 최선을 다해 읽습니다.
 *
 * @param {string|URLSearchParams} input - `location.search` 에서 `?` 를 뗀 문자열
 * @param {Record<string, any>} [fields] - 주면 존재하지 않는 필드 조건을 걸러냅니다
 */
export function decodeQuery(input, fields) {
  if (typeof input !== 'string' && !warnedAboutParams) {
    warnedAboutParams = true
    console.warn(
      '[HCT 질의] decodeQuery 에는 문자열을 넘기세요. URLSearchParams 는 값이 이미 ' +
      '풀린 상태라, 값 안의 : ; , 가 구분자와 섞여 조건이 잘릴 수 있습니다.',
    )
  }
  const search = typeof input === 'string' ? input.replace(/^\?/, '') : String(input)
  const params = new URLSearchParams(search)
  const query = emptyQuery()

  query.search = params.get('q') ?? ''
  query.match = params.get('m') === 'any' ? 'any' : 'all'

  const f = rawParam(search, 'f')
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

  const s = rawParam(search, 's')
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

  const g = dec(rawParam(search, 'g') ?? '') || null
  if (g && (!fields || fields[g])) query.groupBy = g

  return query
}

/** 이 모듈이 소유하는 파라미터. 나머지는 남의 것이므로 건드리지 않습니다. */
const OWNED = ['q', 'f', 'm', 's', 'g']

/**
 * 기존 검색 문자열에서 **우리 것만** 갈아끼웁니다.
 *
 * 예전에는 검색 문자열을 통째로 갈아치웠습니다. 그러면 질의와 무관한
 * 파라미터가 조용히 사라집니다 — 탭 상태(`?tab=activity`), 초대 토큰,
 * 추적 파라미터 같은 것들이요. 필터를 한 번 건드리면 없어지는데, 사라진
 * 것을 알아채기가 매우 어렵습니다.
 *
 * 값은 원본 그대로 옮깁니다. URLSearchParams 로 다시 만들면 남의
 * 파라미터까지 재인코딩해서 링크 모양이 바뀝니다.
 */
function mergeIntoSearch(existing, encoded) {
  const kept = existing.replace(/^\?/, '').split('&').filter((pair) => {
    if (!pair) return false
    const at = pair.indexOf('=')
    const key = at < 0 ? pair : pair.slice(0, at)
    return !OWNED.includes(key)
  })
  return [...kept, ...(encoded ? [encoded] : [])].join('&')
}

/** 현재 질의를 담은 공유용 절대 URL */
export function queryToUrl(query, base = typeof location !== 'undefined' ? location.href : '') {
  const url = new URL(base)
  /* url.search 에 대입하면 남의 파라미터가 날아갑니다 */
  url.search = mergeIntoSearch(url.search, encodeQuery(query))
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
    const search = mergeIntoSearch(window.location.search, encoded)
    const url = search ? `${window.location.pathname}?${search}` : window.location.pathname
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
