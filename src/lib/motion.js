/**
 * 움직임 줄이기(prefers-reduced-motion) — JS 쪽.
 *
 * CSS 의 애니메이션 · 전환은 base.css 가 멈춥니다. 그러나 JS 로 부르는
 * `scrollIntoView({ behavior: 'smooth' })` · `scrollTo` 는 CSS 규칙이 닿지 않아
 * 설정을 켠 사용자에게도 부드럽게 미끄러집니다. 어지럼을 느끼는 사용자가
 * 켜는 설정이므로 JS 스크롤도 따라야 합니다(Apple HIG · WCAG 2.3.3).
 *
 *   el.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
 *
 * 디자인 린터(no-smooth-scroll)가 'smooth' 를 직접 쓰는 것을 막습니다.
 */
export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** 설정을 켰으면 'auto'(즉시), 아니면 'smooth' */
export function scrollBehavior() {
  return prefersReducedMotion() ? 'auto' : 'smooth'
}
