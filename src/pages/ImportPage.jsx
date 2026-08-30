import { useMemo, useRef, useState } from 'react'
import {
  PageContainer, PageHeader,
  Stepper, Dropzone, Button, Banner, SelectField, RadioCards,
  Progress, EmptyState, useToast,
  DataGrid, GridCard,
} from '../components'
import { AppFrame } from './_shell'
import { toTable } from '../lib/csv'
import { guessMapping, validateRows, errorReportCsv } from '../lib/importing'
import { REQUEST_FIELDS, REQUEST_RECORDS } from './_data'

/**
 * 화면 원형 9: 데이터 가져오기 마법사
 *
 * 관리도구에서 가장 무서운 화면입니다. 한 번 잘못 누르면 수백 건이
 * 들어가고, 되돌리는 것은 훨씬 어렵습니다. 그래서 순서가 곧 안전장치입니다:
 *
 *   1. 올리기 — 무엇을 받는지 먼저 말합니다
 *   2. 열 연결 — 자동으로 맞히되 **확실할 때만** 채웁니다
 *   3. 확인   — **실행 전에 전부 검증합니다.** 이게 이 화면의 핵심입니다
 *   4. 실행   — 부분 실패를 숨기지 않습니다
 *
 * 3단계가 없는 가져오기는 반드시 사고를 냅니다. 넣다가 실패하면 절반만
 * 들어간 상태로 멈추고, 그 상태를 정리하는 일은 사용자에게 넘어갑니다.
 *
 * 검증 규칙은 필드 스키마(_data.js)에서 그대로 나옵니다. 가져오기가
 * 자기만의 규칙을 쓰면 표에서는 되는 값이 여기서는 거부됩니다.
 */

const STEPS = [
  { key: 'upload', label: '파일 올리기' },
  { key: 'map', label: '열 연결하기' },
  { key: 'review', label: '확인하기' },
  { key: 'run', label: '가져오기' },
]

/* 사용자가 파일 없이도 화면을 이해할 수 있게 하는 예시.
   일부러 오류 행을 섞었습니다 — 잘 되는 경우만 보여주는 예시는
   이 화면에서 가장 중요한 부분(오류 처리)을 감춥니다. */
const SAMPLE_CSV = [
  'ID,제목,상태,우선순위,담당자,시스템,오류수',
  'REQ-2001,결제 재시도 큐 정리,진행중,높음,김민수,결제,12',
  'REQ-2002,인증 토큰 만료 알림,대기,보통,이서연,인증,0',
  'REQ-2003,"리포트 내보내기, CSV 인코딩",검토중,낮음,박지훈,리포트,3',
  'REQ-2004,수집 지연 모니터링,진행중,긴급,없는사람,수집,7',
  'REQ-2005,,완료,보통,최유진,결제,0',
  'REQ-2006,대시보드 캐시 정리,진행중,보통,정하늘,결제,열두개',
  'REQ-1042,결제 승인 지연 조사,대기,높음,김민수,결제,4',
].join('\n')

const DUP_POLICIES = [
  { value: 'skip', label: '건너뛰기', description: '이미 있는 항목은 그대로 둡니다' },
  { value: 'overwrite', label: '덮어쓰기', description: '파일의 값으로 기존 항목을 바꿉니다' },
]

export function ImportPage({ onNavigate }) {
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [file, setFile] = useState(null)
  const [table, setTable] = useState(null)
  const [mapping, setMapping] = useState({})
  const [dupPolicy, setDupPolicy] = useState('skip')
  const [job, setJob] = useState(null)
  const cancelled = useRef(false)

  const fields = REQUEST_FIELDS
  const existingIds = useMemo(() => REQUEST_RECORDS.map((r) => r.id), [])

  const check = useMemo(() => {
    if (!table) return null
    return validateRows({
      headers: table.headers, rows: table.rows, mapping, fields, existingIds,
    })
  }, [table, mapping, fields, existingIds])

  const load = (text, name) => {
    const parsed = toTable(text)
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      toast({ tone: 'danger', message: '읽을 수 있는 행이 없습니다. 첫 줄이 머리글인지 확인하세요' })
      return
    }
    setTable(parsed)
    setMapping(guessMapping(parsed.headers, fields))
    setFile({ name, rows: parsed.rows.length })
    setStep(1)
  }

  const takeFile = async (f) => {
    /* 인코딩을 못 읽는 파일은 여기서 걸립니다. 조용히 깨진 글자로
       넘기면 3단계에서 전부 오류로 보여 원인을 알 수 없게 됩니다. */
    const text = await f.text()
    load(text, f.name)
  }

  const restart = () => {
    setStep(0); setFile(null); setTable(null); setMapping({}); setJob(null)
  }

  const importable = check
    ? check.rows.filter((r) => r.errors.length === 0 && !(r.duplicate && dupPolicy === 'skip'))
    : []

  const blocked = check
    ? check.summary.missingRequired.length > 0 || check.summary.duplicated.length > 0
    : true

  const run = async () => {
    setStep(3)
    cancelled.current = false
    const total = importable.length
    setJob({ state: 'running', done: 0, total })

    for (let i = 0; i < total; i += 1) {
      if (cancelled.current) {
        setJob({ state: 'cancelled', done: i, total })
        return
      }
      /* 한 건씩 넣는 척합니다. 실제로는 묶음 요청이겠지만, 화면이
         알아야 하는 것은 "어디까지 갔는가" 하나입니다. */
      await new Promise((r) => setTimeout(r, 40))
      setJob({ state: 'running', done: i + 1, total })
    }
    setJob({ state: 'done', done: total, total })
    toast({ tone: 'success', message: `${total}건을 가져왔습니다` })
  }

  return (
    <AppFrame
      active="import"
      onNavigate={onNavigate}
      counts={{ list: 18, inbox: true, archive: 12 }}
      mentions={{ inbox: 3 }}
    >
      <PageContainer>
        <PageHeader
          title="데이터 가져오기"
          description="CSV 파일의 요청을 이 워크스페이스로 옮깁니다. 실행하기 전에 모든 행을 검사합니다."
        />

        <Stepper
          className="mb-5"
          steps={STEPS}
          current={step}
          onStepClick={job?.state === 'running' ? undefined : setStep}
        />

        {step === 0 && <UploadStep onFile={takeFile} onSample={() => load(SAMPLE_CSV, '예시.csv')} fields={fields} />}

        {step === 1 && table && (
          <MapStep
            table={table} fields={fields} mapping={mapping} onChange={setMapping}
            summary={check.summary}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && check && (
          <ReviewStep
            table={table} fields={fields} check={check}
            dupPolicy={dupPolicy} onDupPolicy={setDupPolicy}
            importable={importable.length}
            blocked={blocked}
            onBack={() => setStep(1)}
            onRun={run}
          />
        )}

        {step === 3 && job && (
          <RunStep
            job={job} file={file}
            onCancel={() => { cancelled.current = true }}
            onDone={() => onNavigate?.('list')}
            onRestart={restart}
          />
        )}
      </PageContainer>
    </AppFrame>
  )
}

/* ── 1단계: 올리기 ─────────────────────────────────────────────────
   무엇을 받는지 **먼저** 말합니다. 파일을 올리고 나서 "이 열이 필요합니다"
   라고 하면 사용자는 파일을 다시 만들어야 합니다. */
function UploadStep({ onFile, onSample, fields }) {
  const required = fields.filter((f) => f.required)

  return (
    <div className="max-w-[640px]">
      <div className="mb-4 rounded-md border border-line-subtle bg-bg-sunken px-3 py-2.5">
        <p className="text-base font-medium text-fg-primary">파일에 있어야 하는 것</p>
        <ul className="mt-1.5 space-y-1 text-sm text-fg-tertiary">
          <li>· 첫 줄은 머리글입니다.</li>
          <li>
            · 필수 열: {required.map((f) => (
              <strong key={f.key} className="font-medium text-fg-secondary">{f.label} </strong>
            ))}
            — 나머지 열은 있으면 쓰고 없으면 비웁니다.
          </li>
          <li>· 인코딩은 UTF-8 입니다. 엑셀에서 저장했다면 "CSV UTF-8" 을 고르세요.</li>
        </ul>
      </div>

      <Dropzone accept=".csv" maxSizeMB={20} onFile={onFile}
                hint="쉼표로 구분된 CSV. 최대 20MB." />

      <div className="mt-3 flex items-center gap-2">
        <Button variant="secondary" onClick={onSample}>예시 데이터로 둘러보기</Button>
        <span className="text-sm text-fg-tertiary">
          오류가 섞인 예시라 확인 단계가 어떻게 동작하는지 볼 수 있습니다.
        </span>
      </div>
    </div>
  )
}

/* ── 2단계: 열 연결 ────────────────────────────────────────────────
   추측은 확실할 때만 합니다. 애매하게 채워두면 사용자는 그 칸을 읽지
   않고 지나갑니다 — 틀린 자동 연결이 빈 칸보다 나쁜 이유입니다. */
function MapStep({ table, fields, mapping, onChange, summary, onBack, onNext }) {
  const set = (index, key) => onChange({ ...mapping, [index]: key })

  const options = [
    { value: '', label: '— 가져오지 않음 —' },
    ...fields.map((f) => ({ value: f.key, label: f.label + (f.required ? ' (필수)' : '') })),
  ]

  const blocked = summary.missingRequired.length > 0 || summary.duplicated.length > 0

  return (
    <div className="max-w-[760px]">
      {summary.missingRequired.length > 0 && (
        <Banner tone="danger" title="필수 열이 연결되지 않았습니다" className="mb-3">
          {summary.missingRequired.join(', ')} 을(를) 어느 열에서 가져올지 골라야 합니다.
        </Banner>
      )}
      {summary.duplicated.length > 0 && (
        <Banner tone="danger" title="한 항목에 두 열이 연결되었습니다" className="mb-3">
          {summary.duplicated.join(', ')} — 어느 열을 쓸지 하나만 남기세요.
        </Banner>
      )}

      <div className="overflow-hidden rounded-lg border border-line-subtle bg-bg-surface">
        <div className="flex items-center gap-3 border-b border-line-subtle bg-bg-sunken px-3 py-2">
          <span className="w-[220px] shrink-0 text-xs font-semibold text-fg-secondary">파일의 열</span>
          <span className="w-5 shrink-0" />
          <span className="text-xs font-semibold text-fg-secondary">이 시스템의 항목</span>
        </div>

        <ul>
          {table.headers.map((header, i) => {
            const sample = table.rows.slice(0, 2)
              .map((r) => r.cells[i])
              .filter((v) => v != null && String(v).trim() !== '')
            return (
              <li key={`${header}-${i}`}
                  className="flex items-center gap-3 border-b border-line-subtle px-3 py-2 last:border-b-0">
                <div className="w-[220px] shrink-0">
                  <p className="truncate text-base font-medium text-fg-primary">{header || `(이름 없는 ${i + 1}번째 열)`}</p>
                  {/* 실제 값을 보여줘야 어느 열인지 확신할 수 있습니다 */}
                  {sample.length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-fg-tertiary">예: {sample.join(', ')}</p>
                  )}
                </div>
                <span aria-hidden="true" className="w-5 shrink-0 text-center text-fg-disabled">→</span>
                <SelectField
                  label={`${header} 열을 연결할 항목`}
                  hideLabel
                  size="sm"
                  className="max-w-[240px]"
                  options={options}
                  value={mapping[String(i)] ?? ''}
                  onChange={(e) => set(String(i), e.target.value)}
                />
              </li>
            )
          })}
        </ul>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button variant="secondary" onClick={onBack}>이전</Button>
        <Button variant="primary" disabled={blocked} onClick={onNext}>확인 단계로</Button>
      </div>
    </div>
  )
}

/* ── 3단계: 확인 ───────────────────────────────────────────────────
   이 화면의 존재 이유입니다.

   숫자 셋을 먼저 보여주고(가져올 수 있음 / 오류 / 이미 있음), 그다음에
   오류를 **줄 번호와 함께** 나열합니다. 줄 번호로 말해야 사용자가 자기
   파일에서 그 줄을 찾을 수 있습니다. "3번째 항목" 은 찾을 수 없습니다. */
function ReviewStep({ table, fields, check, dupPolicy, onDupPolicy, importable, blocked, onBack, onRun }) {
  const { summary, rows } = check
  const failed = rows.filter((r) => r.errors.length > 0)
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? failed : failed.slice(0, 5)

  const download = () => {
    const csv = errorReportCsv(table.headers, table.rows, rows)
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = '가져오기-오류.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-[760px]">
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <Count label="가져올 수 있음" value={importable} tone="success" />
        <Count label="오류로 제외" value={summary.failed} tone={summary.failed > 0 ? 'danger' : 'neutral'} />
        <Count label="이미 있는 항목" value={summary.duplicates} tone={summary.duplicates > 0 ? 'warning' : 'neutral'} />
      </div>

      {summary.duplicates > 0 && (
        <div className="mb-4 rounded-lg border border-line-subtle bg-bg-surface p-3">
          <p className="text-base font-medium text-fg-primary">이미 있는 {summary.duplicates}건을 어떻게 할까요?</p>
          <p className="mt-0.5 mb-2 text-sm text-fg-tertiary">
            같은 ID 가 이 워크스페이스에 이미 있습니다. 덮어쓰기는 되돌릴 수 없습니다.
          </p>
          <RadioCards options={DUP_POLICIES} value={dupPolicy} onChange={onDupPolicy} name="dup" />
        </div>
      )}

      {failed.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-lg border border-danger-border">
          <div className="flex items-center justify-between gap-3 border-b border-danger-border bg-danger-bg px-3 py-2">
            <p className="text-base font-semibold text-danger-text">
              고쳐야 하는 줄 {failed.length}개
            </p>
            <Button size="sm" variant="secondary" onClick={download}>오류 목록 내려받기</Button>
          </div>
          <ul className="bg-bg-surface">
            {shown.map((r) => (
              <li key={r.line} className="flex gap-3 border-b border-line-subtle px-3 py-2 last:border-b-0">
                <span className="w-12 shrink-0 tabular text-sm font-medium text-fg-tertiary">{r.line}줄</span>
                <ul className="min-w-0 flex-1 space-y-0.5">
                  {r.errors.map((e) => (
                    <li key={e} className="text-sm text-danger-text">{e}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          {failed.length > shown.length && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full border-t border-line-subtle bg-bg-surface py-2 text-sm font-medium text-accent-text hover:bg-bg-hover"
            >
              나머지 {failed.length - shown.length}줄 더 보기
            </button>
          )}
        </div>
      )}

      {/* 정상 행은 "무엇이 들어가는지" 확인용으로 몇 줄만 보여줍니다 */}
      <PreviewTable fields={fields} rows={check.rows.filter((r) => r.errors.length === 0).slice(0, 3)} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={onBack}>이전</Button>
        <Button variant="primary" disabled={blocked || importable === 0} onClick={onRun}>
          {importable}건 가져오기
        </Button>
        {failed.length > 0 && (
          <span className="text-sm text-fg-tertiary">
            오류가 있는 {failed.length}줄은 건너뜁니다. 고쳐서 다시 올릴 수 있습니다.
          </span>
        )}
        {importable === 0 && (
          <span className="text-sm text-danger-text">가져올 수 있는 행이 없습니다.</span>
        )}
      </div>
    </div>
  )
}

function Count({ label, value, tone }) {
  const TONE = {
    success: 'border-success-border bg-success-bg text-success-text',
    danger: 'border-danger-border bg-danger-bg text-danger-text',
    warning: 'border-warning-border bg-warning-bg text-warning-text',
    neutral: 'border-line-subtle bg-bg-surface text-fg-tertiary',
  }
  return (
    <div className={'rounded-lg border px-3 py-2.5 ' + TONE[tone]}>
      <p className="text-xs font-medium">{label}</p>
      <p className="mt-0.5 tabular text-xl font-semibold">{value.toLocaleString('ko-KR')}</p>
    </div>
  )
}

/**
 * 들어갈 값 미리보기.
 *
 * 원본 문자열이 아니라 **변환된 값**을 보여줍니다. "높음" 이 어떤 값으로
 * 들어가는지 여기서 확인되지 않으면 확인 단계의 의미가 절반입니다.
 */
function PreviewTable({ fields, rows }) {
  if (rows.length === 0) return null

  /* 값이 하나라도 들어오는 열만 보여줍니다 — 전부 빈 열은 확인에 방해가 됩니다 */
  const shown = fields.filter((f) => rows.some((r) => r.values[f.key] != null))
  const records = rows.map((r) => ({ ...r.values, id: r.values.id ?? `line-${r.line}` }))

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-fg-secondary">
        이렇게 들어갑니다 (처음 {rows.length}줄)
      </p>
      <GridCard>
        {/* 목록 화면과 같은 DataGrid 를 씁니다. 미리보기를 따로 그리면
            "확인한 모습"과 "실제 들어간 모습"이 달라집니다. */}
        <DataGrid fields={shown} records={records} selectable={false} density="compact" />
      </GridCard>
    </div>
  )
}

/* ── 4단계: 실행 ───────────────────────────────────────────────────
   진행 중에는 **취소할 수 있어야** 합니다. 다만 취소는 "여기서 멈춤"
   이지 "되돌림"이 아니므로, 어디까지 들어갔는지 정확히 말해줍니다. */
function RunStep({ job, file, onCancel, onDone, onRestart }) {
  const pct = job.total === 0 ? 100 : Math.round((job.done / job.total) * 100)

  return (
    <div className="max-w-[560px]">
      {job.state === 'running' && (
        <div className="rounded-lg border border-line-subtle bg-bg-surface p-4">
          <p className="text-base font-medium text-fg-primary">가져오는 중…</p>
          <p className="mt-0.5 mb-3 text-sm text-fg-tertiary">
            {file?.name} · 이 화면을 닫아도 계속 진행됩니다.
          </p>
          <Progress value={job.done} max={job.total} label={`${pct}%`} />
          <div className="mt-3">
            <Button variant="secondary" onClick={onCancel}>중단</Button>
          </div>
        </div>
      )}

      {job.state === 'done' && (
        <EmptyState
          title={`${job.total.toLocaleString('ko-KR')}건을 가져왔습니다`}
          description="목록에서 방금 들어온 항목을 확인하세요. 되돌리려면 감사 로그에서 이 가져오기를 취소할 수 있습니다."
          action={
            <div className="flex gap-2">
              <Button variant="primary" onClick={onDone}>요청 목록 보기</Button>
              <Button variant="secondary" onClick={onRestart}>다른 파일 가져오기</Button>
            </div>
          }
        />
      )}

      {job.state === 'cancelled' && (
        <>
          <Banner tone="warning" title="중단했습니다" className="mb-3">
            중단은 되돌리기가 아닙니다. 이미 들어간 {job.done.toLocaleString('ko-KR')}건은 그대로 남아 있습니다
            (전체 {job.total.toLocaleString('ko-KR')}건 중). 취소하려면 감사 로그에서 이 가져오기를 되돌리세요.
          </Banner>
          <div className="flex gap-2">
            <Button variant="primary" onClick={onDone}>요청 목록 보기</Button>
            <Button variant="secondary" onClick={onRestart}>처음부터</Button>
          </div>
        </>
      )}
    </div>
  )
}
