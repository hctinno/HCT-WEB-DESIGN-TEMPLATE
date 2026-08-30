/**
 * 스타일이 실제로 적용되고 있는지 개발 모드에서 한 번 확인합니다.
 *
 * 왜 필요한가: 이 패키지를 설치한 앱이 Tailwind 의 `content` 에
 * `hctContent` 를 빼먹으면, node_modules 안의 컴포넌트가 스캔되지 않아
 * 우리 클래스가 통째로 purge 됩니다. 그러면 화면은 **오류 없이** 스타일만
 * 빠진 채로 그려집니다. 콘솔도 조용하고 빌드도 성공하므로 원인을 찾는 데
 * 한참 걸립니다 — 실제로 이 저장소에서 그렇게 한 번 깨뜨려 봤습니다.
 *
 * 그래서 눈에 보이지 않는 요소 하나를 잠깐 붙여 우리 클래스가 값을 만드는지
 * 재고, 아니면 **무엇을 고쳐야 하는지까지** 콘솔에 적습니다.
 *
 * 환경 판별을 하지 않는 이유: `import.meta.env.PROD` 로 개발 모드에서만 돌게
 * 했더니, 라이브러리 빌드 때 Vite 가 그 값을 `true` 로 **박아버려** 소비
 * 프로젝트에서는 영원히 조기 반환했습니다. 경고 장치가 조용히 죽어 있었던
 * 셈입니다. 어차피 이 클래스가 값을 못 만들면 운영에서도 화면이 깨진
 * 상태이므로, 환경을 가리지 않고 한 번 확인합니다.
 */

let checked = false

export function verifyStyles() {
  if (checked) return
  checked = true

  if (typeof document === 'undefined' || !document.body) return

  const probe = document.createElement('div')
  /* 앱 코드에는 거의 나오지 않고 우리 컴포넌트에만 있는 클래스로 고릅니다.
     앱이 우연히 같은 클래스를 써서 검사가 통과해 버리면 의미가 없습니다. */
  probe.className = 'h-control-md w-sidebar'
  probe.setAttribute('aria-hidden', 'true')
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.pointerEvents = 'none'
  document.body.appendChild(probe)

  const style = getComputedStyle(probe)
  const height = parseFloat(style.height)
  const width = parseFloat(style.width)
  document.body.removeChild(probe)

  /* h-control-md = 32px, w-sidebar = var(--layout-sidebar-width) = 240px.
     position:absolute 로 두었으므로 클래스가 없으면 둘 다 0 에 가깝습니다. */
  const ok = height >= 30 && width >= 200
  if (ok) return

  console.error(
    [
      '[HCT 디자인 시스템] 컴포넌트 스타일이 적용되지 않았습니다.',
      '',
      '확인할 것 두 가지:',
      '',
      '1) Tailwind 의 content 에 이 패키지가 들어 있습니까?',
      "     import hct, { hctContent } from 'hct-web-design-template/tailwind-preset'",
      '     export default {',
      '       presets: [hct],',
      "       content: [...hctContent, './index.html', './src/**/*.{js,jsx,ts,tsx}'],",
      '     }',
      '   Tailwind 는 프리셋의 content 를 병합하지 않습니다. 앱에서 직접 넣어야 합니다.',
      '',
      '2) 앱의 CSS 에 토큰을 불러왔습니까?',
      "     @import 'hct-web-design-template/styles/hct.css';",
      '     @tailwind base;',
      '     @tailwind components;',
      '     @tailwind utilities;',
      '',
      `측정값: h-control-md → ${height}px (기대 32), w-sidebar → ${width}px (기대 240)`,
    ].join('\n'),
  )
}
