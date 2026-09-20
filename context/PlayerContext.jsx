import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isConfigured } from '../firebase'
import { loadPlayer } from '../lib/auth'
import { settleLogs } from '../lib/defenselog'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const [user, setUser] = useState(null)
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [attacked, setAttacked] = useState(null)

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }

    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      const p = u ? await loadPlayer(u.uid) : null
      setPlayer(p)
      setLoading(false)

      // หักแต้มจากใบบันทึกการถูกโจมตีทันทีที่ล็อกอินเข้ามา
      // ไม่รอให้เปิดหน้าประลองก่อน เพราะผู้เล่นอาจไม่แวะหน้านั้นเลยหลายวัน
      // ทำให้แต้มดูเหมือนไม่ลดทั้งที่จริงมีคนมาท้าแล้วชนะไปแล้ว
      if (u && p) {
        const s = await settleLogs({ ...p, uid: u.uid }).catch(() => null)
        if (s) {
          setAttacked(s)
          setPlayer(await loadPlayer(u.uid))
        }
      }
    })
  }, [])

  async function refresh() {
    if (user) setPlayer(await loadPlayer(user.uid))
  }

  return (
    <PlayerContext.Provider
      value={{ user, player, loading, refresh, attacked, clearAttacked: () => setAttacked(null) }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer ต้องอยู่ภายใน PlayerProvider')
  return ctx
}
