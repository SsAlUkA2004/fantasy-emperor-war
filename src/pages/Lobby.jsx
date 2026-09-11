import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { loadCollection } from '../lib/player'
import { getCharacter, ELEMENTS, ROLES, TEAM_SIZE } from '../data/characters'
import { expToNext, playerExpToNext, PLAYER_MAX_LEVEL } from '../lib/leveling'
import { entryStats, entryLevelCap } from '../lib/stats'
import { entryPower, teamPower, formatPower } from '../lib/power'
import { effectiveRarity } from '../data/ascension'
import { rankLabel, rankOf, titleName } from '../data/ranks'
import StatPeek from '../components/StatPeek'
import { signOut } from '../lib/auth'

function statRows(entry) {
  const s = entryStats(entry.id, entry)
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

  // เรียงตามลำดับที่จัดไว้ในทีม ไม่ใช่ลำดับที่ได้ตัวละครมา
  const active = owned
    ? (player.team ?? []).map((id) => owned.find((o) => o.id === id)).filter(Boolean)
    : null

  return (
    <main className="screen top">
      <div className="sheet">
        <header className="lobby-head">
          <div>
            <h1>{player.username}</h1>
            <p className="meta">
              {rankOf(player.pvpPoints ?? 0).mark} {rankLabel(player.pvpPoints ?? 0)} ·{' '}
              {player.pvpPoints ?? 0} แต้ม
            </p>
            <p className="meta title-line">{titleName(player.titleIndex ?? 0)}</p>

            <div className="level-block">
              <div className="level-line">
                <span className="hero-level">เลเวล {player.playerLevel ?? 1}</span>
                <span className="meta tiny">
                  {(player.playerLevel ?? 1) >= PLAYER_MAX_LEVEL
                    ? 'ถึงเลเวลสูงสุดแล้ว'
                    : `${(player.playerExp ?? 0).toLocaleString('th-TH')} / ${playerExpToNext(
                        player.playerLevel ?? 1
                      ).toLocaleString('th-TH')} exp`}
                </span>
              </div>

              {(player.playerLevel ?? 1) < PLAYER_MAX_LEVEL && (
                <>
                  <div className="bar thin wide">
                    <span
                      style={{
                        width: `${Math.round(((player.playerExp ?? 0) / playerExpToNext(player.playerLevel ?? 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="meta tiny source-note">
                    ได้จากผ่านด่านครั้งแรกและเหมืองคริสตัลเท่านั้น ลานฝึกไม่ให้
                  </p>
                  <p className="meta tiny">
                    อีก{' '}
                    {(
                      playerExpToNext(player.playerLevel ?? 1) - (player.playerExp ?? 0)
                    ).toLocaleString('th-TH')}{' '}
                    หน่วยจะขึ้นเลเวล {(player.playerLevel ?? 1) + 1}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="purse-stack">
            <div className="purse">
              <span className="gem">◆</span>
              {player.gems.toLocaleString('th-TH')}
            </div>
            {active && (
              <div className="purse cp-big">
                <span className="cp-mark">⚔</span>
                {formatPower(teamPower(active))}
              </div>
            )}
          </div>
        </header>

        <section className="roster">
          <div className="roster-head">
            <h2 className="section-title flush">ผู้ติดตามที่ใช้อยู่</h2>
            <Link className="plain-link inline" to="/team">
              จัดทีม
            </Link>
          </div>

          {owned === null && <p className="meta">กำลังเปิดกระเป๋า</p>}

          {active?.length === 0 && <p className="meta">ยังไม่ได้เลือกใครเข้าทีม</p>}

          {active?.map((entry) => {
            const c = getCharacter(entry.id)
            if (!c) return null
            return (
              <Link className="card peek-host" to={`/hero/${entry.id}`} key={entry.id}>
                <span className="card-mark">{ELEMENTS[c.element].mark}</span>
                <div className="card-body">
                  <h3>
                    {c.name}
                    <span className="rarity">{effectiveRarity(entry.id, entry.tier)}</span>
                  </h3>
                  <p className="meta">
                    {ROLES[c.role]} · เลเวล {entry.level} · {'★'.repeat(entry.star)} ·{' '}
                    <span className="cp">⚔ {formatPower(entryPower(entry))}</span>
                  </p>
                  {entry.level < entryLevelCap(entry.id, entry) && (
                    <div className="bar thin">
                      <span
                        style={{ width: `${Math.round((entry.exp / expToNext(entry.level)) * 100)}%` }}
                      />
                    </div>
                  )}
                  <p className="meta tiny">
                    {entry.level >= entryLevelCap(entry.id, entry)
                      ? `ตันที่เพดาน ${entryLevelCap(entry.id, entry)}`
                      : `${entry.exp} / ${expToNext(entry.level)}`}
                  </p>
                </div>
                <span className="card-more">›</span>
                <StatPeek
                  title={c.name}
                  subtitle={`เลเวล ${entry.level} · ${'★'.repeat(entry.star)}`}
                  element={c.element}
                  power={entryPower(entry)}
                  stats={statRows(entry)}
                  note={c.skill.name}
                />
              </Link>
            )
          })}

          {owned && active.length < TEAM_SIZE && (
            <p className="meta tiny">
              ทีมยังว่างอีก {TEAM_SIZE - active.length} ช่อง · มีตัวละครทั้งหมด {owned.length} ตัว
            </p>
          )}
        </section>

        <Link className="rune-link block" to="/stages">
          ออกผจญภัย
        </Link>

        <Link className="rune-link block" to="/arena">
          ประลอง
        </Link>

        <div className="gate">
          <Link className="rune-link" to="/gacha">
            อัญเชิญ
          </Link>
          <Link className="rune-link" to="/team">
            จัดทีม
          </Link>
          <Link className="rune-link" to="/shop">
            ร้านค้า
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
