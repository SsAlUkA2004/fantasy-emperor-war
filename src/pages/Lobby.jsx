import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { loadCollection } from '../lib/player'
import { getCharacter, ELEMENTS, ROLES } from '../data/characters'
import { expToNext, levelCap, playerExpToNext, PLAYER_MAX_LEVEL } from '../lib/leveling'
import { heroStats } from '../lib/stats'
import StatPeek from '../components/StatPeek'
import TeamStrip from '../components/TeamStrip'
import { signOut } from '../lib/auth'

function statRows(charId, level, star) {
  const s = heroStats(charId, level, star)
  return [
    ['พลังชีวิต', s.hp],
    ['โจมตี', s.atk],
    ['ป้องกัน', s.def],
    ['ความเร็ว', s.spd],
  ]
}

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
            <p className="meta">
              เลเวล {player.playerLevel ?? 1} · ผู้ฝึกหัด · {player.pvpPoints ?? 0} แต้ม
            </p>
            {(player.playerLevel ?? 1) < PLAYER_MAX_LEVEL && (
              <div className="bar thin">
                <span
                  style={{
                    width: `${Math.round(((player.playerExp ?? 0) / playerExpToNext(player.playerLevel ?? 1)) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
          <div className="purse">
            <span className="gem">◆</span>
            {player.gems.toLocaleString('th-TH')}
          </div>
        </header>

        <h2 className="section-title">ทีมออกรบ</h2>
        <TeamStrip team={player.team} />

        <section className="roster">
          <h2 className="section-title">ผู้ติดตาม</h2>

          {owned === null && <p className="meta">กำลังเปิดกระเป๋า</p>}

          {owned?.map((entry) => {
            const c = getCharacter(entry.id)
            if (!c) return null
            return (
              <Link className="card peek-host" to={`/hero/${entry.id}`} key={entry.id}>
                <span className="card-mark">{ELEMENTS[c.element].mark}</span>
                <div className="card-body">
                  <h3>
                    {c.name}
                    <span className="rarity">{c.rarity}</span>
                  </h3>
                  <p className="meta">
                    {ROLES[c.role]} · เลเวล {entry.level} · {'★'.repeat(entry.star)}
                  </p>
                  {entry.level < levelCap(c.rarity, entry.star) && (
                    <div className="bar thin">
                      <span
                        style={{ width: `${Math.round((entry.exp / expToNext(entry.level)) * 100)}%` }}
                      />
                    </div>
                  )}
                  <p className="meta tiny">
                    {entry.level >= levelCap(c.rarity, entry.star)
                      ? `ตันที่เพดาน ${levelCap(c.rarity, entry.star)}`
                      : `${entry.exp} / ${expToNext(entry.level)}`}
                  </p>
                </div>
                <span className="card-more">›</span>
                <StatPeek
                  title={c.name}
                  subtitle={`เลเวล ${entry.level} · ${'★'.repeat(entry.star)}`}
                  element={c.element}
                  stats={statRows(c.id, entry.level, entry.star)}
                  note={c.skill.name}
                />
              </Link>
            )
          })}
        </section>

        <section className="soon">
          <h2 className="section-title">ยังไม่เปิด</h2>
          <p className="meta">การประลองจะเปิดในเฟสถัดไป</p>
        </section>

        <Link className="rune-link block" to="/stages">
          ออกผจญภัย
        </Link>

        <div className="gate">
          <Link className="rune-link" to="/gacha">
            อัญเชิญ
          </Link>
          <Link className="rune-link" to="/team">
            จัดทีม
          </Link>
          <Link className="rune-link" to="/redeem">
            แลกโค้ด
          </Link>
          <Link className="rune-link" to="/friends">
            เพื่อน
          </Link>
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
