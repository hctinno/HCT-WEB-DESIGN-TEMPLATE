import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** 미리보기용 설정. 실제 앱은 각자의 설정을 씁니다. */
export default defineConfig({
  plugins: [react()],
  /* 로고(최대 10KB)를 data URI 로 인라인합니다 — 단일 파일 배포·임베드에서
     외부 자산 참조가 깨지지 않도록. */
  build: { assetsInlineLimit: 24 * 1024 },
  server: { port: 5173, host: '127.0.0.1' },
})
