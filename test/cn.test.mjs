import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cn } from '../src/lib/cn.js'
import preset from '../tailwind-preset.js'

/*
 * cn 이 하는 일은 문자열 연결이 아니라 **충돌 해소**입니다.
 *
 *   cn('w-full', 'w-[240px]')   → 'w-[240px]'   (뒤에 온 것이 이김)
 *   'w-full ' + 'w-[240px]'     → 둘 다 남고 CSS 순서가 승자를 정함 (예측 불가)
 *
 * 컴포넌트에 className 을 넘겨 기본값을 덮어쓰는 일이 이 시스템에서 아주
 * 흔하므로, 이게 깨지면 "왜 내 className 이 안 먹지?" 가 계속 생깁니다.
 */

const last = (a, b) => cn(a, b) === b

test('같은 종류는 뒤에 온 것이 이긴다', () => {
  assert.ok(last('w-full', 'w-[240px]'))
  assert.ok(last('p-2', 'p-3'))
  assert.ok(last('bg-bg-surface', 'bg-bg-hover'))
})

test('종류가 다르면 둘 다 남는다', () => {
  /*
   * `text-` 로 시작한다고 다 같은 것이 아닙니다. 크기와 색이 한 그룹으로
   * 묶이면 둘 중 하나가 조용히 사라져서, 글자가 엉뚱한 크기나 색으로 나옵니다.
   */
  assert.equal(cn('text-sm', 'text-fg-primary'), 'text-sm text-fg-primary')
  assert.equal(cn('text-micro', 'text-fg-tertiary'), 'text-micro text-fg-tertiary')
  assert.equal(cn('text-metric', 'text-danger-text'), 'text-metric text-danger-text')
  assert.equal(cn('h-control-md', 'w-sidebar'), 'h-control-md w-sidebar')
})

test('조건부 클래스를 걸러낸다', () => {
  assert.equal(cn('a', false && 'b', null, undefined, 'c'), 'a c')
})

/*
 * 아래가 이 파일의 핵심입니다.
 *
 * tailwind-merge 는 **표준 Tailwind 스케일만** 알고 있습니다. 이 시스템이
 * 추가한 값(h-control-md, text-metric, w-sidebar …)은 cn.js 에서 따로
 * 등록해야 충돌 해소가 됩니다.
 *
 * 등록을 빠뜨려도 **아무 오류가 나지 않습니다.** 두 클래스가 그냥 나란히
 * 남고, 어느 쪽이 이길지는 CSS 순서가 정합니다. 화면에서는 "가끔 안 먹는"
 * 것처럼 보이고 원인을 찾기 매우 어렵습니다.
 *
 * cn.js 주석은 "tailwind.config.js 에 새 스케일을 추가하면 여기도 함께
 * 갱신하세요" 라고 적어두었지만, 주석은 지켜지지 않습니다. 그래서 프리셋에
 * 있는 모든 커스텀 값에 대해 **실제로 충돌이 해소되는지** 확인합니다.
 *
 * 목록을 서로 비교하지 않고 동작을 보는 이유: 표준 이름(xs, sm, lg …)은
 * tailwind-merge 가 이미 알고 있어서 등록할 필요가 없습니다. 목록 비교는
 * 그걸 구별하지 못해 가짜 실패를 냅니다.
 */
/* 기준값은 tailwind-merge 가 원래부터 아는 표준 클래스입니다. 커스텀 값이
   같은 그룹으로 등록돼 있으면 기준값과 충돌해서 하나만 남아야 합니다. */
const SCALES = [
  ['글자 크기', 'text-', 'text-2xl', Object.keys(preset.theme.fontSize)],
  ['높이', 'h-', 'h-full', Object.keys(preset.theme.extend.height)],
  ['너비', 'w-', 'w-full', Object.keys(preset.theme.extend.width)],
  ['최대 폭', 'max-w-', 'max-w-full', Object.keys(preset.theme.extend.maxWidth ?? {})],
]

for (const [label, prefix, baseline, keys] of SCALES) {
  test(`${label} — 프리셋의 모든 커스텀 값이 충돌 해소된다`, () => {
    assert.ok(keys.length >= 1, `${label} 스케일이 비어 있습니다`)
    for (const key of keys) {
      const custom = prefix + key
      /* 양방향으로 확인합니다. 한쪽만 되면 그룹 등록이 반쪽입니다. */
      assert.equal(
        cn(baseline, custom), custom,
        `cn('${baseline}', '${custom}') 가 뒤엣것만 남기지 않았습니다.\n` +
        `  → tailwind-preset.js 에 ${custom} 을 추가하고 src/lib/cn.js 의 ` +
        `classGroups 갱신을 빠뜨린 것 같습니다. 등록하지 않으면 두 클래스가 ` +
        `나란히 남고 승자를 CSS 순서가 정합니다 — 오류 없이 조용히 어긋납니다.`,
      )
      assert.equal(
        cn(custom, baseline), baseline,
        `cn('${custom}', '${baseline}') 가 뒤엣것만 남기지 않았습니다 (반대 방향).`,
      )
    }
  })
}

test('DEFAULT 키가 있어도 스케일 검사가 헛돌지 않는다', () => {
  /* fontSize 등에 DEFAULT 가 생기면 'text-DEFAULT' 라는 없는 클래스를
     비교하게 됩니다. 지금은 없다는 것을 못 박아둡니다. */
  for (const [label, , , keys] of SCALES) {
    assert.ok(!keys.includes('DEFAULT'), `${label} 에 DEFAULT 가 생겼습니다 — 검사 방식을 고치세요`)
  }
})
