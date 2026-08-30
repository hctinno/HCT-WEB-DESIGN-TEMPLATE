/**
 * 이 저장소의 Tailwind 설정.
 *
 * 토큰과 스케일은 tailwind-preset.js 에 있고 여기서는 그걸 물려받기만 합니다.
 * 프리셋을 우리도 똑같이 써야 — 프리셋이 깨지면 이 저장소의 미리보기가
 * 먼저 깨집니다. 소비 프로젝트가 먼저 발견하는 일이 없도록.
 */
import hct from './tailwind-preset.js'

/** @type {import('tailwindcss').Config} */
export default {
  presets: [hct],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
}
