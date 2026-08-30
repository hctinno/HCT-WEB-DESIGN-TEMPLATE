// 라이브러리 빌드 — 다른 프로젝트가 import 할 수 있는 형태로 내보냅니다.
//
//   npm run build:lib   →  dist/index.js
//
// 무엇을 넣고 무엇을 뺐는가:
//   - react / react-dom 은 external. 번들에 넣으면 앱과 리액트가 두 벌이 되어
//     훅이 깨집니다. peerDependencies 로 선언해 앱의 것을 씁니다.
//   - CSS 는 번들하지 않습니다. 앱이 자기 Tailwind 로 처리해야 하므로
//     src/styles/*.css 를 그대로 배포합니다(package.json 의 files 참고).
//   - 로고는 data URI 로 인라인합니다. 앱의 자산 경로 설정에 의존하지 않도록.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 64 * 1024,
    lib: {
      entry: {
        index: resolve('src/components/index.js'),
        /* 화면 원형도 그대로 가져다 고칠 수 있게 함께 내보냅니다 */
        pages: resolve('src/pages/index.js'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: { entryFileNames: '[name].js', chunkFileNames: 'chunks/[name]-[hash].js' },
    },
  },
})
