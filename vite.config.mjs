import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** 미리보기용 설정. 실제 앱은 각자의 설정을 씁니다. */
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: '127.0.0.1' },
})
