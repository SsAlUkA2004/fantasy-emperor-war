import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import { loadLeaderboard } from '../lib/pvp'
import { rankLabel, rankOf, titleName } from '../data/ranks'
import { nameFor } from '../lib/displayname'

export default function Leaderboard() {
  const { user, player } = usePlayer()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadLeaderboard(50)
      .then(setRows)
      .catch((e) => setError(explainError('อ่านกระดานไม่สำเร็จ', e)))
  }, [])

  const myIndex = rows?.findIndex((r) => r.uid === user.uid) ?? -1

  return (
    <main className="screen top">
      <div className="sheet">
        <div className="top-nav">
          <Link className="plain-link inline" to="/">
            ← หน้าหลัก
          </Link>
        </div>

        <h1>กระดานอันดับ</h1>
        <p className="meta">
          50 อันดับแรก · ตอนนี้คุณอยู่{' '}
          {myIndex >= 0 ? `อันดับ ${myIndex + 1}` : 'นอกห้าสิบอันดับแรก'}
        </p>

        {error && <div className="trace">{error}</div>}
        {rows === null && !error && <p className="meta">กำลังอ่านกระดาน</p>}

        <div className="board">
          {rows?.map((r, i) => (
            <div className="board-row" key={r.uid} data-me={r.uid === user.uid}>
              <span className="board-place" data-top={i < 3}>
                {i + 1}
              </span>
              <span className="board-body">
                <span className="board-name">
                  {nameFor(r, user.uid)}
                  {r.guildTag && (
                    <span className="guild-tag" title={r.guildName || undefined}>
                      [{r.guildTag}]
                    </span>
                  )}
                  {r.titleIndex > 0 && <span className="board-title">{titleName(r.titleIndex)}</span>}
                </span>
                <span className="meta">
                  {rankOf(r.pvpPoints ?? 0).mark} {rankLabel(r.pvpPoints ?? 0)} · เลเวล{' '}
                  {r.playerLevel ?? 1}
                  {r.guildName && ` · ${r.guildName}`}
                </span>
              </span>
              <span className="board-points">{(r.pvpPoints ?? 0).toLocaleString('th-TH')}</span>
            </div>
          ))}
        </div>

        <div className="gate">
          <Link className="rune-link" to="/board">
            บอร์ดรวม
          </Link>
          <Link className="rune-link" to="/arena">
            กลับไปประลอง
          </Link>
        </div>
      </div>
    </main>
  )
}
