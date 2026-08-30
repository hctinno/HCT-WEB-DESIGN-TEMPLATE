import { useMemo, useState } from 'react'
import {
  PageContainer, PageHeader,
  Button, Banner, StatusBadge, Switch, SegmentedControl,
  Drawer, PropertyList, PropertyRow, Progress, EmptyState,
  formatRelative, useToast,
} from '../components'
import { AppFrame } from './_shell'
import { NavIcons } from './_icons'

/**
 * 화면 원형 13: 예약 작업
 *
 * 자동으로 도는 일들의 목록입니다. 이 화면이 없으면 배치는 **아무도
 * 안 보는 곳에서 조용히 실패합니다.** 그러다 월말에 숫자가 안 맞는 걸로
 * 발견됩니다.
 *
 * 그래서 이 화면의 우선순위는 목록이 아니라 **실패의 가시성**입니다:
 *
 *   - 실패한 작업은 맨 위로 올라오고, 정렬로 숨길 수 없습니다.
 *   - "마지막 성공" 을 따로 보여줍니다. 어제 실패했는데 그저께 성공했다면
 *     하루치 데이터가 비어 있다는 뜻입니다. 마지막 실행만으로는 모릅니다.
 *   - 일정은 cron 이 아니라 **사람 말**로 씁니다. `0 3 * * 1` 을 읽을 수
 *     있는 사람만 쓰는 화면이 되면 운영자가 손을 못 댑니다.
 *   - 다음 실행 시각은 절대 시각과 남은 시간을 함께 씁니다.
 */

const M = 60 * 1000
const H = 60 * M
const now = Date.now()
const ago = (ms) => new Date(now - ms).toISOString()

/** 이 화면이 말하는 시각은 전부 서울 기준입니다 — 문장과 숫자가 어긋나면 안 됩니다 */
const TZ = 'Asia/Seoul'

/**
 * 일정에서 다음 실행 시각을 계산합니다.
 *
 * 다음 실행을 손으로 적어두면 "매주 월요일"인데 금요일이 찍히는 식으로
 * 반드시 어긋납니다. 화면의 두 값이 서로 모순되면 사용자는 어느 쪽도
 * 믿지 않게 됩니다.
 *
 * 계산은 **서울 벽시계 기준**입니다. 브라우저의 시간대로 계산하고 서울
 * 시각으로 표시하면 새벽 3시 작업이 낮 12시로 찍힙니다 — 서버가 어디에
 * 있느냐에 따라 화면이 달라지는, 찾기 어려운 종류의 버그입니다.
 *
 * 한국은 서머타임이 없어 고정 +9 로 충분합니다. 서머타임이 있는 지역을
 * 지원해야 한다면 이 함수는 시간대 라이브러리로 갈아끼워야 합니다.
 *
 * @param {{hour: number, minute?: number, weekday?: number, day?: number}} spec
 */
const KST = 9 * 60 * M

function nextRunAt(spec, from = Date.now()) {
  /* UTC 필드를 서울 벽시계로 쓰는 트릭 — 마지막에 다시 빼서 되돌립니다 */
  const wall = from + KST
  const d = new Date(wall)
  d.setUTCSeconds(0, 0)
  d.setUTCHours(spec.hour, spec.minute ?? 0)
  if (d.getTime() <= wall) d.setUTCDate(d.getUTCDate() + 1)

  if (spec.weekday != null) {
    while (d.getUTCDay() !== spec.weekday) d.setUTCDate(d.getUTCDate() + 1)
  }
  if (spec.day != null) {
    while (d.getUTCDate() !== spec.day) d.setUTCDate(d.getUTCDate() + 1)
  }
  return new Date(d.getTime() - KST).toISOString()
}

const JOBS = [
  {
    id: 'j1', name: '야간 요청 재분류', enabled: true,
    schedule: '매일 새벽 3시', cron: '0 3 * * *', owner: '운영팀',
    lastRun: ago(9 * H), lastState: 'failed', lastSuccess: ago(33 * H),
    nextRun: nextRunAt({ hour: 3 }),
    duration: '12초', processed: 0,
    error: '결제 시스템 API 응답 없음 (30초 시간 초과). 3회 재시도 후 중단.',
  },
  {
    id: 'j2', name: '주간 요약 메일 발송', enabled: true,
    schedule: '매주 월요일 9시', cron: '0 9 * * 1', owner: '운영팀',
    lastRun: ago(50 * H), lastState: 'done', lastSuccess: ago(50 * H),
    nextRun: nextRunAt({ hour: 9, weekday: 1 }),
    duration: '48초', processed: 32,
  },
  {
    id: 'j3', name: '오래된 감사 로그 정리', enabled: true,
    schedule: '매일 새벽 4시', cron: '0 4 * * *', owner: '시스템',
    lastRun: ago(8 * H), lastState: 'done', lastSuccess: ago(8 * H),
    nextRun: nextRunAt({ hour: 4 }),
    duration: '2분 10초', processed: 8412,
    note: '보존 기간(90일)을 지난 기록을 지웁니다. 이 작업 자체도 감사 로그에 남습니다.',
  },
  {
    id: 'j4', name: '정산 데이터 내보내기', enabled: true,
    schedule: '매월 1일 2시', cron: '0 2 1 * *', owner: '사업팀',
    lastRun: ago(11 * H), lastState: 'partial', lastSuccess: ago(730 * H),
    nextRun: nextRunAt({ hour: 2, day: 1 }),
    duration: '5분 3초', processed: 1186, failures: 18,
    error: '18건에서 담당자 정보를 찾지 못해 건너뛰었습니다.',
  },
  {
    id: 'j5', name: '스테이징 데이터 초기화', enabled: false,
    schedule: '매주 토요일 자정', cron: '0 0 * * 6', owner: '개발팀',
    lastRun: ago(600 * H), lastState: 'done', lastSuccess: ago(600 * H), nextRun: null,
    duration: '1분 4초', processed: 1,
    note: '중지된 상태입니다. 켜면 다음 토요일부터 다시 돕니다.',
  },
]

const STATE = {
  done: { tone: 'success', label: '성공' },
  failed: { tone: 'danger', label: '실패' },
  partial: { tone: 'warning', label: '일부 실패' },
  running: { tone: 'info', label: '실행 중' },
}

export function JobsPage({ onNavigate }) {
  const { toast } = useToast()
  const [jobs, setJobs] = useState(JOBS)
  const [filter, setFilter] = useState('all')
  const [detail, setDetail] = useState(null)
  const [running, setRunning] = useState(null)

  const broken = useMemo(
    () => jobs.filter((j) => j.enabled && (j.lastState === 'failed' || j.lastState === 'partial')),
    [jobs],
  )

  const visible = useMemo(() => {
    const list = filter === 'broken' ? broken
      : filter === 'off' ? jobs.filter((j) => !j.enabled)
      : jobs
    /* 실패는 항상 위입니다. 정렬로 숨길 수 있게 두면 결국 숨겨집니다. */
    return [...list].sort((a, b) => rank(a) - rank(b))
  }, [jobs, filter, broken])

  const toggle = (job, enabled) => {
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, enabled } : j)))
    toast({
      tone: 'success',
      message: enabled ? `${job.name} 을(를) 다시 켰습니다` : `${job.name} 을(를) 중지했습니다`,
    })
  }

  const runNow = async (job) => {
    setRunning(job.id)
    await new Promise((r) => setTimeout(r, 1400))
    setRunning(null)
    setJobs((prev) => prev.map((j) => (j.id === job.id
      ? { ...j, lastRun: new Date().toISOString(), lastSuccess: new Date().toISOString(), lastState: 'done' }
      : j)))
    toast({ tone: 'success', message: `${job.name} 을(를) 실행했습니다` })
  }

  return (
    <AppFrame
      active="jobs"
      onNavigate={onNavigate}
      counts={{ list: 18, inbox: true, archive: 12, jobs: broken.length || undefined }}
      mentions={{ inbox: 3, jobs: broken.length || undefined }}
    >
      <PageContainer>
        <PageHeader
          title="예약 작업"
          description="정해진 시각에 자동으로 도는 일들입니다. 시각은 서울(KST) 기준입니다."
          actions={<Button variant="primary" iconLeft={<NavIcons.Plus />}>작업 만들기</Button>}
        />

        {broken.length > 0 && (
          <Banner tone="danger" title={`${broken.length}개 작업이 마지막 실행에서 실패했습니다`} className="mb-3">
            자동 작업의 실패는 아무도 보지 않으면 월말에 숫자가 안 맞는 것으로 발견됩니다.
            지금 확인하세요.
          </Banner>
        )}

        <SegmentedControl
          className="mb-3"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: '전체', count: jobs.length },
            { value: 'broken', label: '문제 있음', count: broken.length },
            { value: 'off', label: '중지됨', count: jobs.filter((j) => !j.enabled).length },
          ]}
        />

        {visible.length === 0 ? (
          <EmptyState title="해당하는 작업이 없습니다" description="다른 탭을 확인해 보세요." />
        ) : (
          <ul className="space-y-2">
            {visible.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                running={running === job.id}
                onToggle={(v) => toggle(job, v)}
                onRun={() => runNow(job)}
                onOpen={() => setDetail(job)}
              />
            ))}
          </ul>
        )}
      </PageContainer>

      <Drawer open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.name ?? ''}>
        {detail && <JobDetail job={detail} />}
      </Drawer>
    </AppFrame>
  )
}

function rank(job) {
  if (!job.enabled) return 3
  if (job.lastState === 'failed') return 0
  if (job.lastState === 'partial') return 1
  return 2
}

function JobCard({ job, running, onToggle, onRun, onOpen }) {
  const state = STATE[running ? 'running' : job.lastState]
  const bad = job.enabled && (job.lastState === 'failed' || job.lastState === 'partial')

  /* 마지막 성공이 마지막 실행보다 오래되었다면 그 사이가 비어 있습니다 */
  const gap = job.lastSuccess !== job.lastRun && bad

  return (
    <li className={
      'rounded-lg border bg-bg-surface p-3 ' +
      (bad ? 'border-danger-border' : 'border-line-subtle')
    }>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onOpen}
              className="truncate text-base font-semibold text-fg-primary hover:underline"
            >
              {job.name}
            </button>
            <StatusBadge tone={state.tone} size="sm" dot>{state.label}</StatusBadge>
            {!job.enabled && <StatusBadge tone="neutral" size="sm">중지됨</StatusBadge>}
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-fg-tertiary">
            {/* cron 이 아니라 사람 말로. 원문은 상세에서 봅니다 */}
            <span className="font-medium text-fg-secondary">{job.schedule}</span>
            <span className="text-fg-disabled">·</span>
            <span>{job.owner}</span>
            <span className="text-fg-disabled">·</span>
            <span className="tabular">
              마지막 실행 {formatRelative(job.lastRun)} ({job.duration})
            </span>
          </p>

          {gap && (
            <p className="mt-1 text-sm text-danger-text">
              마지막 성공은 <span className="tabular">{formatRelative(job.lastSuccess)}</span> 입니다 —
              그 이후 데이터가 비어 있을 수 있습니다.
            </p>
          )}
          {job.error && <p className="mt-1 text-sm text-danger-text">{job.error}</p>}

          <p className="mt-1 text-sm text-fg-tertiary">
            {job.enabled && job.nextRun
              ? <>다음 실행 <span className="tabular font-medium text-fg-secondary">
                  {new Date(job.nextRun).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: TZ })}
                </span> (<span className="tabular">{untilText(job.nextRun)}</span>)</>
              : '중지되어 있어 예정된 실행이 없습니다'}
          </p>

          {running && <Progress className="mt-2" value={60} max={100} />}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Switch
            checked={job.enabled}
            onChange={onToggle}
            hideLabel
            label={`${job.name} 자동 실행`}
          />
          <Button size="sm" variant="secondary" loading={running} onClick={onRun}>
            지금 실행
          </Button>
        </div>
      </div>
    </li>
  )
}

/*
 * formatRelative 와 겹쳐 보이지만 다릅니다. formatRelative 는 일주일이 넘으면
 * 절대 날짜로 넘어가는데, 여기서는 바로 옆에 절대 시각을 이미 보여주고 있어
 * 날짜가 두 번 나옵니다. 이 자리에서 알고 싶은 건 "얼마나 남았나" 하나뿐이라
 * 몇 주가 걸려도 상대 표현을 유지합니다.
 */
function untilText(iso) {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff < 0) return '지남'
  const h = Math.floor(diff / (3600 * 1000))
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}분 후`
  if (h < 48) return `${h}시간 후`
  return `${Math.floor(h / 24)}일 후`
}

function JobDetail({ job }) {
  return (
    <div className="space-y-4">
      <PropertyList>
        <PropertyRow label="일정">{job.schedule}</PropertyRow>
        {/* 사람 말이 기본이고 cron 은 참고용입니다 — 반대로 하면 운영자가 못 씁니다 */}
        <PropertyRow label="cron">
          <code className="break-token rounded-sm bg-bg-sunken px-1.5 py-0.5 font-mono text-xs">{job.cron}</code>
        </PropertyRow>
        <PropertyRow label="담당">{job.owner}</PropertyRow>
        <PropertyRow label="상태">
          <StatusBadge tone={job.enabled ? 'success' : 'neutral'} size="sm">
            {job.enabled ? '켜짐' : '중지됨'}
          </StatusBadge>
        </PropertyRow>
      </PropertyList>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-fg-tertiary">
          마지막 실행
        </p>
        <PropertyList>
          <PropertyRow label="시각">
            <span className="tabular">{new Date(job.lastRun).toLocaleString('ko-KR', { timeZone: TZ })}</span>
          </PropertyRow>
          <PropertyRow label="결과">
            <StatusBadge tone={STATE[job.lastState].tone} size="sm" dot>
              {STATE[job.lastState].label}
            </StatusBadge>
          </PropertyRow>
          <PropertyRow label="걸린 시간"><span className="tabular">{job.duration}</span></PropertyRow>
          <PropertyRow label="처리 건수">
            <span className="tabular">{job.processed.toLocaleString('ko-KR')}건</span>
            {job.failures > 0 && (
              <span className="ml-1.5 text-danger-text">({job.failures}건 실패)</span>
            )}
          </PropertyRow>
          <PropertyRow label="마지막 성공">
            <span className="tabular">{formatRelative(job.lastSuccess)}</span>
          </PropertyRow>
        </PropertyList>
      </div>

      {job.error && (
        <div className="rounded-md border border-danger-border bg-danger-bg px-2.5 py-2">
          <p className="text-xs font-semibold text-danger-text">실패 원인</p>
          <p className="mt-0.5 text-sm text-danger-text">{job.error}</p>
        </div>
      )}

      {job.note && <p className="text-sm text-fg-tertiary">{job.note}</p>}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary">실행 기록 전체 보기</Button>
        <Button variant="ghost">일정 수정</Button>
      </div>
    </div>
  )
}
