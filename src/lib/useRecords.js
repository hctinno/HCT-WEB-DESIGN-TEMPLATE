import { useCallback, useMemo, useRef, useState } from 'react'

/**
 * useRecords — 레코드 집합의 낙관적 편집 + 활동 기록.
 *
 * 인라인 편집이 성립하려면 세 가지가 필요합니다:
 *
 *   1. 낙관적 반영 — 서버 응답을 기다리지 않고 화면을 먼저 바꿉니다.
 *      기다리면 "클릭 → 스피너 → 반영"이 되어 인라인 편집의 의미가 없습니다.
 *   2. 실패 시 롤백 — 서버가 거절하면 원래 값으로 되돌리고 알립니다.
 *      조용히 되돌리면 사용자는 자기가 고친 줄 압니다.
 *   3. 활동 기록 — 누가 무엇을 언제 바꿨는지 자동으로 남깁니다.
 *
 * 개발 에이전트 사용 규칙:
 *   - 인라인 편집을 직접 setState 로 구현하지 마세요. 롤백과 이력이 빠집니다.
 *   - persist 를 넘기면 서버 저장을 시도하고, 실패 시 자동 롤백합니다.
 *     넘기지 않으면 메모리에서만 동작합니다(프로토타입용).
 *
 * @param {any[]} initialRecords
 * @param {object} [options]
 * @param {(r: any) => string|number} [options.rowKey]
 * @param {string} [options.actor] - 활동 기록에 남길 사람 이름
 * @param {(record: any, fieldKey: string, value: any) => Promise<any>} [options.persist]
 * @param {(message: string) => void} [options.onError]
 */
export function useRecords(initialRecords, options = {}) {
  const {
    rowKey = (r) => r.id,
    actor = '나',
    persist,
    onError,
  } = options

  const [records, setRecords] = useState(initialRecords)
  const [activityByKey, setActivityByKey] = useState({})
  const [pending, setPending] = useState(() => new Set())
  const seq = useRef(0)

  const nextId = () => {
    seq.current += 1
    return `act-${Date.now()}-${seq.current}`
  }

  const appendActivity = useCallback((key, entry) => {
    setActivityByKey((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), entry] }))
  }, [])

  /** 단일 필드 편집 */
  const editRecord = useCallback(async (record, fieldKey, value) => {
    const key = rowKey(record)
    const previous = record[fieldKey]
    if (previous === value) return

    /* 1) 낙관적 반영 */
    setRecords((prev) => prev.map((r) => (rowKey(r) === key ? { ...r, [fieldKey]: value } : r)))
    appendActivity(key, {
      id: nextId(), type: 'change', actor, at: new Date().toISOString(),
      field: fieldKey, from: previous, to: value,
    })

    if (!persist) return

    setPending((prev) => new Set(prev).add(key))
    try {
      await persist(record, fieldKey, value)
    } catch (err) {
      /* 2) 실패하면 되돌리고 알립니다 — 조용히 되돌리면 안 됩니다 */
      setRecords((prev) => prev.map((r) => (rowKey(r) === key ? { ...r, [fieldKey]: previous } : r)))
      setActivityByKey((prev) => ({
        ...prev,
        [key]: (prev[key] ?? []).slice(0, -1),
      }))
      onError?.(err?.message ?? '변경을 저장하지 못했습니다. 되돌렸습니다.')
    } finally {
      setPending((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }, [rowKey, actor, persist, onError, appendActivity])

  /** 여러 레코드에 같은 값 적용 (벌크 액션) */
  const bulkEdit = useCallback((keys, fieldKey, value) => {
    const keySet = new Set([...keys].map(String))
    setRecords((prev) => prev.map((r) => (keySet.has(String(rowKey(r))) ? { ...r, [fieldKey]: value } : r)))
    setRecords((current) => {
      current.forEach((r) => {
        const k = rowKey(r)
        if (keySet.has(String(k))) {
          appendActivity(k, {
            id: nextId(), type: 'change', actor, at: new Date().toISOString(),
            field: fieldKey, from: null, to: value,
          })
        }
      })
      return current
    })
  }, [rowKey, actor, appendActivity])

  const removeRecords = useCallback((keys) => {
    const keySet = new Set([...keys].map(String))
    setRecords((prev) => prev.filter((r) => !keySet.has(String(rowKey(r)))))
  }, [rowKey])

  const addComment = useCallback((key, body) => {
    appendActivity(key, { id: nextId(), type: 'comment', actor, at: new Date().toISOString(), body })
  }, [actor, appendActivity])

  const activityOf = useCallback((key) => activityByKey[key] ?? [], [activityByKey])

  return useMemo(() => ({
    records,
    setRecords,
    editRecord,
    bulkEdit,
    removeRecords,
    addComment,
    activityOf,
    isPending: (key) => pending.has(key),
  }), [records, editRecord, bulkEdit, removeRecords, addComment, activityOf, pending])
}
