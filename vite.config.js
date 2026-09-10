import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base ต้องเป็น '/<ชื่อ repo>/' เสมอ ไม่งั้น GitHub Pages จะหาไฟล์ JS/CSS ไม่เจอ
// แล้วขึ้นหน้าขาว ๆ โดยไม่มี error ให้เห็น
export default defineConfig({
  plugins: [react()],
  base: '/fantasy-emperor-war/',
})
