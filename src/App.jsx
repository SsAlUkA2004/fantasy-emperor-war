import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PlayerProvider, usePlayer } from './context/PlayerContext'
import TitleScreen from './pages/TitleScreen'
import ChooseStarter from './pages/ChooseStarter'
import Lobby from './pages/Lobby'
import StageMap from './pages/StageMap'
import Battle from './pages/Battle'
import Hero from './pages/Hero'
import Friends from './pages/Friends'
import Gacha from './pages/Gacha'
import Team from './pages/Team'
import Redeem from './pages/Redeem'
import Shop from './pages/Shop'
import Status from './pages/Status'

// ใช้ HashRouter ไม่ใช่ BrowserRouter
// เพราะ GitHub Pages เป็นโฮสต์ไฟล์นิ่ง ถ้าผู้เล่นรีเฟรชหน้าที่ path ลึก ๆ
// เซิร์ฟเวอร์จะหาไฟล์นั้นไม่เจอแล้วขึ้น 404

function Gate({ children }) {
  const { user, player, loading } = usePlayer()

  if (loading) {
    return (
      <main className="screen">
        <p className="meta">กำลังเปิดประตูอาณาจักร</p>
      </main>
    )
  }

  if (!user || !player) return <TitleScreen />
  if (!player.starterChosen) return <ChooseStarter />
  return children
}

export default function App() {
  return (
    <PlayerProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Gate><Lobby /></Gate>} />
          <Route path="/stages" element={<Gate><StageMap /></Gate>} />
          <Route path="/battle/:stageId" element={<Gate><Battle /></Gate>} />
          <Route path="/hero/:charId" element={<Gate><Hero /></Gate>} />
          <Route path="/friends" element={<Gate><Friends /></Gate>} />
          <Route path="/gacha" element={<Gate><Gacha /></Gate>} />
          <Route path="/team" element={<Gate><Team /></Gate>} />
          <Route path="/redeem" element={<Gate><Redeem /></Gate>} />
          <Route path="/shop" element={<Gate><Shop /></Gate>} />
          <Route path="/status" element={<Status />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </PlayerProvider>
  )
}
