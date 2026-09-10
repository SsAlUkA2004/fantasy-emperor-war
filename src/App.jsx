import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import TitleScreen from './pages/TitleScreen'
import Status from './pages/Status'

// ใช้ HashRouter ไม่ใช่ BrowserRouter
// เพราะ GitHub Pages เป็นโฮสต์ไฟล์นิ่ง ถ้าผู้เล่นรีเฟรชหน้าที่ path ลึก ๆ
// เซิร์ฟเวอร์จะหาไฟล์นั้นไม่เจอแล้วขึ้น 404
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/status" element={<Status />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
