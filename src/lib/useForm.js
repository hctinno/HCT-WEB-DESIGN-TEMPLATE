import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * useForm — 관리도구 폼의 상태·검증·이탈 방지.
 *
 * 관리도구의 폼은 회원가입 폼과 다릅니다:
 *   - 대부분 **기존 값을 고치는** 일입니다. 그래서 "무엇이 바뀌었는가"가 중요합니다
 *   - 필드가 많고 섹션이 깁니다. 저장 버튼을 섹션마다 두면 어디를 눌러야 할지 모릅니다
 *   - 중간에 다른 화면으로 새면 작업이 통째로 날아갑니다
 *
 * 그래서 이 훅은 세 가지를 담당합니다:
 *   1. dirty 추적 — 원본과 다른 필드만 골라냅니다
 *   2. 검증 — 제출 시점과 blur 이후에만 오류를 보여줍니다(입력 중엔 조용히)
 *   3. 이탈 방지 — 저장하지 않은 변경이 있으면 브라우저가 확인을 띄웁니다
 *
 * @param {object} options
 * @param {Record<string, any>} options.initialValues
 * @param {(values: object) => Record<string, string>} [options.validate] - key → 오류 메시지
 * @param {(values: object, changed: object) => Promise<void>|void} [options.onSubmit]
 */
export function useForm({ initialValues, validate, onSubmit }) {
  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const baseline = useRef(initialValues)

  /* 바깥에서 원본이 바뀌면(다른 레코드 선택 등) 폼을 갈아끼웁니다 */
  useEffect(() => {
    baseline.current = initialValues
    setValues(initialValues)
    setTouched({})
    setSubmitted(false)
  }, [initialValues])

  const errors = useMemo(() => (validate ? validate(values) ?? {} : {}), [validate, values])

  /** 원본과 달라진 필드만 */
  const changed = useMemo(() => {
    const diff = {}
    for (const key of Object.keys(values)) {
      if (!Object.is(values[key], baseline.current[key])) diff[key] = values[key]
    }
    return diff
  }, [values])

  const dirty = Object.keys(changed).length > 0
  const valid = Object.keys(errors).length === 0

  /**
   * 오류를 언제 보여줄지.
   * 입력하는 도중에 빨간 글씨가 뜨면 아직 다 치지도 않았는데 혼나는 느낌입니다.
   * blur 이후 또는 제출 시도 이후에만 보여줍니다.
   */
  const visibleErrors = useMemo(() => {
    const out = {}
    for (const [key, message] of Object.entries(errors)) {
      if (submitted || touched[key]) out[key] = message
    }
    return out
  }, [errors, touched, submitted])

  const setValue = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setFieldTouched = useCallback((key) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }))
  }, [])

  const reset = useCallback(() => {
    setValues(baseline.current)
    setTouched({})
    setSubmitted(false)
  }, [])

  const submit = useCallback(async () => {
    setSubmitted(true)
    if (!valid) return { ok: false, errors }
    setSubmitting(true)
    try {
      await onSubmit?.(values, changed)
      baseline.current = values /* 저장 성공 → 새 원본 */
      setTouched({})
      setSubmitted(false)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err }
    } finally {
      setSubmitting(false)
    }
  }, [valid, errors, onSubmit, values, changed])

  /**
   * 이탈 방지. 저장하지 않은 변경이 있는데 탭을 닫거나 새로고침하면 확인을 띄웁니다.
   * 앱 내부 이동은 라우터가 막아야 하므로 dirty 를 함께 반환합니다.
   */
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  return {
    values, setValue, setValues,
    errors: visibleErrors, allErrors: errors,
    touched, setFieldTouched,
    changed, dirty, valid, submitting,
    submit, reset,
    /** 필드에 그대로 펼쳐 넣는 props */
    fieldProps: (key) => ({
      value: values[key] ?? '',
      onChange: (e) => setValue(key, e?.target ? e.target.value : e),
      onBlur: () => setFieldTouched(key),
      error: visibleErrors[key],
    }),
  }
}
