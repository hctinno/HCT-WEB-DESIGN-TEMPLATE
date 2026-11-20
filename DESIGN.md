# HCT 디자인 시스템 — DESIGN.md

이 파일 **하나만** 읽고 HCT 관리도구 화면을 만들 수 있게 쓴 명세입니다.
React · Vue · Svelte · 순수 HTML · 서버 템플릿 등 프레임워크와 무관합니다.

| | |
|---|---|
| 생성 | 저장소의 토큰과 컴포넌트 코드에서 자동으로 만듭니다 — 값을 손으로 고치지 마세요 |
| 팔레트 | `hct` — 로고색 강조 · 짙은 남색 사이드바 (제품 기본값) |
| 테마 | 라이트 · 다크 모두 포함 |
| 패키지 | `hct-web-design-template` v2.1.0 |
| 저장소 | https://github.com/hctinno/HCT-WEB-DESIGN-TEMPLATE |
| 이 파일 | https://raw.githubusercontent.com/hctinno/HCT-WEB-DESIGN-TEMPLATE/main/DESIGN.md |

> **React + Tailwind 로 만든다면 이 파일만 쓰지 말고 패키지를 설치하세요.**
> 표 · 필터 · 사이드바 · 차트 같은 완성된 부품과 디자인 규칙 검사기가 함께 옵니다.
>
> ```bash
> npm i github:hctinno/HCT-WEB-DESIGN-TEMPLATE#release/v2.1.0
> ```
>
> 이 파일은 그 패키지의 **겉모습**을 다른 환경에서 똑같이 재현하기 위한 명세입니다.
> 부품은 들어 있지 않습니다 — §10 참고.

---

## 0. 작업 순서 (에이전트용)

1. **§2-1 의 CSS 세 블록(토큰 → 접근성 적응 → 기본 레이어)을 앱 전역 CSS 맨 위에 순서대로 그대로 붙입니다.** 이것으로 색 · 그림자 · 치수 · 서체 · 한글 줄바꿈 · 포커스 링 · 대비 증가 · 터치 크기 · 움직임 줄이기가 패키지와 같아집니다.
2. 화면 코드에서 색 · 간격 · 그림자 · 서체는 **그 변수로만** 씁니다. `#RRGGBB` 나 프레임워크 기본 팔레트(`gray-100`, `blue-500` 등)를 직접 쓰지 않습니다.
3. 모든 화면은 **§6 앱 셸** 안에 넣습니다. 로고는 **§3 의 URL** 을 씁니다.
4. 부품은 **§7 규격**대로 만듭니다. 같은 부품을 화면마다 새로 만들지 말고, 한 번 만들어 재사용합니다.
5. 모든 화면에 **로딩 · 빈 상태 · 오류**를 함께 만듭니다 (§8).
6. 끝나면 **§9 점검표**로 확인합니다.

---

## 1. 원칙

1. **의미로 고른다.** 색은 "무엇에 쓰는가"(바탕 · 글자 · 테두리 · 상태)로 고릅니다. 변수 하나가 라이트 · 다크 값을 함께 가지므로 다크 모드용 스타일을 따로 쓰지 않습니다.
2. **상태 색은 고르지 않는다.** "진행중"이 화면마다 다른 색이면 사용자는 색으로 상태를 읽는 법을 배우지 못합니다. 워크플로 상태 이름 → 색조 표(§2-3)로만 정합니다.
3. **하루 종일 보는 화면이다.** 본문 14px, 4px 그리드(§5 허용값) 간격만 쓰는 고밀도 스케일입니다. 한 화면에 더 많은 정보가 들어가 스크롤과 맥락 전환이 줄어듭니다.
4. **셸은 하나다.** 모든 화면이 같은 사이드바 · 상단바 구조 안에 들어갑니다. 화면을 옮겨 다녀도 탐색 위치와 조작 방법이 그대로 남아야 합니다.

---

## 2. 토큰

### 2-1. 그대로 붙여 넣는 CSS

**① 토큰** — 색 · 그림자 · 치수 · 움직임 · 서체 변수. 라이트 · 다크 값이 모두 들어 있습니다.

```css
/* HCT 디자인 토큰 — 팔레트 hct · 생성 파일이므로 값을 고치지 마세요.
   화면 코드에서는 var(--…) 로만 참조합니다. */
:root {
  color-scheme: light;
  /* 바탕 */
  --color-bg-canvas:                #F7F9FC;
  --color-bg-surface:               #FFFFFF;
  --color-bg-raised:                #FFFFFF;
  --color-bg-sunken:                #EFF3F8;
  --color-bg-hover:                 #EFF3F8;
  --color-bg-active:                #E3E9F1;
  --color-bg-sidebar:               #F7F9FC;
  --color-bg-overlay:               rgb(9 30 66 / 0.42);

  /* 글자 */
  --color-text-primary:             #18202C;
  --color-text-secondary:           #445062;
  --color-text-tertiary:            #616D7E;
  --color-text-disabled:            #A7B3C4;
  --color-text-inverse:             #FFFFFF;
  --color-text-link:                #2F4A9C;

  /* 테두리 */
  --color-border-subtle:            #E3E9F1;
  --color-border-default:           #D0D9E5;
  --color-border-strong:            #A7B3C4;
  --color-border-focus:             #2F4A9C;

  /* 강조 */
  --color-accent-solid:             #2F4A9C;
  --color-accent-solid-hover:       #263C80;
  --color-accent-subtle:            #EFF2FA;
  --color-accent-subtle-hover:      #DCE3F4;
  --color-accent-text:              #263C80;
  --color-accent-border:            #BAC8E8;

  /* 상태 (색조 6개 × 바탕·테두리·글자·채움) */
  --color-success-bg:               #E7F7EE;
  --color-success-border:           #A7E3C0;
  --color-success-text:             #15803D;
  --color-success-solid:            #16A34A;
  --color-warning-bg:               #FEF5E0;
  --color-warning-border:           #F5D48A;
  --color-warning-text:             #B45309;
  --color-warning-solid:            #D97706;
  --color-danger-bg:                #FDECEC;
  --color-danger-border:            #F5B5B5;
  --color-danger-text:              #B91C1C;
  --color-danger-solid:             #DC2626;
  --color-info-bg:                  #EAF2FF;
  --color-info-border:              #B8D2FF;
  --color-info-text:                #1D4FD8;
  --color-info-solid:               #2563EB;
  --color-neutral-bg:               #EFF3F8;
  --color-neutral-border:           #D0D9E5;
  --color-neutral-text:             #445062;
  --color-neutral-solid:            #7C8899;
  --color-review-bg:                #F2EEFE;
  --color-review-border:            #CFC0F7;
  --color-review-text:              #6D28D9;
  --color-review-solid:             #7C3AED;

  /* 사이드바 전용 */
  --color-sidebar-bg:               #17264D;
  --color-sidebar-fg:               #EBEFF8;
  --color-sidebar-fg-muted:         #AAB7D2;
  --color-sidebar-fg-subtle:        #8494B4;
  --color-sidebar-hover:            #20325F;
  --color-sidebar-active-bg:        #2F4A9C;
  --color-sidebar-active-fg:        #FFFFFF;
  --color-sidebar-border:           #22355F;
  --color-sidebar-badge-bg:         #D02439;
  --color-sidebar-badge-fg:         #FFFFFF;
  --color-sidebar-rail-bg:          #101B39;

  /* 그림자 */
  --shadow-sm:                      0 1px 2px 0 rgb(9 30 66 / 0.08);
  --shadow-md:                      0 2px 8px -1px rgb(9 30 66 / 0.12), 0 0 1px rgb(9 30 66 / 0.10);
  --shadow-lg:                      0 8px 24px -4px rgb(9 30 66 / 0.16), 0 0 1px rgb(9 30 66 / 0.10);
  --shadow-overlay:                 0 16px 48px -8px rgb(9 30 66 / 0.24);

  /* 레이아웃 */
  --layout-sidebar-width:           240px;
  --layout-sidebar-collapsed-width: 56px;
  --layout-rail-width:              56px;
  --layout-topbar-height:           48px;
  --layout-right-panel-width:       360px;
  --layout-right-panel-wide-width:  480px;
  --layout-content-max-width:       1440px;
  --layout-page-padding-x:          24px;
  --layout-page-padding-y:          20px;

  /* 컨트롤 · 표 행 높이 */
  --control-height-xs:              24px;
  --control-height-sm:              28px;
  --control-height-md:              32px;
  --control-height-lg:              36px;
  --row-height-compact:             32px;
  --row-height-default:             40px;
  --row-height-relaxed:             48px;

  /* 움직임 */
  --duration-instant:               80ms;
  --duration-fast:                  120ms;
  --duration-normal:                180ms;
  --duration-slow:                  260ms;
  --easing-standard:                cubic-bezier(0.2, 0, 0, 1);
  --easing-enter:                   cubic-bezier(0, 0, 0.2, 1);
  --easing-exit:                    cubic-bezier(0.4, 0, 1, 1);

  /* 차트 */
  --chart-1:                        #2E5FD0;
  --chart-2:                        #CC6D0C;
  --chart-3:                        #00907A;
  --chart-4:                        #7A5AD8;
  --chart-5:                        #C94FA8;
  --chart-6:                        #A07B0E;
  --chart-grid:                     #E3E9F1;
  --chart-axis:                     #D0D9E5;
  --chart-seq-1:                    #E9F0FB;
  --chart-seq-2:                    #C6D8F4;
  --chart-seq-3:                    #96B4E9;
  --chart-seq-4:                    #5A88D8;
  --chart-seq-5:                    #2E5FD0;
  --chart-seq-fg:                   #0F1419;
  --chart-seq-fg-strong:            #FFFFFF;

  /* 서체 */
  --font-sans:                      "Pretendard Variable", Pretendard, -apple-system,
      BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue",
      "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic",
      sans-serif;
  --font-mono:                      "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas,
      "Liberation Mono", monospace;
}

/* 다크 — 운영체제 설정을 따릅니다. data-theme="light" 로 고정한 경우는 제외 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    /* 바탕 */
    --color-bg-canvas:           #0B0F16;
    --color-bg-surface:          #131922;
    --color-bg-raised:           #1B222D;
    --color-bg-sunken:           #0E131A;
    --color-bg-hover:            #1B222D;
    --color-bg-active:           #232B37;
    --color-bg-sidebar:          #0D1520;
    --color-bg-overlay:          rgb(0 0 0 / 0.64);

    /* 글자 */
    --color-text-primary:        #E6EBF2;
    --color-text-secondary:      #A5B0BF;
    --color-text-tertiary:       #7D8896;
    --color-text-disabled:       #525C69;
    --color-text-inverse:        #0B0F16;
    --color-text-link:           #8EA4D5;

    /* 테두리 */
    --color-border-subtle:       #1F2733;
    --color-border-default:      #2B3542;
    --color-border-strong:       #45505F;
    --color-border-focus:        #5D79BE;

    /* 강조 */
    --color-accent-solid:        #5D79BE;
    --color-accent-solid-hover:  #8EA4D5;
    --color-accent-subtle:       #141F3A;
    --color-accent-subtle-hover: #1A2949;
    --color-accent-text:         #8EA4D5;
    --color-accent-border:       #1F3166;

    /* 상태 (색조 6개 × 바탕·테두리·글자·채움) */
    --color-success-bg:          #0F2E1E;
    --color-success-border:      #166534;
    --color-success-text:        #4ADE80;
    --color-warning-bg:          #33230A;
    --color-warning-border:      #92400E;
    --color-warning-text:        #FBBF24;
    --color-danger-bg:           #3A1516;
    --color-danger-border:       #991B1B;
    --color-danger-text:         #F87171;
    --color-info-bg:             #12233F;
    --color-info-border:         #1E40AF;
    --color-info-text:           #7CA9FF;
    --color-neutral-bg:          #1E2228;
    --color-neutral-border:      #2E333B;
    --color-neutral-text:        #A9B0BA;
    --color-neutral-solid:       #646B77;
    --color-review-bg:           #241640;
    --color-review-border:       #5B21B6;
    --color-review-text:         #B292FA;

    /* 사이드바 전용 */
    --color-sidebar-bg:          #0D1520;
    --color-sidebar-fg:          #E6EBF2;
    --color-sidebar-fg-muted:    #A5B0BF;
    --color-sidebar-fg-subtle:   #7D8896;
    --color-sidebar-hover:       #17202D;
    --color-sidebar-active-bg:   #3E5BA9;
    --color-sidebar-border:      #1C2634;
    --color-sidebar-rail-bg:     #080D15;

    /* 그림자 */
    --shadow-sm:                 0 1px 2px 0 rgb(0 0 0 / 0.4);
    --shadow-md:                 0 2px 8px -1px rgb(0 0 0 / 0.5);
    --shadow-lg:                 0 8px 24px -4px rgb(0 0 0 / 0.6);
    --shadow-overlay:            0 16px 48px -8px rgb(0 0 0 / 0.7);

    /* 차트 */
    --chart-1:                   #5B8CF5;
    --chart-2:                   #CE7418;
    --chart-3:                   #0FA184;
    --chart-4:                   #9478F5;
    --chart-5:                   #D2519F;
    --chart-6:                   #9E7B0A;
    --chart-grid:                #1F2733;
    --chart-axis:                #2B3542;
    --chart-seq-1:               #1B2A44;
    --chart-seq-2:               #243A62;
    --chart-seq-3:               #2F5289;
    --chart-seq-4:               #39619F;
    --chart-seq-5:               #5B8CF5;
    --chart-seq-fg:              #E6EAF0;
    --chart-seq-fg-strong:       #0F1419;
  }
}

/* 다크 — <html data-theme="dark"> 로 강제 */
:root[data-theme="dark"] {
  color-scheme: dark;
  /* 바탕 */
  --color-bg-canvas:           #0B0F16;
  --color-bg-surface:          #131922;
  --color-bg-raised:           #1B222D;
  --color-bg-sunken:           #0E131A;
  --color-bg-hover:            #1B222D;
  --color-bg-active:           #232B37;
  --color-bg-sidebar:          #0D1520;
  --color-bg-overlay:          rgb(0 0 0 / 0.64);

  /* 글자 */
  --color-text-primary:        #E6EBF2;
  --color-text-secondary:      #A5B0BF;
  --color-text-tertiary:       #7D8896;
  --color-text-disabled:       #525C69;
  --color-text-inverse:        #0B0F16;
  --color-text-link:           #8EA4D5;

  /* 테두리 */
  --color-border-subtle:       #1F2733;
  --color-border-default:      #2B3542;
  --color-border-strong:       #45505F;
  --color-border-focus:        #5D79BE;

  /* 강조 */
  --color-accent-solid:        #5D79BE;
  --color-accent-solid-hover:  #8EA4D5;
  --color-accent-subtle:       #141F3A;
  --color-accent-subtle-hover: #1A2949;
  --color-accent-text:         #8EA4D5;
  --color-accent-border:       #1F3166;

  /* 상태 (색조 6개 × 바탕·테두리·글자·채움) */
  --color-success-bg:          #0F2E1E;
  --color-success-border:      #166534;
  --color-success-text:        #4ADE80;
  --color-warning-bg:          #33230A;
  --color-warning-border:      #92400E;
  --color-warning-text:        #FBBF24;
  --color-danger-bg:           #3A1516;
  --color-danger-border:       #991B1B;
  --color-danger-text:         #F87171;
  --color-info-bg:             #12233F;
  --color-info-border:         #1E40AF;
  --color-info-text:           #7CA9FF;
  --color-neutral-bg:          #1E2228;
  --color-neutral-border:      #2E333B;
  --color-neutral-text:        #A9B0BA;
  --color-neutral-solid:       #646B77;
  --color-review-bg:           #241640;
  --color-review-border:       #5B21B6;
  --color-review-text:         #B292FA;

  /* 사이드바 전용 */
  --color-sidebar-bg:          #0D1520;
  --color-sidebar-fg:          #E6EBF2;
  --color-sidebar-fg-muted:    #A5B0BF;
  --color-sidebar-fg-subtle:   #7D8896;
  --color-sidebar-hover:       #17202D;
  --color-sidebar-active-bg:   #3E5BA9;
  --color-sidebar-border:      #1C2634;
  --color-sidebar-rail-bg:     #080D15;

  /* 그림자 */
  --shadow-sm:                 0 1px 2px 0 rgb(0 0 0 / 0.4);
  --shadow-md:                 0 2px 8px -1px rgb(0 0 0 / 0.5);
  --shadow-lg:                 0 8px 24px -4px rgb(0 0 0 / 0.6);
  --shadow-overlay:            0 16px 48px -8px rgb(0 0 0 / 0.7);

  /* 차트 */
  --chart-1:                   #5B8CF5;
  --chart-2:                   #CE7418;
  --chart-3:                   #0FA184;
  --chart-4:                   #9478F5;
  --chart-5:                   #D2519F;
  --chart-6:                   #9E7B0A;
  --chart-grid:                #1F2733;
  --chart-axis:                #2B3542;
  --chart-seq-1:               #1B2A44;
  --chart-seq-2:               #243A62;
  --chart-seq-3:               #2F5289;
  --chart-seq-4:               #39619F;
  --chart-seq-5:               #5B8CF5;
  --chart-seq-fg:              #E6EAF0;
  --chart-seq-fg-strong:       #0F1419;
}
```

**② 접근성 적응** — 패키지의 `src/styles/adaptive.css` 원문입니다. 사용자가 운영체제에서 켠 설정에만 반응하고, 아무것도 켜지 않은 기본 화면에서는 한 값도 바꾸지 않습니다. ① 바로 뒤에 붙입니다 — 선택자 명시도가 ① 의 다크 블록과 같아서 뒤에 와야 이깁니다.

- **대비 증가**(`prefers-contrast: more` — macOS · iOS "대비 증가", Windows 대비 테마 일부): 보조 글자 · 테두리 · 강조색을 진하게 바꿔 글자 7:1 · 테두리 · 포커스 3:1 이상으로 올립니다. `<html data-contrast="normal">` 이면 끕니다.
- **손가락 입력**(`pointer: coarse` — 휴대폰 · 태블릿): 컨트롤과 촘촘 · 기본 표 행 높이를 44px 로 올립니다 (Apple HIG 최소 44×44pt). 마우스 화면의 고밀도는 그대로입니다.

```css
/* ============================================================================
   HCT 접근성 적응 — 자동 생성 파일 (직접 수정하지 마세요)
   ----------------------------------------------------------------------------
   원본: tokens/palettes.json 의 hct.contrastMore · scripts/build-adaptive.mjs
   생성: npm run tokens:build

   사용자가 운영체제에서 켠 설정에만 반응합니다. 아무것도 켜지 않은 기본
   화면(대비 보통 · 마우스 · 움직임 허용)에서는 한 값도 바꾸지 않습니다.

     ① 대비 증가   prefers-contrast: more  글자 7:1 · 테두리 · 포커스 3:1 이상
     ② 손가락 입력 pointer: coarse         누르는 칸 44px 이상 (Apple HIG 44×44pt)

   움직임 줄이기는 base.css, 사용자 글자 크기는 rem 타입 스케일이 맡습니다.
   <html data-contrast="normal"> 을 붙이면 ① 을 끕니다 (화면 비교 · 인쇄용).

   반드시 tokens.css · palettes.css 다음에 불러옵니다 — 선택자 명시도가
   팔레트 다크 블록과 같아서, 뒤에 와야 이깁니다.
   ============================================================================ */

/* ① 대비 증가 — 라이트 테마 */
@media (prefers-contrast: more) {
  :root:not([data-theme="dark"]):not([data-contrast="normal"]) {
    --color-text-secondary: #2E3847;
    --color-text-tertiary: #445062;
    --color-text-disabled: #616D7E;
    --color-text-link: #263C80;
    --color-border-subtle: #A7B3C4;
    --color-border-default: #616D7E;
    --color-border-strong: #445062;
    --color-border-focus: #1F3166;
    --color-accent-solid: #263C80;
    --color-accent-solid-hover: #1F3166;
    --color-accent-text: #1F3166;
    --color-accent-border: #5D79BE;
    --color-success-text: #14532D;
    --color-warning-text: #78350F;
    --color-danger-text: #7F1D1D;
    --color-info-text: #1E3A8A;
    --color-review-text: #4C1D95;
    --color-neutral-text: #2E3847;
    --color-sidebar-fg-muted: #D3DBEC;
    --color-sidebar-fg-subtle: #AAB7D2;
  }
}

/* ① 대비 증가 — 운영체제 다크 (data-theme="light" 로 고정한 경우 제외) */
@media (prefers-contrast: more) and (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not([data-contrast="normal"]) {
    --color-text-primary: #F5F7FA;
    --color-text-secondary: #C9D1DC;
    --color-text-tertiary: #A5B0BF;
    --color-text-disabled: #7D8896;
    --color-text-link: #BAC8E8;
    --color-border-subtle: #45505F;
    --color-border-default: #6B7685;
    --color-border-strong: #8A95A4;
    --color-border-focus: #BAC8E8;
    --color-accent-solid: #8EA4D5;
    --color-accent-solid-hover: #BAC8E8;
    --color-accent-text: #BAC8E8;
    --color-accent-border: #5D79BE;
    --color-success-text: #86EFAC;
    --color-warning-text: #FDE68A;
    --color-danger-text: #FCA5A5;
    --color-info-text: #BFD4FF;
    --color-review-text: #DDD0FE;
    --color-neutral-text: #C9D1DC;
    --color-sidebar-fg-muted: #C9D1DC;
    --color-sidebar-fg-subtle: #A5B0BF;
  }
}

/* ① 대비 증가 — <html data-theme="dark"> 로 강제한 다크 */
@media (prefers-contrast: more) {
  :root[data-theme="dark"]:not([data-contrast="normal"]) {
    --color-text-primary: #F5F7FA;
    --color-text-secondary: #C9D1DC;
    --color-text-tertiary: #A5B0BF;
    --color-text-disabled: #7D8896;
    --color-text-link: #BAC8E8;
    --color-border-subtle: #45505F;
    --color-border-default: #6B7685;
    --color-border-strong: #8A95A4;
    --color-border-focus: #BAC8E8;
    --color-accent-solid: #8EA4D5;
    --color-accent-solid-hover: #BAC8E8;
    --color-accent-text: #BAC8E8;
    --color-accent-border: #5D79BE;
    --color-success-text: #86EFAC;
    --color-warning-text: #FDE68A;
    --color-danger-text: #FCA5A5;
    --color-info-text: #BFD4FF;
    --color-review-text: #DDD0FE;
    --color-neutral-text: #C9D1DC;
    --color-sidebar-fg-muted: #C9D1DC;
    --color-sidebar-fg-subtle: #A5B0BF;
  }
}

/* ② 손가락 입력 — 주 입력 장치가 거친 포인터(터치)일 때 */
@media (pointer: coarse) {
  :root {
    --control-height-xs: 44px;
    --control-height-sm: 44px;
    --control-height-md: 44px;
    --control-height-lg: 44px;
    --row-height-compact: 44px;
    --row-height-default: 44px;
  }
}
```

**③ 기본 레이어** — 패키지의 `src/styles/base.css` 원문입니다. 한글 줄바꿈(`keep-all`) · 포커스 링 · 고정폭 숫자(`.tabular`) · 얇은 스크롤바(`.scroll-thin`) · 동작 줄이기를 정합니다. `@layer base` 안에 있어 화면 코드의 스타일이 항상 이깁니다.

```css
/*
 * 토큰 위에 얹는 기본 레이어 — 리셋, 포커스 링, 숫자 정렬, 스크롤바.
 *
 * Tailwind 지시어(@tailwind)는 여기 없습니다. 소비하는 앱이 자기 Tailwind 로
 * 처리해야 하므로, 이 파일은 **토큰과 레이어만** 담습니다.
 */
@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    border-color: var(--color-border-default);
  }

  html {
    -webkit-text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    margin: 0;
    font-family: var(--font-sans);
    /* rem — 사용자가 키운 글자 크기를 따릅니다 (기본 16px 에서 14 / 20px) */
    font-size: 0.875rem;
    line-height: 1.25rem;
    background-color: var(--color-bg-canvas);
    color: var(--color-text-primary);
    font-feature-settings: 'tnum' 0;

    /*
     * 한글 줄바꿈. 기본값(break-word)은 어절 한가운데를 끊습니다 —
     * "저장이" 가 "저 / 장이" 로 잘리면 읽는 속도가 눈에 띄게 떨어집니다.
     * keep-all 은 공백에서만 끊으므로 어절이 보존됩니다.
     *
     * 대신 긴 영문 토큰(URL·요청 ID)은 넘칠 수 있으므로, 그런 값을 담는
     * 곳에는 overflow-wrap 을 따로 줍니다 (아래 .break-token).
     */
    word-break: keep-all;
    overflow-wrap: break-word;
  }

  /* URL·ID·토큰처럼 공백이 없는 긴 문자열 전용 */
  .break-token {
    word-break: break-all;
  }

  /* 포커스 링 — 접근성 필수. 절대 outline:none 으로 지우지 마세요. */
  :focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 1px;
    border-radius: 3px;
  }

  /* 숫자 정렬 — 테이블·KPI에서 자릿수가 흔들리지 않도록 */
  .tabular,
  table td.numeric,
  table th.numeric {
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum' 1;
  }

  /* 스크롤바 — 관리도구는 스크롤 영역이 많아 기본 스크롤바가 거슬립니다 */
  .scroll-thin {
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-strong) transparent;
  }
  .scroll-thin::-webkit-scrollbar { width: 10px; height: 10px; }
  .scroll-thin::-webkit-scrollbar-track { background: transparent; }
  .scroll-thin::-webkit-scrollbar-thumb {
    background-color: var(--color-border-strong);
    border-radius: 9999px;
    border: 3px solid transparent;
    background-clip: content-box;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}

@layer components {
  /* 스크린리더 전용 — 아이콘 버튼에 반드시 동반 */
  .sr-only-focusable:not(:focus):not(:focus-within) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
}
```

- 다크 모드: `<html data-theme="dark">` 로 강제합니다. 속성이 없으면 운영체제 설정을 따르고, `data-theme="light"` 는 운영체제가 다크여도 라이트로 고정합니다.
- JS 에서 색이 필요할 때(차트 등)만 `getComputedStyle(document.documentElement).getPropertyValue('--color-accent-solid')` 로 읽습니다.

### 2-2. 토큰의 용도

**바탕**

| 변수 | 용도 | 라이트 | 다크 |
|---|---|---|---|
| `--color-bg-canvas` | 페이지 맨 아래 바탕 | `#F7F9FC` | `#0B0F16` |
| `--color-bg-surface` | 카드 · 패널 · 표 본문 · 입력 | `#FFFFFF` | `#131922` |
| `--color-bg-raised` | 떠 있는 것 — 드롭다운 · 팝오버 · 툴팁 · 모달 · 명령 팔레트 · 기본 토스트 | `#FFFFFF` | `#1B222D` |
| `--color-bg-sunken` | 표 머리행 · 묶음 머리행 · 비활성 입력 · 읽기 전용 값 칸 · 상단바 검색 칸 · 세그먼트 바탕 · 스켈레톤 (일반 입력은 `bg-surface`) | `#EFF3F8` | `#0E131A` |
| `--color-bg-hover` | 마우스를 올린 상태 | `#EFF3F8` | `#1B222D` |
| `--color-bg-active` | 상세가 열린 행 | `#E3E9F1` | `#232B37` |
| `--color-bg-sidebar` | 셸의 사이드바 칸 바탕 (그 위를 `sidebar-bg` 로 칠함) | `#F7F9FC` | `#0D1520` |
| `--color-bg-overlay` | 모달 · 서랍 · 명령 팔레트 · 1024px 미만 사이드바 서랍 뒤를 덮는 막 | `rgb(9 30 66 / 0.42)` | `rgb(0 0 0 / 0.64)` |

**글자** — 한 화면에서 3단계를 넘게 섞지 않습니다. 위계가 많아지면 위계가 사라집니다.

| 변수 | 용도 | 라이트 | 다크 |
|---|---|---|---|
| `--color-text-primary` | 본문 · 제목 | `#18202C` | `#E6EBF2` |
| `--color-text-secondary` | 입력 · 폼 라벨 · 표 머리행 · ghost 버튼 글자 | `#445062` | `#A5B0BF` |
| `--color-text-tertiary` | 설명문 · 메타 정보 · 지표 타일 라벨 · 안내문(placeholder) | `#616D7E` | `#7D8896` |
| `--color-text-disabled` | 비활성 | `#A7B3C4` | `#525C69` |
| `--color-text-inverse` | 진한 바탕(주 버튼 · 위험 버튼) 위 글자 | `#FFFFFF` | `#0B0F16` |
| `--color-text-link` | 링크 | `#2F4A9C` | `#8EA4D5` |

**테두리**

| 변수 | 용도 | 라이트 | 다크 |
|---|---|---|---|
| `--color-border-subtle` | 카드 · 위젯 · 지표 타일 · 모달 · 서랍 테두리, 표 행 구분, 셸 구분선 | `#E3E9F1` | `#1F2733` |
| `--color-border-default` | 입력 · 버튼 · 드롭다운 · 툴팁 · 토스트 테두리, 표 머리행 아래 | `#D0D9E5` | `#2B3542` |
| `--color-border-strong` | 누를 수 있는 지표 타일 hover · 꺼진 스위치 · 스크롤바 손잡이 | `#A7B3C4` | `#45505F` |
| `--color-border-focus` | 포커스 링 · 입력 포커스 | `#2F4A9C` | `#5D79BE` |

**강조** — 회사 로고색 `#2F4A9C` 입니다.

| 변수 | 용도 | 라이트 | 다크 |
|---|---|---|---|
| `--color-accent-solid` | 주 버튼 · 강조 채움 | `#2F4A9C` | `#5D79BE` |
| `--color-accent-solid-hover` | 주 버튼 hover | `#263C80` | `#8EA4D5` |
| `--color-accent-subtle` | 선택된 행 · 옅은 강조 바탕 | `#EFF2FA` | `#141F3A` |
| `--color-accent-subtle-hover` | (정의만 있음 — 현재 부품에서 쓰지 않음) | `#DCE3F4` | `#1A2949` |
| `--color-accent-text` | 강조 글자 | `#263C80` | `#8EA4D5` |
| `--color-accent-border` | 강조 테두리 | `#BAC8E8` | `#1F3166` |

**사이드바 전용** — `hct` 팔레트는 **라이트 테마에서도 사이드바가 어둡습니다.** 사이드바 안에서 본문용 글자 변수(`--color-text-*`)를 쓰면 어두운 바탕에 묻혀 사라지므로, 사이드바 안에서는 이 변수만 씁니다. 예외는 강조 채움 하나뿐입니다 — 레일의 현재 타일 · 사용자 머리글자 상자 · 마크 타일은 `accent-solid` + `text-inverse`.

| 변수 | 용도 | 라이트 | 다크 |
|---|---|---|---|
| `--color-sidebar-bg` | 사이드바 바탕 | `#17264D` | `#0D1520` |
| `--color-sidebar-fg` | 사이드바 진한 글자 (hover · 안 읽음 · 사용자 이름) | `#EBEFF8` | `#E6EBF2` |
| `--color-sidebar-fg-muted` | 사이드바 기본 항목 글자 | `#AAB7D2` | `#A5B0BF` |
| `--color-sidebar-fg-subtle` | 그룹 라벨 · 중립 건수 · 보조 글자 | `#8494B4` | `#7D8896` |
| `--color-sidebar-hover` | 사이드바 항목 hover · 레일의 나머지 타일 | `#20325F` | `#17202D` |
| `--color-sidebar-active-bg` | 현재 화면 항목 바탕 | `#2F4A9C` | `#3E5BA9` |
| `--color-sidebar-active-fg` | 현재 화면 항목 글자 | `#FFFFFF` | 같음 |
| `--color-sidebar-border` | 사이드바 구분선 (머리 아래 · 바닥 위 · 레일 오른쪽) | `#22355F` | `#1C2634` |
| `--color-sidebar-badge-bg` | 나를 부른 수(멘션) 배지 바탕 | `#D02439` | 같음 |
| `--color-sidebar-badge-fg` | 멘션 배지 글자 | `#FFFFFF` | 같음 |
| `--color-sidebar-rail-bg` | 워크스페이스 레일 바탕 | `#101B39` | `#080D15` |

### 2-3. 상태 색 — 6개 색조로 고정

상태는 **이름으로 색이 정해집니다.** 화면에서 색을 고르지 말고 아래 표를 따릅니다. 새 상태가 필요하면 새 색을 만들지 말고 6개 색조 중 하나에 연결합니다.

| 상태 이름 | 색조 | 기본 라벨 |
|---|---|---|
| `todo` | 회색 (neutral) | 대기 |
| `inProgress` | 파랑 (info) | 진행중 |
| `inReview` | 보라 (review) | 검토중 |
| `blocked` | 빨강 (danger) | 차단됨 |
| `done` | 초록 (success) | 완료 |
| `warning` | 주황 (warning) | 주의 |
| `failed` | 빨강 (danger) | 실패 |
| `active` | 초록 (success) | 활성 |
| `inactive` | 회색 (neutral) | 비활성 |
| `pending` | 주황 (warning) | 보류 |

색조별 값 (라이트 / 다크):

| 색조 | 쓰는 상태 | 바탕 `bg` | 테두리 `border` | 글자 `text` | 채움 `solid` |
|---|---|---|---|---|---|
| 회색 `neutral` | 대기 · 비활성 | `#EFF3F8` / `#1E2228` | `#D0D9E5` / `#2E333B` | `#445062` / `#A9B0BA` | `#7C8899` / `#646B77` |
| 파랑 `info` | 진행중 | `#EAF2FF` / `#12233F` | `#B8D2FF` / `#1E40AF` | `#1D4FD8` / `#7CA9FF` | `#2563EB` / `#2563EB` |
| 보라 `review` | 검토중 | `#F2EEFE` / `#241640` | `#CFC0F7` / `#5B21B6` | `#6D28D9` / `#B292FA` | `#7C3AED` / `#7C3AED` |
| 초록 `success` | 완료 · 활성 | `#E7F7EE` / `#0F2E1E` | `#A7E3C0` / `#166534` | `#15803D` / `#4ADE80` | `#16A34A` / `#16A34A` |
| 주황 `warning` | 주의 · 보류 | `#FEF5E0` / `#33230A` | `#F5D48A` / `#92400E` | `#B45309` / `#FBBF24` | `#D97706` / `#D97706` |
| 빨강 `danger` | 차단됨 · 실패 | `#FDECEC` / `#3A1516` | `#F5B5B5` / `#991B1B` | `#B91C1C` / `#F87171` | `#DC2626` / `#DC2626` |

- 상태는 **색만으로 전달하지 않습니다.** 항상 글자 라벨이 함께 있습니다(색각 이상 대응).
- 상태가 아닌 계열에 상태 색을 쓰지 않습니다. 차트에서 초록이 "성공"이 아니라 "3번 계열"을 뜻하면 의미 체계가 무너집니다 — 일반 계열은 §2-4 를 씁니다.
- 반대로 **상태별 건수를 그리는 차트**는 위 색조의 `solid` 를 씁니다(대기 = `neutral-solid`, 진행중 = `info-solid` …). 배지와 차트의 색이 같아야 합니다.

### 2-4. 차트 색

| 변수 | 용도 | 라이트 | 다크 |
|---|---|---|---|
| `--chart-1` | 계열 1번 | `#2E5FD0` | `#5B8CF5` |
| `--chart-2` | 계열 2번 | `#CC6D0C` | `#CE7418` |
| `--chart-3` | 계열 3번 | `#00907A` | `#0FA184` |
| `--chart-4` | 계열 4번 | `#7A5AD8` | `#9478F5` |
| `--chart-5` | 계열 5번 | `#C94FA8` | `#D2519F` |
| `--chart-6` | 계열 6번 | `#A07B0E` | `#9E7B0A` |
| `--chart-grid` | 눈금선 | `#E3E9F1` | `#1F2733` |
| `--chart-axis` | 축선 | `#D0D9E5` | `#2B3542` |
| `--chart-seq-1` | 순차형 1단계 (가장 옅음) | `#E9F0FB` | `#1B2A44` |
| `--chart-seq-2` | 순차형 2단계 | `#C6D8F4` | `#243A62` |
| `--chart-seq-3` | 순차형 3단계 | `#96B4E9` | `#2F5289` |
| `--chart-seq-4` | 순차형 4단계 | `#5A88D8` | `#39619F` |
| `--chart-seq-5` | 순차형 5단계 (가장 진함) | `#2E5FD0` | `#5B8CF5` |
| `--chart-seq-fg` | 순차형 칸 위 글자 (1~4단계) | `#0F1419` | `#E6EAF0` |
| `--chart-seq-fg-strong` | 순차형 칸 위 글자 (가장 진한 단계) | `#FFFFFF` | `#0F1419` |

- 계열 색은 **1번부터 고정 순서로만** 배정합니다. 순환시키지 않습니다 — 7번째 계열부터는 새 색을 만들지 말고 "기타"로 묶습니다.
- 선 그래프는 색만으로 계열을 구분하지 않습니다. 계열 1~6 의 선 모양(SVG `stroke-dasharray`)을 실선 · `8 4` · `2 3` · `12 4 2 4` · `4 4` · `18 5` 로 함께 바꾸고, 범례에도 같은 모양을 보여줍니다. 접어 묶은 "기타"는 `neutral-solid` + `1 5`.
- 순차형(`seq-1`~`seq-5`)은 "얼마나 많은가"를 진하기로 보여주는 히트맵용입니다. 칸에는 항상 숫자를 함께 찍고, 가장 진한 단계에서만 글자색을 `seq-fg-strong` 으로 뒤집습니다.

---

## 3. 로고

**대표 로고는 예외 없이 씁니다.** 사이드바 · 로그인 화면은 물론, 사이드바가 없는 결과물(랜딩 페이지 · 시안 등)도 직접 만든 글자나 플레이스홀더로 대신하지 않고 아래 파일을 씁니다.

| 파일 | 놓이는 면 | 원본 크기 | URL |
|---|---|---|---|
| `hct-logo-color.png` | 밝은 면 | 264×86 | https://raw.githubusercontent.com/hctinno/HCT-WEB-DESIGN-TEMPLATE/main/src/assets/brand/hct-logo-color.png |
| `hct-logo-white.png` | 어두운 면 (사이드바) | 264×86 | https://raw.githubusercontent.com/hctinno/HCT-WEB-DESIGN-TEMPLATE/main/src/assets/brand/hct-logo-white.png |
| `hct-mark-color.png` | 밝은 면 · 좁은 자리 | 96×64 | https://raw.githubusercontent.com/hctinno/HCT-WEB-DESIGN-TEMPLATE/main/src/assets/brand/hct-mark-color.png |
| `hct-mark-white.png` | 어두운 면 · 좁은 자리 | 96×64 | https://raw.githubusercontent.com/hctinno/HCT-WEB-DESIGN-TEMPLATE/main/src/assets/brand/hct-mark-white.png |

- **면의 밝기로 고릅니다.** 테마가 아니라 로고가 놓이는 바탕의 밝기입니다. 로고 원색 `#2F4A9C` 는 어두운 바탕에서 거의 보이지 않으므로, 어두운 면에는 흰색판을 씁니다.
- `hct` 팔레트의 사이드바는 라이트 테마에서도 어두우므로, **사이드바 안에서는 항상 흰색판**을 씁니다.
- **높이만 지정**하고 폭은 비율대로 둡니다. 늘리거나 찌그러뜨리지 않습니다. 실제 사용 높이: 사이드바 상단 22px · 로그인 화면 40px · 셸 밖 오류 화면 24px.
- 회사 로고가 들어갈 **좁은 자리**(접힌 사이드바의 머리 등)에는 가로 로고를 줄이지 말고 **마크**를 씁니다. 워크스페이스 레일의 타일은 회사 로고가 아니라 각 워크스페이스 이름의 첫 글자입니다(§7 사이드바). 로고 자체에서 오려낸 "H" 입니다. 정사각 타일 안에 놓습니다 — 어두운 면: 타일 `--color-accent-solid` + 흰색 마크 / 밝은 면: 타일 `--color-accent-subtle` + 컬러 마크. 타일 모서리 8px, 안쪽 여백은 한 변의 16%.
- 타이핑한 "HCT" 나 "H" 글자로 대신하지 않습니다. 로고의 기울어진 획과 다른 서체의 글자는 같은 브랜드로 읽히지 않습니다.
- 원본이 래스터(PNG)라 화면 표시에는 충분하지만 인쇄 · 대형 확대에는 부족합니다.
- URL 은 저장소의 `main` 브랜치를 가리킵니다. 앱에는 내려받아 앱 자산으로 넣으세요 — 외부 주소에 기대면 저장소 사정(비공개 전환 · 경로 변경)으로 로고만 깨집니다.

---

## 4. 타이포그래피

```css
font-family: var(--font-sans);   /* 본문 · 제목 */
font-family: var(--font-mono);   /* 코드 · ID · 키 */
```

- `--font-sans` = "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif
- `--font-mono` = "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace
- **한글 줄바꿈은 어절 단위**(`word-break: keep-all`, ③ 기본 레이어에 포함)입니다. 공백 없는 긴 URL · ID 를 담는 곳에만 `.break-token`(`break-all`)을 씁니다.
- **서체 파일은 포함돼 있지 않습니다.** Pretendard 가 설치되지 않은 PC 에서는 목록의 다음 서체(운영체제 기본 한글 서체)로 표시되며, 패키지로 만든 화면도 똑같습니다. 웹폰트를 따로 불러온다면 모든 화면에 똑같이 적용하세요 — 일부 화면만 다르면 같은 제품으로 보이지 않습니다.

**크기 — 본문 14px 고밀도 스케일 · rem 단위**

| 이름 | 크기 / 행간 (rem) | 기본 16px 에서 | 용도 |
|---|---|---|---|
| micro | `0.6875rem` / `0.875rem` | 11 / 14px | 타임스탬프 · 사이드바 그룹 라벨 · 작은 배지 |
| xs | `0.75rem` / `1rem` | 12 / 16px | 배지 · 캡션 · 입력 라벨 · 표 머리행 |
| sm | `0.8125rem` / `1.125rem` | 13 / 18px | 사이드바 항목 · 설명문 · 경로 · 교차표 셀 |
| base | `0.875rem` / `1.25rem` | 14 / 20px | **기본 본문** · 버튼 · 입력 · 표 본문 셀 |
| md | `1rem` / `1.5rem` | 16 / 24px | 섹션 제목 |
| lg | `1.25rem` / `1.75rem` | 20 / 28px | 페이지 제목 |
| xl | `1.5rem` / `2rem` | 24 / 32px | 화면 제목 |
| metric | `1.75rem` / `2.125rem` · 자간 -0.01em | 28 / 34px | KPI 수치 |
| metric-lg | `2.125rem` / `2.5rem` · 자간 -0.02em | 34 / 40px | 강조 KPI 수치 |

- **크기 · 행간은 rem 으로 씁니다.** 브라우저 기본(16px)에서는 오른쪽 px 와 똑같이 그려지고, 사용자가 브라우저 · 운영체제에서 글자를 키우면 함께 커집니다(Apple HIG 의 Dynamic Type · WCAG 1.4.4). `font-size: 14px` 처럼 px 로 고정하면 그 설정이 무시됩니다. 행간도 rem 이라야 글자만 커지고 줄이 겹치지 않습니다.
- 굵기: 400 본문 · 500 버튼 · 라벨 · 배지 · 600 제목 · 현재 항목 · 700 숫자 배지.
- 크기는 위 표의 단계만 쓰고, 본문에 새 단계를 늘리지 않습니다. 위계가 많아지면 위계가 사라집니다.
- 표 · 지표의 숫자는 자릿수가 흔들리지 않게 고정폭 숫자를 씁니다: `font-variant-numeric: tabular-nums;`

---

## 5. 간격 · 모서리 · 그림자 · 움직임

**간격 — 4px 그리드.** 허용값: `0 · 2 · 4 · 6 · 8 · 10 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96` (px). `1px` 는 테두리와 사이드바 항목 사이 간격에만 씁니다. 이 밖의 값(13px 등)은 쓰지 않습니다.

| 용도 | 값 |
|---|---|
| 관련 요소 사이 | 8px |
| 카드 안쪽 여백 | 12~16px |
| 카드 사이 | 12px |
| 섹션 사이 | 20~24px |

**모서리**: `3px`(배지 · 작은 버튼) · `6px`(기본 — 버튼 · 입력 · 사이드바 항목) · `8px`(카드 · 위젯 · 지표 타일) · `12px` · `9999px`(원형).

**그림자**

| 변수 | 용도 | 라이트 | 다크 |
|---|---|---|---|
| `--shadow-sm` | 보드 카드 · 세그먼트 선택 칸 · 로그인 카드 (지표 타일 · 위젯 · 일반 카드는 그림자 없음) | `0 1px 2px 0 rgb(9 30 66 / 0.08)` | `0 1px 2px 0 rgb(0 0 0 / 0.4)` |
| `--shadow-md` | (정의만 있음 — 현재 부품에서 쓰지 않음) | `0 2px 8px -1px rgb(9 30 66 / 0.12), 0 0 1px rgb(9 30 66 / 0.10)` | `0 2px 8px -1px rgb(0 0 0 / 0.5)` |
| `--shadow-lg` | 드롭다운 · 팝오버 · 차트 툴팁 | `0 8px 24px -4px rgb(9 30 66 / 0.16), 0 0 1px rgb(9 30 66 / 0.10)` | `0 8px 24px -4px rgb(0 0 0 / 0.6)` |
| `--shadow-overlay` | 모달 · 명령 팔레트 · 서랍 · 토스트 · 하단 선택 바 · 저장 바 | `0 16px 48px -8px rgb(9 30 66 / 0.24)` | `0 16px 48px -8px rgb(0 0 0 / 0.7)` |

**움직임** — 짧게. 관리도구의 애니메이션은 장식이 아니라 상태 변화를 알리는 용도입니다.

| 변수 | 값 | 의미 |
|---|---|---|
| `--duration-instant` | `80ms` | 색 바뀜 · 행 · 버튼 hover |
| `--duration-fast` | `120ms` | 모달 · 명령 팔레트 · 토스트 · 하단 바 등장, 덮는 막, 스위치 |
| `--duration-normal` | `180ms` | 서랍 · 1024px 미만 사이드바가 밀려 들어옴, 사이드바 접기 |
| `--duration-slow` | `260ms` | (정의만 있음 — 현재 부품에서 쓰지 않음) |
| `--easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` | 기본 곡선 |
| `--easing-enter` | `cubic-bezier(0, 0, 0.2, 1)` | 나타날 때 |
| `--easing-exit` | `cubic-bezier(0.4, 0, 1, 1)` | 사라질 때 (정의만 있음 — 사라지는 효과를 쓰는 부품 없음) |

등장 효과: 뒤를 덮는 막은 투명 → 불투명(`fast` · `enter`), 모달 · 토스트는 97% → 100% 크기와 투명도(`fast` · `enter`), 서랍은 오른쪽에서 밀려 들어옴(`normal` · `standard`). 사용자가 동작 줄이기를 켜 두었으면(`prefers-reduced-motion`) 끕니다.

**겹침 순서**(아래 → 위): 기본 0 · 고정 머리행 10 · 사이드바 20 · 상단바 30 · 서랍 40 · 오버레이 50 · 모달 60 · 팝오버 70 · 토스트 80 · 명령 팔레트 90.
뒤를 덮는 막은 **함께 열리는 창 바로 아래**에 둡니다. 서랍(40)과 막(50)을 따로 띄우면 막이 서랍 위로 올라가 서랍을 누를 수 없게 됩니다 — 서랍 겹 하나 안에 막 → 창 순서로 넣습니다.

**화면 폭 구간**: 640 · 768 · **1024**(사이드바 고정 기준) · 1280 · 1536px.

---

## 6. 레이아웃 — 앱 셸

모든 화면은 이 셸 안에 들어갑니다. **셸 밖은 로그인 · 초대 수락 · 비밀번호 재설정 · 500 · 점검 화면뿐**입니다. 403 · 404 는 셸 안(사이드바 유지)의 본문 가운데에 띄웁니다 — 길을 잘못 든 것뿐이므로 다른 곳으로 갈 수 있어야 합니다. 500 · 점검은 사이드바를 그리면 누를 수 있을 것처럼 보이지만 전부 같은 오류로 떨어지므로 셸을 걷어냅니다.

```
+--------+------------+--------------------------------+-----------------+
| RAIL   | logo + env | TOPBAR  height 48px            | RIGHT PANEL     |
| 56px   +------------+--------------------------------+ 360px           |
| (opt.) | NAV  184px | MAIN  padding 24px x 20px      | open only while |
|        | nav groups |   page header: title + actions | an item is      |
|        |            |   content  max-width 1440px    | selected        |
|        | user       |                                |                 |
+--------+------------+--------------------------------+-----------------+
|<-- sidebar 240px -->|
```

도식의 영문 이름은 아래 표의 영역 이름과 같습니다. **레일(56px)과 탐색(184px)을 합친 왼쪽 칸이 사이드바 폭 240px** 입니다. 레일을 쓰지 않으면 탐색이 240px 전체를 씁니다. 사이드바 머리와 상단바는 둘 다 48px 이라 아래 테두리가 한 줄로 이어집니다. (모든 글꼴에서 줄이 맞도록 도식은 ASCII 문자만 씁니다.)

| 변수 | 값 | 의미 |
|---|---|---|
| `--layout-sidebar-width` | `240px` | 사이드바 칸 폭 (레일 + 탐색) |
| `--layout-sidebar-collapsed-width` | `56px` | 접힌 사이드바 폭 |
| `--layout-rail-width` | `56px` | 워크스페이스 레일 폭 |
| `--layout-topbar-height` | `48px` | 상단바 높이 |
| `--layout-right-panel-width` | `360px` | 우측 패널 폭 · 기본 서랍 폭 |
| `--layout-right-panel-wide-width` | `480px` | 넓은 서랍 폭 (우측 패널은 항상 기본 폭) |
| `--layout-content-max-width` | `1440px` | 본문 최대 폭 |
| `--layout-page-padding-x` | `24px` | 본문 좌우 여백 |
| `--layout-page-padding-y` | `20px` | 본문 위아래 여백 |

| 영역 | 역할 | 넣지 말아야 할 것 |
|---|---|---|
| 레일 `RAIL` (선택) | 워크스페이스 · 환경 전환 | — |
| 사이드바 탐색 `NAV` | 어디로 갈 수 있는가 — 머리에 로고 + 환경 표시, 그 아래 탐색 그룹, 맨 아래 현재 사용자 | 화면별 행동 버튼 |
| 상단바 `TOPBAR` | 지금 어디에 있는가(경로) + 전역 기능(검색 · 알림) | 페이지 제목 (페이지 머리와 중복) · 화면별 행동 버튼 (페이지 머리에 둠) |
| 본문 `MAIN` | 지금 보는 내용 | 자체 머리줄 · 자체 좌우 여백 |
| 우측 패널 `RIGHT PANEL` | 선택한 항목의 상세 | 주 작업 흐름 |

- **탐색 메뉴는 한 곳에서 정의**하고 모든 화면이 같은 메뉴를 씁니다. 화면마다 메뉴를 다시 만들면 사용자는 다른 제품에 온 줄 압니다. 메뉴 옆 숫자 배지는 실제 데이터에서 계산해 넣고, 메뉴 정의에 숫자를 적어 두지 않습니다.
- 상단바: 왼쪽 사이드바 접기 단추 · 경로(브레드크럼), 오른쪽 검색 칸(280 × 32px, 768px 미만에서 숨김) · 알림 단추. 화면의 행동 버튼은 상단바가 아니라 페이지 머리에 둡니다.
- **1024px 이상**: 사이드바 · 우측 패널 고정. **1024px 미만**: 사이드바는 겹쳐 열리는 서랍, 우측 패널은 전체 화면.

**셸 각 부분의 모양**

| 부분 | 모양 |
|---|---|
| 셸 전체 | 바탕 `bg-canvas`, 글자 `text-primary` |
| 사이드바 칸 | 폭 240px = 레일 56px + 탐색 184px. 바탕 `bg-sidebar` · 오른쪽 1px `border-subtle`. 그 안을 레일(`sidebar-rail-bg`)과 탐색(`sidebar-bg`)이 칠합니다 (§7 사이드바) |
| 상단바 | 높이 48px · 바탕 `bg-surface` · 아래 1px `border-subtle`. 왼쪽 끝 사이드바 접기 단추(아이콘 단추, 좌우 8px) → 경로 → 검색 칸 → 알림 단추. 경로 · 검색 칸 · 단추 묶음 사이 12px, 오른쪽 끝 여백 12px, 단추끼리 4px |
| 검색 칸 | 입력이 아니라 명령 팔레트를 여는 단추입니다. 280 × 32px · 모서리 6px · 1px `border-default` · 바탕 `bg-sunken` · 좌우 8px · 13px `text-tertiary` "검색" · 오른쪽 끝 단축키 표시(`⌘K` — 11px · 모서리 3px · 1px `border-default` · 바탕 `bg-surface`). 마우스를 올리면 `bg-hover` |
| 경로 (브레드크럼) | 13px, 항목 사이 4px. 상위 항목 `text-tertiary`(마우스를 올리면 `text-primary` + 밑줄) · 구분자 `/` 는 `text-disabled` · 현재 항목 굵기 500 `text-primary` |
| 아이콘 단추 | 32×32px · 모서리 6px · `text-secondary` → 마우스를 올리면 `bg-hover` + `text-primary`. 이름(`aria-label`) 필수. 새 알림은 오른쪽 위 가장자리에서 4px 안쪽의 6px 원 `danger-solid` |
| 우측 패널 | 바탕 `bg-surface` · 왼쪽 1px `border-subtle`. 머리 48px(아래 1px `border-subtle`, 좌우 16px): 제목 13px · 600 + 보조 11px `text-tertiary` + 닫기 단추 28×28px. 본문 여백 16px. 닫기 단추와 Esc 둘 다로 닫힙니다 |
| 속성 목록 (우측 패널 안) | 라벨 열 폭 92px 고정 · 12px `text-tertiary`, 값 13px `text-primary`, 라벨과 값 사이 12px, 행 사이 10px |

**셸 밖 화면의 모양**

- 로그인 등 인증 화면: 바탕 `bg-canvas`, 화면 가운데 폭 400px 칸. 위에서부터 로고 40px(로고가 놓인 면이 캔버스이므로 라이트 테마는 컬러판 · 다크 테마는 흰색판) + 12px 아래 13px `text-tertiary` 부제 → 24px 아래 카드(모서리 8px · 1px `border-subtle` · 바탕 `bg-surface` · 여백 20px · `--shadow-sm`).
- 500 · 점검: 바탕 `bg-canvas`, 화면 가운데 정렬 — 로고 24px → 32px 아래 코드 칩(원형 · 1px 테두리 · 좌우 10px · 위아래 4px · 12px · 600, 색조 색) → 16px 아래 제목 24/32px · 600 → 설명 14/24px `text-tertiary`(제목 8px 아래, 최대 폭 480px) → 20px 아래 행동 단추(간격 8px).
- 셸 안의 403 · 404 도 같은 구성에서 로고만 빼고, 본문 영역 가운데(최소 높이 화면의 60%)에 놓습니다.

**덮는 창 고르기**

| 상황 | 쓰는 것 | 이유 |
|---|---|---|
| 삭제 확인 · 짧은 입력 | 모달 | 집중이 필요하고 되돌리기 어려움 |
| 상세 보기 · 편집 | 서랍(옆에서 열림) | 목록 맥락 유지 |
| 목록 ↔ 상세를 계속 오감 | 우측 패널 | 상시 상세 |

**대표 화면 두 가지의 구성 순서**

- **목록 + 상세**: 페이지 머리 → (필요할 때만) 알림 띠 → 저장된 뷰 탭 → 검색 · 필터 줄 → 표 도구줄(표 / 보드 전환 · 묶기 · 행 높이) → 표(또는 보드) → 행을 고르면 우측 패널에 상세. 뷰나 묶기를 바꿔도 같은 검색 · 필터 결과를 보여 줍니다.
- **대시보드**: 페이지 머리(기간 선택) → (임계값을 넘긴 지표가 있을 때만) 알림 띠 → 지표 타일 → 위젯(분해 · 차원 전환) → "조치가 필요한 항목" 목록. 지표 → 분해 → 목록으로 좁혀 들어가는 경로로 끝나야 합니다.

---

## 7. 부품 규격

패키지의 실제 컴포넌트 코드에서 뽑은 값입니다. 여기 없는 부품을 새로 만들 때도 같은 토큰 · 같은 치수 체계를 씁니다.

**부품 카드 읽는 법.** 부품마다 같은 형식의 카드가 먼저 오고, 그 아래에 세부 치수가 옵니다.

- 카드 형식: 구조 → 종류 · 크기(prop) → 상태 7가지(기본 · hover · focus · active · disabled · loading · error) → 토큰 → 접근성 → 할 것 / 하지 말 것 → React 예 → 순수 HTML + CSS 예.
- **카드는 코드에서 검사됩니다.** 종류 · 크기 목록은 컴포넌트 소스의 실제 키와, 기본값은 함수 기본값과 같아야 생성되고, 토큰은 §2 에 있어야 합니다. "브라우저 대조 N건" 이 붙은 카드는 그 HTML + CSS 를 크로미엄으로 그려 실제 React 컴포넌트와 크기 · 여백 · 글자 · 색이 같은지 라이트 · 다크에서 비교합니다.
- 순수 HTML 로 만든다면 §2-1 의 세 블록 다음에 아래 공통 CSS 를 한 번 붙이고, 각 카드의 CSS 를 붙입니다. 클래스 이름(`hct-…`)은 예시이므로 바꿔도 되지만 값은 바꾸지 않습니다.

```css
/* 부품 카드 공통 — 프레임워크 초기화 CSS 가 없어도 같은 모양이 되게 */
.hct-btn, .hct-input, .hct-filter-btn, .hct-segmented__tab, .hct-nav-item,
.hct-badge, .hct-tag, .hct-banner, .hct-metric, .hct-widget, .hct-modal, .hct-drawer,
.hct-toast, .hct-listbox, .hct-skeleton, .hct-empty__icon, .hct-segmented {
  box-sizing: border-box;
}
.hct-btn, .hct-input, .hct-filter-btn, .hct-segmented__tab, .hct-nav-item, button.hct-metric {
  margin: 0;
  font-family: inherit;
  letter-spacing: inherit;
  text-transform: none;
}
.hct-btn, .hct-filter-btn, .hct-segmented__tab, .hct-nav-item, button.hct-metric { cursor: pointer; }
@keyframes hct-spin { to { transform: rotate(360deg); } }
@keyframes hct-shimmer { 100% { transform: translateX(100%); } }
```

### 버튼

> **부품 카드** — `src/components/input/Button.jsx` · `Button` · `IconButton` · 브라우저 대조 9건

| 항목 | 내용 |
|---|---|
| 구조 | `[아이콘?] 글자 [아이콘?]` 한 줄 · 아이콘 전용은 `IconButton`(정사각형, 이름 필수) |
| `variant` | `primary` 화면의 주 행동 — 화면당 1개 · `secondary` **(기본)** 대부분의 버튼 · `ghost` 툴바 · 아이콘 · `danger` 삭제 · 해지 · `danger-subtle` 파괴적이지만 부차적인 행동 |
| `size` | `xs` 24px · `sm` 28px · `md` **(기본)** 32px · `lg` 36px |
| 기본 | 종류 표의 바탕 · 글자 · 테두리 |
| hover (마우스를 올림) | 종류 표의 "마우스를 올리면" |
| focus (키보드 포커스) | ③ 기본 레이어의 `:focus-visible` 링 — `2px solid var(--color-border-focus)` · 간격 1px |
| active (누르는 중 · 선택됨) | 해당 없음 — 누르는 중의 별도 모양은 없습니다 |
| disabled | 불투명도 50% · `cursor: not-allowed` · 눌리지 않음 |
| loading | 왼쪽 아이콘 자리에 14px 회전 표시 · `aria-busy="true"` · 눌리지 않음 |
| error | 해당 없음 |
| 토큰 | `--color-accent-solid` `--color-accent-solid-hover` `--color-text-inverse` `--color-bg-surface` `--color-text-primary` `--color-text-secondary` `--color-border-default` `--color-bg-hover` `--color-danger-solid` `--color-danger-text` `--color-danger-border` `--color-danger-bg` `--control-height-xs` `--control-height-sm` `--control-height-md` `--control-height-lg` `--duration-instant` `--easing-standard` |
| 접근성 | `<button type="button">` 을 씁니다. `<div onclick>` 금지 · 아이콘 전용 버튼은 `aria-label` 필수 (`IconButton` 의 `label`) · 손가락 입력 기기에서는 높이가 44px 로 올라갑니다 (§2-1 ②) |
| 할 것 | 화면당 primary 1개 · 되돌릴 수 없는 행동에만 danger |
| 하지 말 것 | 버튼 색을 직접 칠하기 · 같은 줄에 primary 두 개 · 포커스 링 지우기 |

React (패키지):

```jsx
import { Button, IconButton } from 'hct-web-design-template'

<Button variant="primary" onClick={save}>저장</Button>
<Button loading>저장 중</Button>
<IconButton icon={<SearchIcon />} label="검색" />
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<button type="button" class="hct-btn hct-btn--primary">저장</button>
<button type="button" class="hct-btn" disabled>취소</button>
<button type="button" class="hct-btn hct-btn--ghost hct-btn--icon" aria-label="검색"><svg …/></button>
```

```css
.hct-btn {
  display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center;
  white-space: nowrap; font-weight: 500;
  height: var(--control-height-md); padding: 0 12px; gap: 6px; border-radius: 6px;
  font-size: 0.875rem; line-height: 1.25rem;
  border: 1px solid var(--color-border-default);
  background-color: var(--color-bg-surface); color: var(--color-text-primary);
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-duration: var(--duration-instant); transition-timing-function: var(--easing-standard);
}
.hct-btn:hover { background-color: var(--color-bg-hover); }
.hct-btn:disabled, .hct-btn[aria-busy="true"] { cursor: not-allowed; opacity: 0.5; }
.hct-btn--primary { background-color: var(--color-accent-solid); color: var(--color-text-inverse); border-color: transparent; }
.hct-btn--primary:hover { background-color: var(--color-accent-solid-hover); }
.hct-btn--ghost { background-color: transparent; color: var(--color-text-secondary); border-color: transparent; }
.hct-btn--ghost:hover { background-color: var(--color-bg-hover); color: var(--color-text-primary); }
.hct-btn--danger { background-color: var(--color-danger-solid); color: var(--color-text-inverse); border-color: transparent; }
.hct-btn--danger:hover { background-color: var(--color-danger-solid); opacity: 0.9; }
.hct-btn--danger-subtle { background-color: transparent; color: var(--color-danger-text); border-color: var(--color-danger-border); }
.hct-btn--danger-subtle:hover { background-color: var(--color-danger-bg); }
.hct-btn--xs { height: var(--control-height-xs); padding: 0 6px; gap: 4px; border-radius: 3px; font-size: 0.75rem; line-height: 1rem; }
.hct-btn--sm { height: var(--control-height-sm); padding: 0 8px; gap: 4px; font-size: 0.75rem; line-height: 1rem; }
.hct-btn--lg { height: var(--control-height-lg); padding: 0 16px; gap: 8px; }
.hct-btn--icon { padding: 0; width: var(--control-height-md); }
.hct-btn__spinner { width: 14px; height: 14px; animation: hct-spin 1s linear infinite; }
```

**세부 치수**

| 크기 | 높이 | 좌우 여백 | 글자 | 모서리 | 아이콘 간격 |
|---|---|---|---|---|---|
| xs | 24px | 6px | 12px | 3px | 4px |
| sm | 28px | 8px | 12px | 6px | 4px |
| **md (기본)** | **32px** | **12px** | **14px** | **6px** | **6px** |
| lg | 36px | 16px | 14px | 6px | 8px |

| 종류 | 바탕 | 글자 | 테두리 | 마우스를 올리면 | 쓰는 곳 |
|---|---|---|---|---|---|
| primary | `accent-solid` | `text-inverse` | 없음 | `accent-solid-hover` | 화면의 주 행동 — **화면당 1개** |
| secondary (기본) | `bg-surface` | `text-primary` | `border-default` | `bg-hover` | 대부분의 버튼 |
| ghost | 투명 | `text-secondary` | 없음 | `bg-hover` · `text-primary` | 툴바 · 아이콘 |
| danger | `danger-solid` | `text-inverse` | 없음 | 불투명도 90% | 삭제 · 해지 |
| danger-subtle | 투명 | `danger-text` | `danger-border` | `danger-bg` | 파괴적이지만 부차적인 행동 |

글자 굵기 500. 테두리는 1px 이며, "없음"인 종류도 투명한 1px 테두리를 둬서 종류가 달라도 크기가 같게 맞춥니다.

### 입력

> **부품 카드** — `src/components/input/Input.jsx` · `TextField` · 브라우저 대조 6건

| 항목 | 내용 |
|---|---|
| 구조 | 라벨(위) → 입력 칸(왼쪽 아이콘 선택) → 도움말 또는 오류 문장(아래) |
| `size` | `sm` 28px · 13px 글자 · `md` **(기본)** 32px · `lg` 36px |
| 기본 | 바탕 `bg-surface` · 테두리 `border-default` · 안내문 `text-tertiary` |
| hover (마우스를 올림) | 해당 없음 — 마우스를 올려도 바뀌지 않습니다 |
| focus (키보드 포커스) | 테두리 `border-focus` + 같은 색 1px 링 (기본 포커스 링 대신) |
| active (누르는 중 · 선택됨) | 해당 없음 |
| disabled | 바탕 `bg-sunken` · 글자 `text-disabled` · `cursor: not-allowed` |
| loading | 해당 없음 |
| error | 테두리 `danger-border` · `aria-invalid="true"` · 4px 아래 12px `danger-text` 문장(색만으로 알리지 않음) |
| 토큰 | `--color-bg-surface` `--color-border-default` `--color-text-primary` `--color-text-tertiary` `--color-text-secondary` `--color-border-focus` `--color-bg-sunken` `--color-text-disabled` `--color-danger-border` `--color-danger-text` `--control-height-sm` `--control-height-md` `--control-height-lg` |
| 접근성 | 모든 입력에 `<label for>` — 숨길 때도 지우지 말고 화면에서만 숨김(`hideLabel`) · 오류 문장은 `aria-describedby` 로 입력과 잇습니다 |
| 할 것 | 오류는 무엇이 틀렸는지 문장으로 |
| 하지 말 것 | 빨간 테두리만으로 오류 표시 · 안내문(placeholder)을 라벨 대신 쓰기 |

React (패키지):

```jsx
import { TextField } from 'hct-web-design-template'

<TextField label="이름" value={name} onChange={(e) => setName(e.target.value)} />
<TextField label="이메일" error="이메일 형식이 아닙니다" />
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<div class="hct-field">
  <label class="hct-field__label" for="name">이름</label>
  <input class="hct-input" id="name" aria-invalid="true" aria-describedby="name-error" />
  <p class="hct-field__error" id="name-error">이름을 입력하세요</p>
</div>
```

```css
.hct-field__label { display: block; margin: 0 0 4px; font-size: 0.75rem; line-height: 1rem; font-weight: 500; color: var(--color-text-secondary); }
.hct-input {
  width: 100%; height: var(--control-height-md); padding: 0 8px;
  border: 1px solid var(--color-border-default); border-radius: 6px;
  background-color: var(--color-bg-surface); color: var(--color-text-primary);
  font-size: 0.875rem; line-height: 1.25rem;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-duration: var(--duration-instant);
}
.hct-input::placeholder { color: var(--color-text-tertiary); opacity: 1; }
.hct-input:focus { outline: none; border-color: var(--color-border-focus); box-shadow: 0 0 0 1px var(--color-border-focus); }
.hct-input:disabled { cursor: not-allowed; background-color: var(--color-bg-sunken); color: var(--color-text-disabled); }
.hct-input[aria-invalid="true"] { border-color: var(--color-danger-border); }
.hct-input--sm { height: var(--control-height-sm); font-size: 0.8125rem; line-height: 1.125rem; }
.hct-input--lg { height: var(--control-height-lg); }
.hct-field__hint, .hct-field__error { margin: 4px 0 0; font-size: 0.75rem; line-height: 1rem; }
.hct-field__hint { color: var(--color-text-tertiary); }
.hct-field__error { color: var(--color-danger-text); }
```

**세부 치수**

- 높이 32px (작게 28px · 글자 13px / 크게 36px), 좌우 여백 8px, 글자 14px, 모서리 6px.
- 라벨: 입력 위 4px, 12px · 500 `text-secondary`.
- 바탕 `bg-surface`, 테두리 `border-default`, 글자 `text-primary`, 안내문(placeholder) `text-tertiary`.
- 포커스: 테두리 `border-focus` + 같은 색 1px 링.
- 오류: 테두리 `danger-border`, 입력 4px 아래에 12px `danger-text` 로 무엇이 틀렸는지 적습니다.

### 상태 배지

> **부품 카드** — `src/components/feedback/StatusBadge.jsx` · `StatusBadge` · `Tag` · 브라우저 대조 9건

| 항목 | 내용 |
|---|---|
| 구조 | `[점?] 라벨` — 색조의 바탕 · 글자 · 테두리. 상태 이름(`status`)을 주면 색조와 라벨이 §2-3 표대로 정해집니다 |
| `tone` | `neutral` 대기 · 보관 · `info` 진행 · `review` 검토 · `success` 완료 · `warning` 보류 · 주의 · `danger` 실패 · 차단 |
| `size` | `sm` 16px · 촘촘한 표 · `md` **(기본)** 20px |
| 기본 | §2-3 색조의 `bg` · `text` · `border` |
| hover (마우스를 올림) | 해당 없음 — 누를 수 없는 표시입니다 |
| focus (키보드 포커스) | 해당 없음 |
| active (누르는 중 · 선택됨) | 해당 없음 |
| disabled | 해당 없음 |
| loading | 해당 없음 |
| error | `danger` 색조 (상태의 하나일 뿐 별도 모양 없음) |
| 토큰 | `--color-neutral-bg` `--color-neutral-text` `--color-neutral-border` `--color-neutral-solid` `--color-info-bg` `--color-info-text` `--color-info-border` `--color-success-bg` `--color-success-text` `--color-warning-bg` `--color-warning-text` `--color-danger-bg` `--color-danger-text` `--color-review-bg` `--color-review-text` `--color-bg-sunken` `--color-border-subtle` |
| 접근성 | 상태는 글자로 읽힙니다 — 점만 단독으로 쓰지 않습니다 · 배지는 문장 안 정보라 `role` 을 달지 않습니다 |
| 할 것 | 상태 이름 → 색조는 §2-3 표로만 · 분류(라벨 · 카테고리)는 중립 태그 `Tag` |
| 하지 말 것 | 화면마다 상태 색을 새로 고르기 · 분류에 상태 색 쓰기 |

React (패키지):

```jsx
import { StatusBadge, Tag } from 'hct-web-design-template'

<StatusBadge status="in_progress" />
<StatusBadge tone="danger" size="sm" dot>차단</StatusBadge>
<Tag>백엔드</Tag>
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<span class="hct-badge hct-badge--info">진행중</span>
<span class="hct-badge hct-badge--danger hct-badge--sm"><span class="hct-badge__dot"></span>차단</span>
<span class="hct-tag">백엔드</span>
```

```css
.hct-badge {
  display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
  height: 20px; padding: 0 6px; border: 1px solid; border-radius: 3px;
  font-size: 0.75rem; line-height: 1rem; font-weight: 500;
  background-color: var(--color-neutral-bg); color: var(--color-neutral-text); border-color: var(--color-neutral-border);
}
.hct-badge--sm { height: 16px; padding: 0 4px; font-size: 0.6875rem; line-height: 0.875rem; }
.hct-badge__dot { width: 6px; height: 6px; flex-shrink: 0; border-radius: 9999px; background-color: var(--color-neutral-solid); }
.hct-badge--info { background-color: var(--color-info-bg); color: var(--color-info-text); border-color: var(--color-info-border); }
.hct-badge--info .hct-badge__dot { background-color: var(--color-info-solid); }
.hct-badge--success { background-color: var(--color-success-bg); color: var(--color-success-text); border-color: var(--color-success-border); }
.hct-badge--success .hct-badge__dot { background-color: var(--color-success-solid); }
.hct-badge--warning { background-color: var(--color-warning-bg); color: var(--color-warning-text); border-color: var(--color-warning-border); }
.hct-badge--warning .hct-badge__dot { background-color: var(--color-warning-solid); }
.hct-badge--danger { background-color: var(--color-danger-bg); color: var(--color-danger-text); border-color: var(--color-danger-border); }
.hct-badge--danger .hct-badge__dot { background-color: var(--color-danger-solid); }
.hct-badge--review { background-color: var(--color-review-bg); color: var(--color-review-text); border-color: var(--color-review-border); }
.hct-badge--review .hct-badge__dot { background-color: var(--color-review-solid); }
.hct-tag {
  display: inline-flex; align-items: center; gap: 4px; height: 20px; padding: 0 6px;
  border: 1px solid var(--color-border-subtle); border-radius: 3px; background-color: var(--color-bg-sunken);
  font-size: 0.75rem; line-height: 1rem; color: var(--color-text-secondary);
}
```

**세부 치수**

- 높이 20px, 좌우 여백 6px, 글자 12px · 굵기 500, 모서리 3px, 1px 테두리. 작은 크기: 높이 16px · 여백 4px · 글자 11px.
- 색은 §2-3 색조의 `bg` · `text` · `border` 조합.
- 표 안의 상태 배지는 글자 앞에 6px 원형 점(색조의 `solid`)을 붙이고, 촘촘한 표(행 32px)에서는 작은 배지(16px)를 씁니다. 점과 글자 사이 4px. **점만 단독으로 쓰지 않습니다.**
- 상태가 아닌 분류(라벨 · 카테고리)는 **중립 태그**로 씁니다: 높이 20px · 좌우 6px · 12px `text-secondary` · 바탕 `bg-sunken` · 1px `border-subtle` · 모서리 3px. 분류에 상태 색을 쓰지 않습니다.

### 사이드바

> **부품 카드** — `src/components/shell/Sidebar.jsx` · `Sidebar` · `SidebarGroup` · `SidebarItem` · `SidebarUser` · `WorkspaceRail` · 브라우저 대조 2건

| 항목 | 내용 |
|---|---|
| 구조 | 머리(로고 · 환경) → 그룹 라벨 → 항목 `[아이콘 16px] 이름 [멘션 배지 \| 건수]` → 바닥(현재 사용자) |
| 기본 | 글자 `sidebar-fg-muted` · 굵기 400 |
| hover (마우스를 올림) | 바탕 `sidebar-hover` · 글자 `sidebar-fg` |
| focus (키보드 포커스) | 포커스 링 색을 `sidebar-fg` 로 (기본 링은 어두운 사이드바에서 안 보임) |
| active (누르는 중 · 선택됨) | 현재 화면 — 바탕 `sidebar-active-bg` · 글자 `sidebar-active-fg` · 600 · `aria-current="page"` |
| disabled | 해당 없음 |
| loading | 해당 없음 |
| error | 해당 없음 |
| 토큰 | `--color-sidebar-bg` `--color-sidebar-fg` `--color-sidebar-fg-muted` `--color-sidebar-fg-subtle` `--color-sidebar-hover` `--color-sidebar-active-bg` `--color-sidebar-active-fg` `--color-sidebar-border` `--color-sidebar-badge-bg` `--color-sidebar-badge-fg` `--control-height-lg` |
| 접근성 | `<nav>` 안의 `<ul>` · 현재 화면은 `aria-current="page"` · 접힌 상태 · 레일 타일은 이름(`title` · `aria-label`) 필수 |
| 할 것 | 숫자는 멘션 · 건수 · 안 읽음(굵게) 세 가지로 구분 |
| 하지 말 것 | 모든 숫자를 빨간 배지로 · 항목 높이를 줄이기 |

React (패키지):

```jsx
import { Sidebar, SidebarGroup, SidebarItem } from 'hct-web-design-template'

<Sidebar>
  <SidebarGroup label="업무">
    <SidebarItem icon={<InboxIcon />} label="받은 일" active mentions={3} href="/inbox" />
    <SidebarItem icon={<ListIcon />} label="전체" badge={128} href="/all" />
  </SidebarGroup>
</Sidebar>
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<nav class="hct-sidebar"><ul>
  <li><a class="hct-nav-item" href="/inbox" aria-current="page">받은 일</a></li>
  <li><a class="hct-nav-item" href="/all">전체</a></li>
</ul></nav>
```

```css
.hct-nav-item {
  display: flex; width: 100%; align-items: center; gap: 8px; height: var(--control-height-lg);
  padding: 0 8px; border: 0; border-radius: 6px; background-color: transparent;
  font-size: 0.8125rem; line-height: 1.125rem; font-weight: 400; color: var(--color-sidebar-fg-muted);
  text-decoration: none;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-duration: var(--duration-instant);
}
.hct-nav-item:hover { background-color: var(--color-sidebar-hover); color: var(--color-sidebar-fg); }
.hct-nav-item[aria-current="page"] { background-color: var(--color-sidebar-active-bg); color: var(--color-sidebar-active-fg); font-weight: 600; }
.hct-sidebar :focus-visible { outline-color: var(--color-sidebar-fg); }
```

**세부 치수**

- 구조: 머리 높이 48px — 상단바와 같은 높이, 아래 1px `sidebar-border`, 좌우 12px. 왼쪽에 로고(흰색판 22px), 오른쪽 끝에 현재 환경 표시(예: "프로덕션" — 11px · 500 `sidebar-fg-muted` · 1px `sidebar-border` · 모서리 3px · 좌우 6px · 위아래 2px). 목록 영역 좌우 8px · 위아래 12px, 항목 사이 1px. 바닥(현재 사용자)은 위 1px `sidebar-border`, 여백 8px.
- 그룹 라벨: 11px · 굵기 600 · 대문자 · 자간 0.06em · `sidebar-fg-subtle`, 좌우 여백 8px · 아래 4px. 그룹 사이 16px.
- 항목: 높이 36px, 좌우 여백 8px, 아이콘(16px)과 글자 사이 8px, 모서리 6px, 글자 13px.

| 항목 상태 | 바탕 | 글자 |
|---|---|---|
| 기본 | 없음 | `sidebar-fg-muted` · 굵기 400 |
| 안 읽은 것이 있음 | 없음 | `sidebar-fg` · 굵기 600 |
| 마우스를 올리면 | `sidebar-hover` | `sidebar-fg` |
| 현재 화면 | `sidebar-active-bg` | `sidebar-active-fg` · 굵기 600 |

**항목 옆 숫자는 세 가지로 구분합니다.** 구분하지 않으면 모든 숫자가 똑같이 급해 보여서 아무것도 급하지 않게 됩니다.

| 뜻 | 모양 |
|---|---|
| 안 읽은 것이 있음 | 숫자 없이 글자만 굵게(600) · `sidebar-fg` |
| 나를 부른 수 (멘션) | 빨간 원형 배지 — 높이 16px · 최소 폭 16px · 좌우 여백 4px, `sidebar-badge-bg` / `sidebar-badge-fg`, 11px · 굵기 700 · 고정폭 숫자, 99 초과는 `99+` |
| 중립 건수 (전체 개수 등) | 바탕 없는 11px 숫자 · `sidebar-fg-subtle` (현재 화면 항목 위에서는 `sidebar-active-fg`) |

- 현재 사용자(바닥): 24px 머리글자 상자(모서리 6px · `accent-solid` · 12px · 600 `text-inverse`) + 오른쪽 아래로 2px 나간 10px 접속 상태 점(2px 테두리 + 바깥 2px `sidebar-bg` 고리) — 접속 중은 채운 원 `success-solid`, 자리 비움은 테두리만 `warning-solid`, 오프라인은 테두리만 `sidebar-fg-subtle`. 색만이 아니라 모양으로도 구분합니다. 이름 13px · 500 `sidebar-fg`, 보조 11px `sidebar-fg-subtle`.
- **사이드바 안 포커스 링은 `sidebar-fg` 색으로 바꿉니다.** 기본 레이어의 `border-focus` 링은 라이트 테마의 어두운 사이드바 위에서 대비 1.8:1, 현재 화면 항목 위에서 1:1 이라 보이지 않습니다(패키지에도 있는 결함). `sidebar-fg` 는 7:1 이상입니다.
- 워크스페이스 레일(선택): 폭 56px · 바탕 `sidebar-rail-bg` · 오른쪽 1px `sidebar-border`. 32×32px 타일(모서리 8px, 타일 사이 6px, 워크스페이스 이름 첫 글자 13px · 600) — 현재 항목 `accent-solid` + `text-inverse`, 나머지 `sidebar-hover` + `sidebar-fg-muted`(마우스를 올리면 `sidebar-fg`). 아이콘뿐이므로 이름(`aria-label`) 필수.

### 표

> **부품 카드** — `src/components/grid/DataGrid.jsx` · `DataGrid`

| 항목 | 내용 |
|---|---|
| 구조 | 머리행(고정) → 행 `[체크박스] 셀… [행 동작]` → 바닥(쪽 넘김) |
| `density` | `compact` 행 32px · `default` **(기본)** 행 40px · `relaxed` 행 48px |
| 기본 | 행 바탕 `bg-surface` · 행 사이 `border-subtle` |
| hover (마우스를 올림) | 행 바탕 `bg-hover` |
| focus (키보드 포커스) | ③ 기본 레이어의 `:focus-visible` 링 — `2px solid var(--color-border-focus)` · 간격 1px (셀 단위 키보드 이동) |
| active (누르는 중 · 선택됨) | 상세가 열린 행 `bg-active` · 선택한 행 `accent-subtle` |
| disabled | 해당 없음 |
| loading | 같은 행 높이의 스켈레톤 6행 (`SkeletonTable`) |
| error | 표 자리에 오류 블록 (§7 빈 상태) |
| 토큰 | `--color-bg-sunken` `--color-text-secondary` `--color-border-default` `--color-border-subtle` `--color-bg-surface` `--color-bg-hover` `--color-bg-active` `--color-accent-subtle` `--row-height-compact` `--row-height-default` `--row-height-relaxed` |
| 접근성 | 실제 `<table>` · `<th scope="col">` 을 씁니다 — `<div>` 로 흉내 내지 않음 · 체크박스마다 이름(`aria-label`) |
| 할 것 | 숫자 · 날짜 열은 머리행까지 오른쪽 정렬 + 고정폭 숫자 |
| 하지 말 것 | 상태 열에 색 글자만 — 상태 배지를 씁니다 |

React (패키지):

```jsx
import { DataGrid } from 'hct-web-design-template'

<DataGrid fields={fields} records={rows} density="default" onRowClick={open} />
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<table class="hct-table">
  <thead><tr><th scope="col">이름</th><th scope="col" class="hct-num">금액</th></tr></thead>
  <tbody><tr><td>계약 A</td><td class="hct-num">1,200</td></tr></tbody>
</table>
```

```css
.hct-table { width: 100%; border-collapse: collapse; text-align: left; }
.hct-table th {
  position: sticky; top: 0; height: 32px; padding: 0 8px; background-color: var(--color-bg-sunken);
  border-bottom: 1px solid var(--color-border-default);
  font-size: 0.75rem; line-height: 1rem; font-weight: 600; color: var(--color-text-secondary);
}
.hct-table td {
  height: var(--row-height-default); padding: 0 12px; background-color: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border-subtle); font-size: 0.875rem; line-height: 1.25rem;
}
.hct-table tbody tr:hover td { background-color: var(--color-bg-hover); }
.hct-table tr[aria-selected="true"] td { background-color: var(--color-accent-subtle); }
.hct-table .hct-num { text-align: right; font-variant-numeric: tabular-nums; }
```

**세부 치수**

- 머리행: 높이 32px · 좌우 8px, 스크롤해도 위에 고정, 바탕 `bg-sunken`, 글자 12px · 굵기 600 · `text-secondary`, 아래 테두리 `border-default`.
- 본문 셀: 글자 14px(본문과 같음) · 좌우 12px. 행 높이: 촘촘 32px · **기본 40px** · 여유 48px. 행 사이 `border-subtle`.

| 행 상태 | 바탕 |
|---|---|
| 기본 | `bg-surface` |
| 마우스를 올리면 | `bg-hover` |
| 상세가 열린 행 | `bg-active` |
| 체크박스로 선택한 행 | `accent-subtle` |
| 묶음(그룹) 머리행 | `bg-sunken` |

- 숫자 · 날짜 열은 머리행까지 오른쪽 정렬 + 고정폭 숫자. 체크박스 열은 폭 32px · 가운데 정렬.
- 상태 열은 상태 배지를 씁니다.
- 표를 `<div>` 로 흉내 내지 말고 실제 표 요소를 씁니다(스크린리더 · 키보드 조작).

### 지표 타일 (대시보드 KPI)

> **부품 카드** — `src/components/dashboard/MetricTile.jsx` · `MetricTile` · 브라우저 대조 4건

| 항목 | 내용 |
|---|---|
| 구조 | 라벨 [상태 배지] → 값 + 단위 → 증감(비교 대상 함께) → 추이선 → [임계값] |
| `state` | `ok` **(기본)** 정상 · `warn` 주의 · `danger` 위험 — 값 글자도 `danger-text` |
| 기본 | 테두리 `border-subtle` |
| hover (마우스를 올림) | 누를 수 있는 타일만 — 테두리 `border-strong` · 바탕 `bg-hover` · "N건 보기" |
| focus (키보드 포커스) | ③ 기본 레이어의 `:focus-visible` 링 — `2px solid var(--color-border-focus)` · 간격 1px |
| active (누르는 중 · 선택됨) | 해당 없음 |
| disabled | 해당 없음 |
| loading | 같은 크기의 스켈레톤 (`SkeletonStatCard`) |
| error | `state="danger"` 는 임계 초과 표시일 뿐 — 불러오기 실패는 오류 블록 |
| 토큰 | `--color-bg-surface` `--color-border-subtle` `--color-border-strong` `--color-bg-hover` `--color-warning-border` `--color-danger-border` `--color-danger-text` `--color-text-tertiary` `--color-text-link` |
| 접근성 | 누를 수 있으면 `<button>` — 숫자를 누르면 그 조건의 목록으로 · 증감은 화살표 모양 + 글자(색만으로 좋고 나쁨을 알리지 않음) |
| 할 것 | 증감에는 비교 대상 값을 함께 |
| 하지 말 것 | 보기만 하는 숫자판 — 목록으로 이어지게 |

React (패키지):

```jsx
import { MetricTile } from 'hct-web-design-template'

<MetricTile label="미처리 건" value={42} unit="건" delta={12} previous={37} state="warn" onDrillDown={go} />
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<button type="button" class="hct-metric hct-metric--warn">
  <div class="hct-metric__head"><span class="hct-metric__label">미처리 건</span></div>
  <div class="hct-metric__main"><span class="hct-metric__value">42</span><span class="hct-metric__unit">건</span></div>
</button>
```

```css
.hct-metric {
  position: relative; width: 100%; overflow: hidden; padding: 12px; text-align: left;
  border: 1px solid var(--color-border-subtle); border-radius: 8px; background-color: var(--color-bg-surface);
  font-size: 0.875rem; line-height: 1.25rem; color: inherit;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-duration: var(--duration-instant);
}
button.hct-metric:hover { border-color: var(--color-border-strong); background-color: var(--color-bg-hover); }
.hct-metric--warn { border-color: var(--color-warning-border); }
.hct-metric--danger { border-color: var(--color-danger-border); }
.hct-metric__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.hct-metric__main { display: flex; align-items: baseline; gap: 6px; margin-top: 6px; }
.hct-metric__label { font-size: 0.75rem; line-height: 1rem; font-weight: 500; color: var(--color-text-tertiary); }
.hct-metric__value { font-size: 1.75rem; line-height: 2.125rem; letter-spacing: -0.01em; font-weight: 600; font-variant-numeric: tabular-nums; }
.hct-metric--danger .hct-metric__value { color: var(--color-danger-text); }
.hct-metric__unit { font-size: 0.8125rem; line-height: 1.125rem; color: var(--color-text-tertiary); }
```

**세부 치수**

- 모서리 8px, 1px 테두리, 바탕 `bg-surface`, 안쪽 여백 12px.
- 라벨 12px · 굵기 500 · `text-tertiary` → 6px 아래 → 값 `metric`(28/34px) · 굵기 600 · 고정폭 숫자, 단위 13px `text-tertiary` → 증감 12px → 작은 추이선.
- 상태별 테두리: 정상 `border-subtle` · 주의 `warning-border` · 위험 `danger-border` (위험이면 값 글자도 `danger-text`).
- **숫자를 누르면 그 조건의 목록으로 이동합니다.** 누를 수 있는 타일은 마우스를 올리면 테두리 `border-strong` · 바탕 `bg-hover`. 대시보드는 보기만 하는 화면이 아니라 지표 → 분해 → 목록으로 좁혀 들어가는 입구입니다.

### 위젯 (카드)

> **부품 카드** — `src/components/dashboard/MetricTile.jsx` · `Widget` · `WidgetGrid` · 브라우저 대조 3건

| 항목 | 내용 |
|---|---|
| 구조 | 머리 `제목 [설명] … [행동]` → 본문 → [바닥] |
| 기본 | 테두리 `border-subtle` · 바탕 `bg-surface` · 그림자 없음 |
| hover (마우스를 올림) | 해당 없음 |
| focus (키보드 포커스) | 해당 없음 |
| active (누르는 중 · 선택됨) | 해당 없음 |
| disabled | 해당 없음 |
| loading | 본문 자리에 글 줄 스켈레톤 5줄 · `role="status"` |
| error | 본문 자리에 오류 블록 |
| 토큰 | `--color-bg-surface` `--color-border-subtle` `--color-text-primary` `--color-text-tertiary` |
| 접근성 | `<section>` + 제목 `<h3>` |
| 할 것 | 넓은 위젯은 `WidgetGrid columns={3}` + `lg:col-span-2` |
| 하지 말 것 | 카드마다 그림자 · 다른 모서리 |

React (패키지):

```jsx
import { Widget } from 'hct-web-design-template'

<Widget title="처리량" description="최근 7일" actions={<Button size="sm">내보내기</Button>} loading={isLoading}>
  <LineChart … />
</Widget>
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<section class="hct-widget">
  <div class="hct-widget__head"><div><h3 class="hct-widget__title">처리량</h3><p class="hct-widget__desc">최근 7일</p></div></div>
  <div class="hct-widget__body">…</div>
</section>
```

```css
.hct-widget { display: flex; flex-direction: column; border: 1px solid var(--color-border-subtle); border-radius: 8px; background-color: var(--color-bg-surface); }
.hct-widget__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 10px 12px 8px; }
.hct-widget__title { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; color: var(--color-text-primary); }
.hct-widget__desc { margin: 2px 0 0; font-size: 0.75rem; line-height: 1rem; color: var(--color-text-tertiary); }
.hct-widget__body { flex: 1; min-height: 0; padding: 0 12px 12px; }
.hct-widget__foot { border-top: 1px solid var(--color-border-subtle); padding: 8px 12px; }
```

**세부 치수**

- 모서리 8px, 테두리 `border-subtle`, 바탕 `bg-surface`.
- 머리: 위 10px · 아래 8px · 좌우 12px 여백, 제목 + 오른쪽 행동.

### 페이지 머리

> **부품 카드** — `src/components/shell/AppShell.jsx` · `PageHeader` · 브라우저 대조 2건

| 항목 | 내용 |
|---|---|
| 구조 | [경로] → 제목 + 설명 · 오른쪽 행동 버튼 (640px 미만이면 제목 아래로) |
| 기본 | 제목 20/28px 600 · 설명 13px `text-tertiary` |
| hover (마우스를 올림) | 해당 없음 |
| focus (키보드 포커스) | 해당 없음 |
| active (누르는 중 · 선택됨) | 해당 없음 |
| disabled | 해당 없음 |
| loading | 해당 없음 |
| error | 해당 없음 |
| 토큰 | `--color-text-primary` `--color-text-tertiary` |
| 접근성 | 화면 제목은 `<h1>` 하나 |
| 할 것 | 행동 버튼은 오른쪽, primary 는 1개 |
| 하지 말 것 | 좁은 화면에서 제목을 한 줄로 자르기 |

React (패키지):

```jsx
import { PageHeader, Button } from 'hct-web-design-template'

<PageHeader title="계약 목록" description="이번 분기 계약" actions={<Button variant="primary">새 계약</Button>} />
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<header class="hct-page-head">
  <div><h1 class="hct-page-head__title">계약 목록</h1><p class="hct-page-head__desc">이번 분기 계약</p></div>
  <div class="hct-page-head__actions">…</div>
</header>
```

```css
.hct-page-head { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
@media (min-width: 640px) { .hct-page-head { flex-direction: row; align-items: flex-start; justify-content: space-between; gap: 16px; } }
.hct-page-head__title { margin: 0; font-size: 1.25rem; line-height: 1.75rem; font-weight: 600; color: var(--color-text-primary); }
@media (min-width: 640px) { .hct-page-head__title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } }
.hct-page-head__desc { margin: 4px 0 0; font-size: 0.8125rem; line-height: 1.125rem; color: var(--color-text-tertiary); }
.hct-page-head__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
```

**세부 치수**

- 제목 20/28px · 굵기 600 · `text-primary` (640px 이상에서 한 줄 말줄임), 설명 13px · `text-tertiary` · 제목 4px 아래.
- 행동 버튼은 오른쪽, 좁은 화면에서는 제목 아래로 내려가며 간격 12px. 머리 아래 20px 뒤에 내용 시작.

### 빈 상태

> **부품 카드** — `src/components/state/EmptyState.jsx` · `EmptyState` · `NoResults` · `ErrorState` · 브라우저 대조 4건

| 항목 | 내용 |
|---|---|
| 구조 | [아이콘 상자 40px] → 제목 → 설명(최대 380px) → [행동 버튼] |
| `size` | `sm` 위아래 32px · `md` **(기본)** 위아래 64px |
| 기본 | 빈 목록 — 무엇을 하면 채워지는지 행동 버튼 |
| hover (마우스를 올림) | 해당 없음 |
| focus (키보드 포커스) | 해당 없음 |
| active (누르는 중 · 선택됨) | 해당 없음 |
| disabled | 해당 없음 |
| loading | 해당 없음 |
| error | `ErrorState` — 아이콘 상자 `danger-bg` · `danger-text`, "다시 시도" |
| 토큰 | `--color-bg-sunken` `--color-text-tertiary` `--color-text-primary` `--color-danger-bg` `--color-danger-text` |
| 접근성 | 제목은 실제 제목 요소 · 검색 결과 0건(`NoResults`)은 "필터 초기화" 버튼을 함께 |
| 할 것 | 빈 상태 · 결과 없음 · 오류를 다른 문장으로 |
| 하지 말 것 | 빈 표 머리행만 남기기 |

React (패키지):

```jsx
import { EmptyState, ErrorState, Button } from 'hct-web-design-template'

<EmptyState icon={<InboxIcon />} title="받은 일이 없습니다" description="새 요청이 오면 여기에 표시됩니다" action={<Button>요청 만들기</Button>} />
<ErrorState onRetry={reload} />
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<div class="hct-empty">
  <div class="hct-empty__icon">…</div>
  <h3 class="hct-empty__title">받은 일이 없습니다</h3>
  <p class="hct-empty__desc">새 요청이 오면 여기에 표시됩니다</p>
</div>
```

```css
.hct-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 64px 24px; }
.hct-empty--sm { padding: 32px 16px; }
.hct-empty__icon { display: flex; width: 40px; height: 40px; align-items: center; justify-content: center; margin-bottom: 12px; border-radius: 8px; background-color: var(--color-bg-sunken); color: var(--color-text-tertiary); }
.hct-empty--error .hct-empty__icon { background-color: var(--color-danger-bg); color: var(--color-danger-text); }
.hct-empty__title { margin: 0; font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; color: var(--color-text-primary); }
.hct-empty__desc { margin: 4px 0 0; max-width: 380px; font-size: 0.8125rem; line-height: 1.125rem; color: var(--color-text-tertiary); }
.hct-empty__action { margin-top: 16px; }
```

**세부 치수**

- 가운데 정렬, 위아래 64px · 좌우 24px 여백 (작게: 32px · 16px). 아이콘 상자 40×40px · 모서리 8px · 바탕 `bg-sunken` · 아이콘 `text-tertiary`.
- 아이콘 상자 → 12px → 제목 14px · 굵기 600 → 4px → 설명 13px `text-tertiary` · 최대 폭 380px → 16px 아래 행동 버튼.
- **검색 · 필터 결과 0건**: 돋보기 아이콘 · "결과가 없습니다" · 검색어나 필터를 조정하라는 설명 · "필터 초기화"(secondary 단추).
- **오류 블록**(화면 일부를 불러오지 못했을 때): 빈 상태와 같은 배치에 아이콘 상자만 바탕 `danger-bg` · 아이콘 `danger-text`. 제목 "불러오지 못했습니다", 필요하면 12px 아래 세부 내용 칸(바탕 `bg-sunken` · 모서리 6px · 좌우 12px · 위아래 8px · 12px `text-tertiary`), 16px 아래 "다시 시도"(secondary 단추).

### 필터 줄 · 세그먼트 전환

> **부품 카드** — `src/components/input/FilterBar.jsx` · `FilterBar` · `FilterButton` · `SegmentedControl` · 브라우저 대조 6건

| 항목 | 내용 |
|---|---|
| 구조 | 필터 단추 `라벨 [값] ▾` 줄 → 적용된 필터 태그 줄 · 세그먼트 `[칸 [건수]]…` |
| `size` | `sm` 세그먼트 28px · 12px · `md` **(기본)** 세그먼트 32px |
| 기본 | 필터 단추 `bg-surface` · `border-default` · `text-secondary` / 세그먼트 칸 `text-tertiary` |
| hover (마우스를 올림) | 필터 단추 `bg-hover` / 세그먼트 칸 글자 `text-primary` |
| focus (키보드 포커스) | ③ 기본 레이어의 `:focus-visible` 링 — `2px solid var(--color-border-focus)` · 간격 1px |
| active (누르는 중 · 선택됨) | 값이 걸린 필터 — `accent-subtle` · `accent-border` · `accent-text` 500 / 고른 칸 — `bg-surface` · `text-primary` · `--shadow-sm` · `aria-selected="true"` |
| disabled | 해당 없음 |
| loading | 해당 없음 |
| error | 해당 없음 |
| 토큰 | `--color-bg-surface` `--color-border-default` `--color-text-secondary` `--color-bg-hover` `--color-accent-subtle` `--color-accent-border` `--color-accent-text` `--color-bg-sunken` `--color-text-primary` `--color-text-tertiary` `--shadow-sm` `--control-height-sm` `--control-height-md` |
| 접근성 | 세그먼트는 `role="tablist"` · 칸마다 `role="tab"` + `aria-selected` · 적용된 필터의 지움 단추에 이름 |
| 할 것 | 적용된 필터를 줄로 보여주고 "전체 초기화" |
| 하지 말 것 | 둘 이상 중 하나 고르기에 체크박스 |

React (패키지):

```jsx
import { FilterBar, FilterButton, SegmentedControl } from 'hct-web-design-template'

<SegmentedControl value={view} onChange={setView} options={[{ value: 'all', label: '전체', count: 42 }, { value: 'mine', label: '내 것' }]} />
<FilterBar><FilterButton label="상태" value="진행중" active onClick={openStatus} /></FilterBar>
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<div class="hct-segmented" role="tablist">
  <button type="button" role="tab" aria-selected="true" class="hct-segmented__tab">전체</button>
  <button type="button" role="tab" aria-selected="false" class="hct-segmented__tab">내 것</button>
</div>
<button type="button" class="hct-filter-btn hct-filter-btn--active"><span>상태</span><span class="hct-filter-btn__value">진행중</span><svg class="hct-filter-btn__caret" width="10" height="10" …/></button>
```

```css
.hct-filter-btn {
  display: inline-flex; height: var(--control-height-md); align-items: center; gap: 6px; padding: 0 8px;
  border: 1px solid var(--color-border-default); border-radius: 6px; background-color: var(--color-bg-surface);
  font-size: 0.875rem; line-height: 1.25rem; font-weight: 400; color: var(--color-text-secondary);
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-duration: var(--duration-instant);
}
.hct-filter-btn:hover { background-color: var(--color-bg-hover); }
.hct-filter-btn__caret { flex-shrink: 0; opacity: 0.6; }
.hct-filter-btn__value { font-weight: 500; }
.hct-filter-btn--active, .hct-filter-btn--active:hover {
  border-color: var(--color-accent-border); background-color: var(--color-accent-subtle); color: var(--color-accent-text); font-weight: 500;
}
.hct-segmented { display: inline-flex; align-items: center; gap: 2px; padding: 2px; border-radius: 6px; background-color: var(--color-bg-sunken); }
.hct-segmented__tab {
  height: var(--control-height-md); padding: 0 10px; border: 0; border-radius: 3px; background-color: transparent;
  font-size: 0.875rem; line-height: 1.25rem; font-weight: 500; color: var(--color-text-tertiary);
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-duration: var(--duration-instant);
}
.hct-segmented__tab:hover { color: var(--color-text-primary); }
.hct-segmented__tab[aria-selected="true"] { background-color: var(--color-bg-surface); color: var(--color-text-primary); box-shadow: var(--shadow-sm); }
.hct-segmented--sm .hct-segmented__tab { height: var(--control-height-sm); font-size: 0.75rem; line-height: 1rem; }
```

**세부 치수**

- 필터 줄: 요소 사이 8px, 넘치면 줄바꿈. 적용된 필터 줄은 8px 아래.
- 필터 단추: 높이 32px · 좌우 8px · 14px · 모서리 6px · 1px 테두리, 라벨과 값 사이 6px(값은 500), 오른쪽 10px 화살표(불투명도 60%). 기본 = 바탕 `bg-surface` · 테두리 `border-default` · 글자 `text-secondary`(마우스를 올리면 `bg-hover`). 값이 걸리면 바탕 `accent-subtle` · 테두리 `accent-border` · 글자 `accent-text` · 500.
- 적용된 필터 줄: "적용됨:" 12px `text-tertiary` → 중립 태그마다 이름 `text-tertiary` + 값 500 `text-primary` + 지움 단추, 태그 사이 6px → 끝에 "전체 초기화" 12px · 500 `text-link`(마우스를 올리면 밑줄).
- 세그먼트 전환(보기 · 기간처럼 둘 이상 중 하나를 고를 때): 바탕 `bg-sunken` · 모서리 6px · 안쪽 여백 2px · 칸 사이 2px. 칸은 높이 32px(작게 28px · 12px) · 좌우 10px · 500 · 모서리 3px — 고른 칸 바탕 `bg-surface` + `text-primary` + `--shadow-sm`, 나머지 `text-tertiary`(마우스를 올리면 `text-primary`). 건수를 붙이면 6px 띄워 고정폭 숫자 `text-tertiary`. `role="tablist"` · 칸마다 `role="tab"` + `aria-selected`.

### 드롭다운 · 선택 목록

> **부품 카드** — `src/components/input/Combobox.jsx` · `Combobox`

| 항목 | 내용 |
|---|---|
| 구조 | 입력 칸(트리거) → 4px 아래 목록 상자 `항목 [보조 글자]…` · 결과 없음 안내 |
| 기본 | 목록 `bg-raised` · `border-default` · `--shadow-lg` |
| hover (마우스를 올림) | 가리킨 항목 `accent-subtle` · `accent-text` |
| focus (키보드 포커스) | 키보드로 가리킨 항목도 hover 와 같은 모양 · 입력에 `aria-activedescendant` |
| active (누르는 중 · 선택됨) | 고른 값은 입력 칸 · 태그로 표시 |
| disabled | 입력 칸과 같음 |
| loading | 해당 없음 |
| error | 입력 칸과 같음 (`error`) |
| 토큰 | `--color-bg-raised` `--color-border-default` `--shadow-lg` `--color-text-primary` `--color-text-tertiary` `--color-accent-subtle` `--color-accent-text` |
| 접근성 | `role="combobox"` + `role="listbox"` · 항목마다 `role="option"` · ↑↓ 이동 · Enter 선택 · Esc 닫기 |
| 할 것 | 항목이 많으면 검색 입력을 겸하는 콤보박스 |
| 하지 말 것 | 목록 높이 제한 없이 화면 밖으로 |

React (패키지):

```jsx
import { Combobox } from 'hct-web-design-template'

<Combobox label="담당자" options={people} value={owner} onChange={setOwner} />
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<ul class="hct-listbox" role="listbox">
  <li role="option" aria-selected="true" class="hct-option">김하늘</li>
  <li role="option" aria-selected="false" class="hct-option">이바다</li>
</ul>
```

```css
.hct-listbox {
  margin: 4px 0 0; padding: 4px 0; list-style: none; max-height: 220px; overflow-y: auto;
  border: 1px solid var(--color-border-default); border-radius: 6px; background-color: var(--color-bg-raised); box-shadow: var(--shadow-lg);
}
.hct-option { display: flex; align-items: center; gap: 8px; padding: 4px 8px; font-size: 0.875rem; line-height: 1.25rem; color: var(--color-text-primary); cursor: pointer; }
.hct-option[aria-selected="true"], .hct-option:hover { background-color: var(--color-accent-subtle); color: var(--color-accent-text); }
```

**세부 치수**

- 목록 상자: 트리거 4px 아래 · 최대 높이 220px(넘치면 스크롤) · 위아래 여백 4px · 바탕 `bg-raised` · 1px `border-default` · 모서리 6px · `--shadow-lg`.
- 항목: 좌우 8px · 위아래 4px · 14px `text-primary`, 아이콘 · 아바타와 글자 사이 8px, 오른쪽 보조 글자 12px `text-tertiary`. 키보드 · 마우스로 가리킨 항목은 바탕 `accent-subtle` + 글자 `accent-text`. 검색어와 맞는 부분은 600 `accent-text`.
- 결과가 없으면 가운데 13px `text-tertiary` 안내 한 줄. `role="listbox"` · 항목마다 `role="option"`.

### 알림 띠 (페이지 위쪽 경고 · 안내)

> **부품 카드** — `src/components/feedback/StatusBadge.jsx` · `Banner` · 브라우저 대조 6건

| 항목 | 내용 |
|---|---|
| 구조 | [아이콘] 제목 / 본문 / [행동] … [닫기] |
| `tone` | `neutral` 일반 · `info` **(기본)** 안내 · `review` 검토 · `success` 완료 · `warning` 주의 · `danger` 위험 — `role="alert"` |
| 기본 | §2-3 색조의 `bg` · `text` · `border` |
| hover (마우스를 올림) | 닫기 단추 불투명도 70% → 100% |
| focus (키보드 포커스) | ③ 기본 레이어의 `:focus-visible` 링 — `2px solid var(--color-border-focus)` · 간격 1px |
| active (누르는 중 · 선택됨) | 해당 없음 |
| disabled | 해당 없음 |
| loading | 해당 없음 |
| error | `danger` 색조 + `role="alert"` |
| 토큰 | `--color-info-bg` `--color-info-text` `--color-info-border` `--color-danger-bg` `--color-danger-text` `--color-danger-border` |
| 접근성 | 위험은 `role="alert"`, 나머지는 `role="status"` · 닫기 단추 이름 "닫기" |
| 할 것 | 무엇을 하면 되는지 행동 단추를 함께 |
| 하지 말 것 | 같은 화면에 띠 여러 개 |

React (패키지):

```jsx
import { Banner, Button } from 'hct-web-design-template'

<Banner tone="warning" title="동기화 지연" action={<Button size="sm">다시 시도</Button>}>최근 10분 데이터가 늦습니다</Banner>
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<div class="hct-banner hct-banner--warning" role="status">
  <span class="hct-banner__icon" aria-hidden="true">!</span>
  <div><div class="hct-banner__title">동기화 지연</div><div class="hct-banner__body">최근 10분 데이터가 늦습니다</div></div>
</div>
```

```css
.hct-banner { display: flex; gap: 10px; padding: 10px 12px; border: 1px solid; border-radius: 6px; }
.hct-banner__icon { flex-shrink: 0; margin-top: 1px; font-size: 0.8125rem; line-height: 1.125rem; font-weight: 700; }
.hct-banner__title { font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; }
.hct-banner__body { font-size: 0.8125rem; line-height: 1.125rem; }
.hct-banner__title + .hct-banner__body { margin-top: 2px; }
.hct-banner--neutral { background-color: var(--color-neutral-bg); color: var(--color-neutral-text); border-color: var(--color-neutral-border); }
.hct-banner--info { background-color: var(--color-info-bg); color: var(--color-info-text); border-color: var(--color-info-border); }
.hct-banner--success { background-color: var(--color-success-bg); color: var(--color-success-text); border-color: var(--color-success-border); }
.hct-banner--warning { background-color: var(--color-warning-bg); color: var(--color-warning-text); border-color: var(--color-warning-border); }
.hct-banner--danger { background-color: var(--color-danger-bg); color: var(--color-danger-text); border-color: var(--color-danger-border); }
.hct-banner--review { background-color: var(--color-review-bg); color: var(--color-review-text); border-color: var(--color-review-border); }
```

**세부 치수**

- 모서리 6px · 1px 테두리 · 좌우 12px · 위아래 10px. 색은 §2-3 색조의 `bg` · `text` · `border`.
- 왼쪽 아이콘(13px · 굵게) → 10px → 제목 14px · 600 / 본문 13px(제목 2px 아래) / 행동 단추는 8px 아래. 닫기 단추(이름 "닫기" · 12px 아이콘 · 불투명도 70% → 마우스를 올리면 100%)는 오른쪽 끝.
- 위험 색조는 `role="alert"`, 나머지는 `role="status"`.

### 모달 · 확인 창

> **부품 카드** — `src/components/overlay/Modal.jsx` · `Modal` · `ConfirmDialog` · 브라우저 대조 3건

| 항목 | 내용 |
|---|---|
| 구조 | 덮는 막 → 창 `머리(제목 · 설명 · 닫기) → 본문 → 바닥(취소 · 실행)` |
| `size` | `sm` 400px · 확인 창 · `md` **(기본)** 560px · `lg` 760px · `xl` 1000px |
| 기본 | 창 `bg-raised` · `border-subtle` · `--shadow-overlay` · 뒤 `bg-overlay` |
| hover (마우스를 올림) | 해당 없음 |
| focus (키보드 포커스) | 열리면 창 안으로 · 닫히면 연 단추로 되돌림 |
| active (누르는 중 · 선택됨) | 해당 없음 |
| disabled | 해당 없음 |
| loading | 실행 단추 `loading` |
| error | 창 안 오류 문장 · 위험 실행은 `danger` 단추 |
| 토큰 | `--color-bg-raised` `--color-border-subtle` `--shadow-overlay` `--color-bg-overlay` `--color-text-primary` `--color-text-tertiary` |
| 접근성 | `role="dialog"` · `aria-modal="true"` · `aria-labelledby` 제목 · Esc 로 닫힘 · 열린 동안 뒤 스크롤 잠금 |
| 할 것 | 확인 창은 취소 왼쪽 · 실행 오른쪽 |
| 하지 말 것 | 모달 안에 모달 |

React (패키지):

```jsx
import { Modal, ConfirmDialog, Button } from 'hct-web-design-template'

<Modal open={open} onClose={close} title="계약 수정" footer={<><Button onClick={close}>취소</Button><Button variant="primary">저장</Button></>}>…</Modal>
<ConfirmDialog open={ask} tone="danger" title="삭제할까요?" confirmLabel="삭제" onConfirm={remove} onCancel={cancel} />
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<div class="hct-scrim"></div>
<div class="hct-modal" role="dialog" aria-modal="true" aria-labelledby="m-title">
  <div class="hct-modal__head"><h2 id="m-title" class="hct-modal__title">계약 수정</h2></div>
  <div class="hct-modal__body">…</div>
  <div class="hct-modal__foot">…</div>
</div>
```

```css
.hct-scrim { position: fixed; inset: 0; background-color: var(--color-bg-overlay); }
.hct-modal {
  position: relative; width: 100%; max-width: 560px; border: 1px solid var(--color-border-subtle); border-radius: 8px;
  background-color: var(--color-bg-raised); box-shadow: var(--shadow-overlay);
}
.hct-modal--sm { max-width: 400px; } .hct-modal--lg { max-width: 760px; } .hct-modal--xl { max-width: 1000px; }
.hct-modal__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--color-border-subtle); }
.hct-modal__title { margin: 0; font-size: 1rem; line-height: 1.5rem; font-weight: 600; color: var(--color-text-primary); }
.hct-modal__body { padding: 16px; }
.hct-modal__foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--color-border-subtle); }
```

**세부 치수**

- 뒤를 `bg-overlay` 로 덮고, 창은 위쪽에 붙여 가운데 정렬(화면 가장자리 16px, 640px 이상 32px).
- 창: 모서리 8px · 1px `border-subtle` · 바탕 `bg-raised` · `--shadow-overlay`. 폭: 작게 400 · 기본 560 · 크게 760 · 아주 크게 1000px.
- 머리: 좌우 16px · 위아래 12px · 아래 1px `border-subtle` — 제목 16px · 600, 설명 13px `text-tertiary`(2px 아래), 닫기 단추 28×28px. 본문 여백 16px. 바닥: 오른쪽 정렬 · 단추 사이 8px · 위 1px `border-subtle` · 좌우 16px · 위아래 12px.
- 확인 창(폭 400px): **취소가 왼쪽, 실행이 오른쪽.** 처음 포커스는 실행 단추. 되돌릴 수 없는 실행은 `danger` 단추.
- 열리면 포커스를 창 안으로 옮기고, 닫히면 연 단추로 되돌립니다. Esc 로 닫히고, 열린 동안 뒤 화면은 스크롤되지 않습니다.

### 서랍 (옆에서 열리는 상세 · 편집)

> **부품 카드** — `src/components/overlay/Modal.jsx` · `Drawer` · 브라우저 대조 3건

| 항목 | 내용 |
|---|---|
| 구조 | 덮는 막 → 오른쪽 판 `머리 48px(제목 · 보조 · 닫기) → 본문(스크롤) → 바닥` |
| `size` | `md` **(기본)** 360px · `lg` 480px · `xl` 640px |
| 기본 | 판 `bg-surface` · 왼쪽 `border-subtle` · `--shadow-overlay` |
| hover (마우스를 올림) | 해당 없음 |
| focus (키보드 포커스) | 모달과 같음 |
| active (누르는 중 · 선택됨) | 해당 없음 |
| disabled | 해당 없음 |
| loading | 본문 스켈레톤 |
| error | 본문 오류 블록 |
| 토큰 | `--color-bg-surface` `--color-border-subtle` `--shadow-overlay` `--color-bg-overlay` `--layout-right-panel-width` `--layout-right-panel-wide-width` `--layout-topbar-height` |
| 접근성 | 모달과 같음 (`role="dialog"` · Esc · 포커스 이동 · 스크롤 잠금) |
| 할 것 | 목록을 떠나지 않고 한 건을 보거나 고칠 때 |
| 하지 말 것 | 640px 미만에서 고정 폭 — 전체 폭으로 |

React (패키지):

```jsx
import { Drawer } from 'hct-web-design-template'

<Drawer open={!!selected} onClose={close} title={selected?.name} subtitle="계약" size="lg">…</Drawer>
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<div class="hct-scrim"></div>
<aside class="hct-drawer" role="dialog" aria-modal="true" aria-labelledby="d-title">
  <div class="hct-drawer__head"><h2 id="d-title" class="hct-drawer__title">계약 A</h2></div>
  <div class="hct-drawer__body">…</div>
</aside>
```

```css
.hct-drawer {
  position: fixed; top: 0; bottom: 0; right: 0; display: flex; flex-direction: column; width: 100%;
  border-left: 1px solid var(--color-border-subtle); background-color: var(--color-bg-surface); box-shadow: var(--shadow-overlay);
}
@media (min-width: 640px) {
  .hct-drawer { width: var(--layout-right-panel-width); }
  .hct-drawer--lg { width: var(--layout-right-panel-wide-width); }
  .hct-drawer--xl { width: 640px; }
}
.hct-drawer__head { display: flex; flex-shrink: 0; align-items: center; gap: 8px; height: var(--layout-topbar-height); padding: 0 16px; border-bottom: 1px solid var(--color-border-subtle); }
.hct-drawer__title { margin: 0; font-size: 0.8125rem; line-height: 1.125rem; font-weight: 600; color: var(--color-text-primary); }
.hct-drawer__body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; }
```

**세부 치수**

- 오른쪽에서 열리고 뒤를 `bg-overlay` 로 덮습니다. 바탕 `bg-surface` · 왼쪽 1px `border-subtle` · `--shadow-overlay`.
- 폭: 기본 360 · 넓게 480 · 아주 넓게 640px. 640px 미만 화면에서는 전체 폭.
- 머리 48px(아래 1px `border-subtle`, 좌우 16px): 제목 13px · 600 + 보조 11px `text-tertiary` + 닫기 단추 28×28px. 본문 여백 16px, 바닥은 모달과 같음.
- 포커스 이동 · Esc · 스크롤 잠금은 모달과 같습니다.

### 토스트

> **부품 카드** — `src/components/feedback/Toast.jsx` · `ToastProvider` · `useToast`

| 항목 | 내용 |
|---|---|
| 구조 | 글자 [│ 행동] [닫기] — 화면 아래 가운데에 쌓임 |
| `tone` | `neutral` 기본 · `success` 성공 · `warning` 주의 · `danger` 위험 |
| 기본 | `bg-raised` · `border-default` · `text-primary` · `--shadow-overlay` |
| hover (마우스를 올림) | 행동 · 닫기 단추 불투명도 변화 |
| focus (키보드 포커스) | ③ 기본 레이어의 `:focus-visible` 링 — `2px solid var(--color-border-focus)` · 간격 1px |
| active (누르는 중 · 선택됨) | 해당 없음 |
| disabled | 해당 없음 |
| loading | 해당 없음 |
| error | `danger` 색조 |
| 토큰 | `--color-bg-raised` `--color-border-default` `--color-text-primary` `--shadow-overlay` `--color-success-bg` `--color-success-text` `--color-danger-bg` `--color-danger-text` |
| 접근성 | `aria-live="polite"` 영역 안 · 6초 뒤 사라짐 — 꼭 알아야 할 내용은 토스트가 아니라 알림 띠 |
| 할 것 | 되돌리기 행동은 토스트의 행동 단추로 |
| 하지 말 것 | 뒤를 덮기 · 오류를 토스트로만 알리기 |

React (패키지):

```jsx
import { ToastProvider, useToast } from 'hct-web-design-template'

const toast = useToast()
toast({ message: '저장했습니다', tone: 'success', action: { label: '되돌리기', onClick: undo } })
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<div class="hct-toast-region" role="region" aria-label="알림" aria-live="polite">
  <div class="hct-toast hct-toast--success"><span>저장했습니다</span></div>
</div>
```

```css
.hct-toast-region { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: none; }
.hct-toast {
  pointer-events: auto; display: flex; align-items: center; gap: 12px; padding: 8px 12px; border: 1px solid var(--color-border-default);
  border-radius: 8px; background-color: var(--color-bg-raised); color: var(--color-text-primary); box-shadow: var(--shadow-overlay);
  font-size: 0.875rem; line-height: 1.25rem;
}
.hct-toast--success { background-color: var(--color-success-bg); color: var(--color-success-text); border-color: var(--color-success-border); }
.hct-toast--warning { background-color: var(--color-warning-bg); color: var(--color-warning-text); border-color: var(--color-warning-border); }
.hct-toast--danger { background-color: var(--color-danger-bg); color: var(--color-danger-text); border-color: var(--color-danger-border); }
```

**세부 치수**

- 화면 아래 가운데(바닥에서 16px). 여러 개면 8px 간격으로 쌓습니다. 뒤를 덮지 않습니다.
- 모서리 8px · 1px 테두리 · 좌우 12px · 위아래 8px · `--shadow-overlay`, 내용 사이 12px, 글자 14px.
- 색: 기본 = 바탕 `bg-raised` · 테두리 `border-default` · 글자 `text-primary`. 성공 · 주의 · 위험 = 해당 색조의 `bg` · `border` · `text`.
- 행동이 있으면 1px × 16px 세로 구분선(`border-default`) 뒤에 14px · 600 밑줄 글자.
- 기본 6초 뒤 사라집니다(시간을 0 으로 주면 자동으로 사라지지 않음). 스크린리더가 읽도록 `aria-live="polite"` 영역에 넣습니다.

### 스켈레톤 (로딩)

> **부품 카드** — `src/components/state/Skeleton.jsx` · `Skeleton` · `SkeletonText` · `SkeletonTable` · `SkeletonStatCard` · 브라우저 대조 1건

| 항목 | 내용 |
|---|---|
| 구조 | 실제 내용과 같은 모양의 회색 막대 — 글 줄 · 표 · 지표 카드 |
| `density` | `compact` 32px · `default` **(기본)** 40px · `relaxed` 48px |
| 기본 | 막대 `bg-sunken` + 1.6초 반짝임 |
| hover (마우스를 올림) | 해당 없음 |
| focus (키보드 포커스) | 해당 없음 |
| active (누르는 중 · 선택됨) | 해당 없음 |
| disabled | 해당 없음 |
| loading | 이 부품 자체가 로딩 상태 — 묶음에 `role="status"` · 이름 "불러오는 중" |
| error | 해당 없음 |
| 토큰 | `--color-bg-sunken` `--color-bg-hover` `--color-border-subtle` `--row-height-compact` `--row-height-default` `--row-height-relaxed` |
| 접근성 | 막대 하나하나는 `aria-hidden`, 묶음 하나만 `role="status"` · 움직임 줄이기에서는 반짝임이 멈춥니다 (③) |
| 할 것 | 200ms 안에 끝나는 로딩에는 표시하지 않기 |
| 하지 말 것 | 돌아가는 원 하나로 화면 전체 대신 |

React (패키지):

```jsx
import { SkeletonTable, SkeletonText } from 'hct-web-design-template'

{loading ? <SkeletonTable rows={6} columns={4} density="default" /> : <DataGrid … />}
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<div role="status" aria-label="불러오는 중">
  <div class="hct-skeleton hct-skeleton--line" aria-hidden="true"></div>
  <div class="hct-skeleton hct-skeleton--line hct-skeleton--last" aria-hidden="true"></div>
</div>
```

```css
.hct-skeleton { position: relative; overflow: hidden; border-radius: 3px; background-color: var(--color-bg-sunken); }
.hct-skeleton::after {
  content: ''; position: absolute; inset: 0; transform: translateX(-100%); animation: hct-shimmer 1.6s infinite;
  background-image: linear-gradient(to right, transparent, var(--color-bg-hover), transparent);
}
.hct-skeleton--line { height: 12px; width: 100%; }
.hct-skeleton--line + .hct-skeleton--line { margin-top: 6px; }
.hct-skeleton--last { width: 66.666667%; }
```

**세부 치수**

- 막대: 모서리 3px · 바탕 `bg-sunken` + 1.6초 반복 반짝임(투명 → `bg-hover` → 투명이 왼쪽에서 오른쪽으로 지나감). 라이트 테마에서는 `bg-hover` 와 `bg-sunken` 이 같은 색이라 반짝임이 보이지 않습니다 — 패키지도 같으며, 회색 막대만 보이는 것이 정상입니다.
- 글 줄: 높이 12px · 줄 사이 6px · 마지막 줄 폭 2/3.
- 표: 머리행 32px `bg-sunken` + 그 표의 행 높이로 6행, 행 아래 1px `border-subtle`, 좌우 12px · 칸 사이 16px, 첫 열을 1.6배 넓게. `role="status"` · 이름 "불러오는 중".
- 지표 카드: 모서리 8px · 1px `border-subtle` · `bg-surface` · 여백 16px, 막대 높이 10px → 12px 아래 24px → 8px 아래 10px.

### 떠 있는 것 · 포커스

> **부품 카드** — 부품 없음 — 규칙

| 항목 | 내용 |
|---|---|
| 구조 | 부품이 아니라 규칙 — 드롭다운 · 팝오버 · 툴팁 · 모달 · 서랍 · 토스트가 함께 따릅니다 |
| 기본 | 드롭다운 · 툴팁 `bg-raised` + `--shadow-lg` · 모달 `bg-raised` + `--shadow-overlay` |
| hover (마우스를 올림) | 해당 없음 |
| focus (키보드 포커스) | ③ 기본 레이어의 `:focus-visible` 링 — `2px solid var(--color-border-focus)` · 간격 1px |
| active (누르는 중 · 선택됨) | 해당 없음 |
| disabled | 해당 없음 |
| loading | 해당 없음 |
| error | 해당 없음 |
| 토큰 | `--color-bg-raised` `--color-border-default` `--shadow-lg` `--shadow-overlay` `--color-bg-overlay` `--color-border-focus` |
| 접근성 | 포커스 링은 절대 지우지 않음 — 지우려면 그 자리에 같은 대비의 다른 표시 |
| 할 것 | 뒤를 덮는 것은 모달 · 명령 팔레트 · 서랍 · 좁은 화면 사이드바뿐 |
| 하지 말 것 | `outline: none` 만 쓰기 |

React (패키지):

```jsx
/* 별도 부품 없음 — 각 부품이 이 규칙을 따릅니다 */
```

순수 HTML + CSS (패키지 없이 — §2-1 의 세 블록과 §7 첫머리의 공통 CSS 를 붙인 뒤):

```html
<div class="hct-popover" role="dialog">…</div>
```

```css
.hct-popover { border: 1px solid var(--color-border-default); border-radius: 6px; background-color: var(--color-bg-raised); box-shadow: var(--shadow-lg); }
```

**세부 치수**

- 드롭다운 · 팝오버 · 차트 툴팁: 바탕 `bg-raised` · 1px `border-default` · 모서리 6px · `--shadow-lg`. 뒤를 덮지 않습니다.
- 모달 · 명령 팔레트: 바탕 `bg-raised` + `--shadow-overlay`. 서랍: 바탕 `bg-surface` + `--shadow-overlay`.
- **뒤를 `bg-overlay` 로 덮는 것은 모달 · 명령 팔레트 · 서랍 · 1024px 미만의 사이드바 서랍뿐**입니다. 토스트 · 하단 선택 바 · 저장 바는 `--shadow-overlay` 를 쓰지만 덮지 않습니다.
- **포커스 링**: `outline: 2px solid var(--color-border-focus); outline-offset: 1px;` 모서리 3px(③ 기본 레이어에 포함) — 절대 지우지 않습니다.

---

## 8. 화면마다 반드시

**상태 3종 — 하나라도 없으면 완료가 아닙니다.**

| 상태 | 해야 할 것 |
|---|---|
| 로딩 | 같은 자리 · 같은 크기의 스켈레톤(표는 회색 줄 6행). 카드 · 위젯을 **감추지 말고** 로딩 상태로 둡니다 — 사라졌다 나타나면 아래 내용이 통째로 밀립니다. |
| 빈 상태 | 데이터가 0건이면 빈 상태 블록(무엇이 없는지 + 다음 행동). 필터 결과가 0건이면 "조건에 맞는 항목이 없습니다" + 필터 초기화 버튼. 빈 배열이면 아무것도 안 그리는 것은 금지. |
| 오류 | 무엇이 실패했는지 + 다시 시도 버튼. |

**접근성 (WCAG 2.1 AA)**

- 상태 · 오류는 색만으로 전달하지 않습니다. 항상 글자를 함께 씁니다.
- 키보드 Tab 만으로 모든 조작이 가능해야 합니다. 포커스 링을 지우지 않습니다.
- 아이콘만 있는 버튼에는 이름(`aria-label`)을 붙입니다. 입력에는 라벨을 붙입니다.
- 셸 맨 앞에 **본문으로 건너뛰기** 링크를 둡니다. 평소에는 숨어 있다가 Tab 첫 입력에 나타납니다. 없으면 키보드 사용자는 화면을 바꿀 때마다 사이드바 항목 전체를 지나야 본문에 닿습니다.
- 되돌릴 수 없는 작업에는 **무슨 일이 일어나는지** 확인 창에 적습니다.

---

## 9. 금지 사항과 점검표

| 하지 말 것 | 대신 할 것 |
|---|---|
| `#333`, `rgb(…)` 등 색을 직접 씀 | `var(--color-text-primary)` 등 토큰 |
| 프레임워크 기본 팔레트 (`gray-100`, `blue-500`) | 토큰 |
| 다크 모드용 스타일을 따로 씀 | 아무것도 안 함 — 토큰이 처리 |
| 13px · 7px 같은 임의 간격 | §5 허용값 (4px 그리드) |
| 상태 색을 화면에서 고름 | 상태 이름 → 색조 표 (§2-3) |
| 사이드바 안에서 본문 글자 변수 | `--color-sidebar-*` |
| 로고 대신 "HCT" 글자 | §3 로고 파일 |
| 화면마다 메뉴 · 부품을 새로 만듦 | 한 번 만들어 재사용 |
| 로딩 스피너 하나만 | 같은 자리 스켈레톤 |

**끝내기 전에 직접 열어서 확인합니다** — 코드만 읽어서는 안 잡힙니다.

- [ ] 다크 모드에서 열어봤다 (`<html data-theme="dark">`)
- [ ] **390px 폭**에서 열어봤다 — 제목과 행동 버튼이 겹치지 않는다
- [ ] 1024px 미만에서 사이드바가 서랍으로 바뀐다
- [ ] 데이터 0건 · 로딩 중 · 오류 화면이 모두 있다
- [ ] 키보드 Tab 만으로 전부 조작된다
- [ ] 가로 스크롤이 생기지 않는다
- [ ] 글자가 잘린 곳이 없다 (축 라벨 · 배지 · 사이드바 항목)
- [ ] 같은 숫자가 화면 안에서 두 값으로 보이지 않는다
- [ ] 화면 코드에 `#RRGGBB` 가 없다

---

## 10. 이 파일만으로 안 되는 것

이 파일은 **겉모습**(색 · 서체 · 간격 · 레이아웃 · 부품 치수)을 정확히 맞춥니다. 아래는 패키지에만 있습니다.

| 패키지에만 있는 것 | 이 파일만 쓸 때 |
|---|---|
| 완성된 부품 — 인라인 편집 표, 보드 뷰, 필터 빌더, 대용량 가상화, 명령 팔레트, 차트, 가져오기 마법사 등 | 직접 만들어야 합니다. §7 규격을 지키는 것이 같은 모양을 유지하는 유일한 장치입니다. |
| 화면 원형 16종 (목록 · 대시보드 · 설정 · 승인 · 감사 로그 …) | 저장소 `src/pages/` 의 코드를 참고만 할 수 있습니다. |
| 디자인 규칙 검사기 (`lint-design`) — 직접 쓴 색 · 임의 간격 · 다크 전용 스타일을 찾아냄 | 잡아 주는 장치가 없습니다. §9 점검표를 사람이(또는 에이전트가) 직접 확인합니다. |
| 프레임워크 기본 팔레트 제거 — 틀린 색 클래스는 아예 생성되지 않음 | 틀린 색도 화면에 그대로 나옵니다. |
| 접근성 검증을 통과한 부품 · 화면 원형 — 저장소 CI 가 모든 원형을 axe 로 검사 (WCAG 2.1 A/AA) | 직접 확인합니다 (§8). |

**팔레트는 `hct` 하나입니다.** 다른 팔레트는 두지 않습니다. 브랜드가 바뀔 때만 저장소의 `tokens/palettes.json` 을 고칩니다. 상태 색은 팔레트와 무관하게 고정입니다.

| 팔레트 | 성격 | 강조색 | 사이드바 (라이트 테마) |
|---|---|---|---|
| `hct` **(기본 — 이 파일의 값)** | 로고색 강조 · 짙은 남색 사이드바 | `#2F4A9C` | 어두움 (`#17264D`) |

여러 에이전트가 오래 나눠 만드는 React 제품이라면 패키지를, 그 밖의 환경 · 빠른 시안 · 디자인 도구에는 이 파일을 쓰는 것을 권합니다.

---

## 11. 저장소에서 더 보기

- [`AGENTS.md`](https://github.com/hctinno/HCT-WEB-DESIGN-TEMPLATE/blob/main/AGENTS.md) — 패키지로 화면을 만들 때의 전체 규칙 (컴포넌트 API · 데이터 모델 · 키보드 조작)
- [`docs/layout.md`](https://github.com/hctinno/HCT-WEB-DESIGN-TEMPLATE/blob/main/docs/layout.md) · [`docs/density.md`](https://github.com/hctinno/HCT-WEB-DESIGN-TEMPLATE/blob/main/docs/density.md) · [`docs/status-colors.md`](https://github.com/hctinno/HCT-WEB-DESIGN-TEMPLATE/blob/main/docs/status-colors.md) — 주제별 상세 문서
- [`tokens/tokens.json`](https://github.com/hctinno/HCT-WEB-DESIGN-TEMPLATE/blob/main/tokens/tokens.json) · [`tokens/palettes.json`](https://github.com/hctinno/HCT-WEB-DESIGN-TEMPLATE/blob/main/tokens/palettes.json) — 토큰 원본
- 참고한 제품: 지라(고밀도 · 상태 색), 노션(사이드바 · 문서형 상세), 슬랙(어두운 사이드바 · 밝은 본문), 리니어(타이포 스케일).

---

<sub>생성 파일입니다. `scripts/build-design-md.mjs` 가 `src/styles/tokens.css` · `palettes.css`(원본 `tokens/*.json`) · `base.css` · 컴포넌트 코드에서 만듭니다. 설명 문장을 고치려면 `scripts/design-md.template.md` 를 고친 뒤 `npm run tokens:build` 를 실행하세요.</sub>
