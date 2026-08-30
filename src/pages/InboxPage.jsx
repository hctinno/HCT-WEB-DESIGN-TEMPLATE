import { useMemo, useState } from 'react'
import {
  PageContainer, PageHeader,
  Button, IconButton, SegmentedControl, StatusBadge, EmptyState, Avatar,
  formatRelative, useToast,
} from '../components'
import { AppFrame } from './_shell'
import { NavIcons } from './_icons'
import { NOTIFICATION_GROUPS, TYPE_MAP } from './_notifications'

/**
 * 화면 원형 7: 알림 인박스
 *
 * 사이드바에 배지를 달았으면 **누를 곳이 있어야 합니다.** 지금까지 이
 * 템플릿의 배지 네 개는 아무 데도 가지 않았습니다.
 *
 * 인박스를 만들 때 실패하는 방식은 거의 하나입니다:
 * **이벤트를 시간순으로 그대로 늘어놓는 것.** 바쁜 날에는 같은 요청의
 * 변경 다섯 줄이 화면을 채우고, 정작 나를 부른 한 줄이 묻힙니다.
 *
 * 그래서 여기서 지키는 규칙:
 *
 *   1. **객체 단위로 묶습니다.** 한 줄 = 한 요청. 그 안에 이벤트가 쌓입니다.
 *   2. **나를 부른 것과 구경거리를 구분합니다.** direct 는 빨간 표시,
 *      subscribed 는 굵기만. 전부 빨갛게 하면 아무것도 급하지 않습니다.
 *   3. **읽음은 되돌릴 수 있습니다.** 사람들은 읽지 않음으로 분류를 합니다.
 *      되돌릴 수 없으면 실수로 하나 지나쳤을 때 복구할 방법이 없습니다.
 *   4. **끝이 있습니다.** 다 읽으면 빈 화면이 나오고, 그게 보상입니다.
 *      무한 스크롤 피드로 만들면 끝나지 않습니다.
 */

const TABS = [
  { value: 'unread', label: '읽지 않음' },
  { value: 'direct', label: '나를 부른 것' },
  { value: 'all', label: '전체' },
]

export function InboxPage({ onNavigate, onOpenObject }) {
  const { toast } = useToast()
  const [groups, setGroups] = useState(NOTIFICATION_GROUPS)
  const [tab, setTab] = useState('unread')
  const [expanded, setExpanded] = useState(() => new Set())

  /* direct 이벤트가 하나라도 있으면 그 묶음은 나를 부른 것입니다 */
  const isDirect = (g) => g.events.some((e) => TYPE_MAP[e.type]?.weight === 'direct')

  const visible = useMemo(() => {
    const list = tab === 'unread' ? groups.filter((g) => !g.read)
      : tab === 'direct' ? groups.filter(isDirect)
      : groups
    /* 가장 최근 이벤트 기준 정렬 — 묶음의 나이는 가장 새 이벤트가 정합니다 */
    return [...list].sort((a, b) => latest(b) - latest(a))
  }, [groups, tab])

  const unreadCount = groups.filter((g) => !g.read).length
  const directCount = groups.filter((g) => !g.read && isDirect(g)).length

  const setRead = (id, read) =>
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, read } : g)))

  const markAllRead = () => {
    const before = groups
    setGroups((prev) => prev.map((g) => ({ ...g, read: true })))
    /* 되돌리기가 없으면 "모두 읽음"은 누르기 무서운 버튼이 됩니다 */
    toast({
      tone: 'success',
      message: `${unreadCount}건을 읽음으로 표시했습니다`,
      action: { label: '실행 취소', onClick: () => setGroups(before) },
    })
  }

  const toggleExpand = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const open = (g) => {
    setRead(g.id, true)
    onOpenObject?.(g.objectId)
  }

  return (
    <AppFrame
      active="inbox"
      onNavigate={onNavigate}
      counts={{ list: 18, inbox: unreadCount || undefined, archive: 12 }}
      mentions={{ inbox: directCount || undefined }}
    >
      <PageContainer>
        <PageHeader
          title="알림"
          description="같은 요청의 변경은 한 줄로 묶었습니다. 줄을 펼치면 그 안의 변경을 모두 볼 수 있습니다."
          actions={
            <Button
              variant="secondary"
              disabled={unreadCount === 0}
              onClick={markAllRead}
            >
              모두 읽음
            </Button>
          }
        />

        <SegmentedControl
          className="mb-3"
          value={tab}
          onChange={setTab}
          options={TABS.map((t) => ({
            ...t,
            count: t.value === 'unread' ? unreadCount
              : t.value === 'direct' ? groups.filter(isDirect).length
              : groups.length,
          }))}
        />

        {visible.length === 0 ? (
          /* 다 읽은 상태는 오류가 아니라 성취입니다. 그렇게 말해줍니다. */
          <EmptyState
            title={tab === 'unread' ? '다 읽었습니다' : '해당하는 알림이 없습니다'}
            description={
              tab === 'unread'
                ? '새 알림이 오면 여기에 쌓입니다. 사이드바 배지도 함께 사라집니다.'
                : '다른 탭에는 알림이 남아 있을 수 있습니다.'
            }
            action={
              tab !== 'all' && (
                <Button variant="secondary" onClick={() => setTab('all')}>전체 보기</Button>
              )
            }
          />
        ) : (
          <ul className="overflow-hidden rounded-lg border border-line-subtle bg-bg-surface">
            {visible.map((g) => (
              <NotificationRow
                key={g.id}
                group={g}
                direct={isDirect(g)}
                expanded={expanded.has(g.id)}
                onToggle={() => toggleExpand(g.id)}
                onOpen={() => open(g)}
                onSetRead={(read) => setRead(g.id, read)}
              />
            ))}
          </ul>
        )}
      </PageContainer>
    </AppFrame>
  )
}

function latest(group) {
  return Math.max(...group.events.map((e) => new Date(e.at).getTime()))
}

/**
 * 알림 한 줄.
 *
 * 왼쪽 끝의 점은 **읽지 않음 표시이자 읽음 버튼**입니다. 별도의 체크박스를
 * 두면 목록이 관리 화면처럼 무거워집니다. 슬랙·지라 모두 이 자리를 씁니다.
 */
function NotificationRow({ group, direct, expanded, onToggle, onOpen, onSetRead }) {
  const events = expanded ? group.events : group.events.slice(0, 1)
  const hidden = group.events.length - events.length

  return (
    <li className="border-b border-line-subtle last:border-b-0">
      <div className={
        'group flex items-start gap-2.5 px-3 py-2.5 ' +
        (group.read ? 'bg-bg-surface' : 'bg-accent-subtle')
      }>
        {/* 읽음 표시 겸 토글 */}
        <button
          type="button"
          onClick={() => onSetRead(!group.read)}
          aria-label={group.read ? '읽지 않음으로 표시' : '읽음으로 표시'}
          title={group.read ? '읽지 않음으로 표시' : '읽음으로 표시'}
          className="mt-1.5 flex h-3 w-3 shrink-0 items-center justify-center"
        >
          <span className={
            'h-2 w-2 rounded-full ' +
            (group.read
              ? 'border border-line-strong bg-transparent group-hover:bg-fg-disabled'
              : direct ? 'bg-danger-solid' : 'bg-accent-solid')
          } />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onOpen}
              className={
                'truncate text-base hover:underline ' +
                (group.read ? 'font-medium text-fg-secondary' : 'font-semibold text-fg-primary')
              }
            >
              {group.objectTitle}
            </button>
            <span className="tabular text-xs text-fg-tertiary">{group.objectId}</span>
            {direct && <StatusBadge tone="danger" size="sm">나를 부름</StatusBadge>}
          </div>

          <ul className="mt-1 space-y-1">
            {events.map((e) => (
              <li key={e.id} className="flex items-start gap-1.5 text-sm text-fg-tertiary">
                <Avatar name={e.actor} />
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-fg-secondary">{e.actor}</span>
                  <span className="mx-1 text-fg-disabled">·</span>
                  <span>{TYPE_MAP[e.type]?.label}</span>
                  <span className="mx-1 text-fg-disabled">·</span>
                  <span className="tabular">{formatRelative(e.at)}</span>
                  <span className="mt-0.5 block text-fg-secondary">{e.text}</span>
                </span>
              </li>
            ))}
          </ul>

          {hidden > 0 && (
            <button
              type="button"
              onClick={onToggle}
              className="mt-1 text-xs font-medium text-accent-text hover:underline"
            >
              변경 {hidden}건 더 보기
            </button>
          )}
          {expanded && group.events.length > 1 && (
            <button
              type="button"
              onClick={onToggle}
              className="mt-1 text-xs font-medium text-accent-text hover:underline"
            >
              접기
            </button>
          )}
        </div>

        {/* 행 동작은 호버·포커스에서만 — 평소엔 목록이 조용해야 합니다 */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-instant group-hover:opacity-100 group-focus-within:opacity-100">
          <IconButton size="xs" label="열기" icon={<NavIcons.Inbox />} onClick={onOpen} />
        </div>
      </div>
    </li>
  )
}
