import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { loadCollection } from '../lib/player'
import { getCharacter, ELEMENTS, ROLES } from '../data/characters'
import { signOut } from '../lib/auth'

export default function Lobby() {
  const { user, player } = usePlayer()
  const [owned, setOwned] = useState(null)

  useEffect(() => {
    loadCollection(user.uid).then(setOwned)
  }, [user.uid])

  return (
    <main className="screen top">
      <div className="sheet">
        <header className="lobby-head">
          <div>
            <h1>{player.username}</h1>
            <p className="meta">ผู้ฝึกหัด · 0 แต้ม</p>
          </div>
          <div className="purse">
            <span className="gem">◆</span>
            {player.gems.toLocaleString('th-TH')}
          </div>
        </header>

        <section className="roster">
          <h2 className="section-title">ผู้ติดตาม</h2>

          {owned === null && <p className="meta">กำลังเปิดกระเป๋า</p>}

          {owned?.map((entry) => {
            const c = getCharacter(entry.id)
            if (!c) return null
            return (
              <div className="card" key={entry.id}>
                <span className="card-mark">{ELEMENTS[c.element].mark}</span>
                <div className="card-body">
                  <h3>
                    {c.name}
                    <span className="rarity">{c.rarity}</span>
                  </h3>
                  <p className="meta">
                    {ROLES[c.role]} · เลเวล {entry.level} · {'★'.repeat(entry.star)}
                  </p>
                </div>
              </div>
            )
          })}
        </section>

        <section className="soon">
          <h2 className="section-title">ยังไม่เปิด</h2>
          <p className="meta">กาชาและการประลองจะเปิดในเฟสถัดไป</p>
        </section>

        <Link className="rune-link block" to="/stages">
          ออกผจญภัย
        </Link>

        <div className="gate">
          <Link className="rune-link" to="/status">
            รายละเอียดระบบ
          </Link>
          <button className="rune-link" onClick={signOut}>
            ออกจากระบบ
          </button>
        </div>
      </div>
    </main>
  )
}
