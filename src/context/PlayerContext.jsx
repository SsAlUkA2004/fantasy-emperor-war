import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isConfigured } from '../firebase'
import { loadPlayer } from '../lib/auth'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const [user, setUser] = useState(null)
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }

    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setPlayer(u ? await loadPlayer(u.uid) : null)
      setLoading(false)
    })
  }, [])

  async function refresh() {
    if (user) setPlayer(await loadPlayer(user.uid))
  }

  return (
    <PlayerContext.Provider value={{ user, player, loading, refresh }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer ต้องอยู่ภายใน PlayerProvider')
  return ctx
}
