import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PlayerProvider, usePlayer } from './context/PlayerContext'
import TitleScreen from './pages/TitleScreen'
import ChooseStarter from './pages/ChooseStarter'
import Lobby from './pages/Lobby'
import Status from './pages/Status'

// ใช้ HashRouter ไม่ใช่ BrowserRouter
// เพราะ GitHub Pages เป็นโฮสต์ไฟล์นิ่ง ถ้าผู้เล่นรีเฟรชหน้าที่ path ลึก ๆ
// เซิร์ฟเวอร์จะหาไฟล์นั้นไม่เจอแล้วขึ้น 404

function Gate() {
  const { user, player, loading } = usePlayer()

  if (loading) {
    return (
      <main className="screen">
        <p className="meta">กำลังเปิดประตูอาณาจักร</p>
      </main>
    )
  }

  if (!user) return <TitleScreen />
  if (!player) return <TitleScreen />
  if (!player.starterChosen) return <ChooseStarter />
  return <Lobby />
}

export default function App() {
  return (
    <PlayerProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Gate />} />
          <Route path="/status" element={<Status />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </PlayerProvider>
  )
}
