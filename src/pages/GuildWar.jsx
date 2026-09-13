import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { ATTACKS_PER_DAY, WAR_TIERS, bannerFor, daysLeft, warWeek } from '../data/guildwar'
import { attacksLeft, findWarTargets, loadScores, myScore } from '../lib/guildwar'
import { loadGuild } from '../lib/guild'
import { defenseEntries } from '../lib/pvp'
import { loadCollection } from '../lib/player'
import { teamPower, entryPower, formatPower } from '../lib/power'
import { hoursUntilReset } from '../lib/dayclock'
import { explainError } from '../lib/errors'
import DefensePeek from '../components/DefensePeek'

const fmt = (n) => Math.round(n ?? 0).toLocaleString('th-TH')

export default function GuildWar() {
  const { user, player } = usePlayer()
  const navigate = useNavigate()

  const [guild, setGuild] = useState(null)
  const [scores, setScores] = useState(null)
  const [mine, setMine] = useState(null)
  const [targets, setTargets] = useState(null)
  const [roster, setRoster] = useState(null)
  const [peek, setPeek] = useState(null)
  const [error, setError] = useState(null)

  const left = attacksLeft(player)

  useEffect(() => {
    if (!player.guildId) return
    loadCollection(user.uid).then(setRoster)
    Promise.all([loadGuild(player.guildId), loadScores(30), myScore(player.guildId)])
      .then(([g, s, m]) => {
        setGuild(g)
        setScores(s)
        setMine(m)
      })
      .catch((e) => setError(explainError('อ่านกระดานศึกชิงธงไม่สำเร็จ', e)))
  }, [player.guildId, user.uid])

  useEffect(() => {
    if (!roster || !player.guildId) return
    const ids = (player.pvpTeam?.length ? player.pvpTeam : player.team) ?? []
    const team = ids.map((id) => roster.find((o) => o.id === id)).filter(Boolean)
    findWarTargets({ ...player, uid: user.uid }, teamPower(team))
      .then(setTargets)
      .catch((e) => setError(explainError('หาคู่ปะทะไม่สำเร็จ', e)))
  }, [roster])

  if (!player.guildId) {
    return (
      <main className="screen top">
        <div className="sheet">
          <h1>ศึกชิงธง</h1>
          <p className="meta center locked-note">ต้องอยู่ในกิลด์ก่อนจึงจะลงศึกได้</p>
          <Link className="rune-link block" to="/guild">
            ไปหน้ากิลด์
          </Link>
        </div>
      </main>
    )
  }

  const myIds = (player.pvpTeam?.length ? player.pvpTeam : player.team) ?? []
  const myTeam = roster ? myIds.map((id) => roster.find((o) => o.id === id)).filter(Boolean) : []

  function attack(foe) {
    if (!myTeam.length) {
      setError('ต้องจัดทีมบุกก่อนจึงจะลงศึกได้')
      return
    }
    navigate('/pvp', {
      state: {
        foe,
        mode: 'war',
        guildId: player.guildId,
        guildName: guild?.name ?? '',
        guildTag: guild?.tag ?? '',
      },
    })
  }

  return (
    <main className="screen top">
      <div className="sheet">
        <header className="lobby-head">
          <div>
            <h1>ศึกชิงธง</h1>
            <p className="meta">
              สัปดาห์ที่ {warWeek()} · เหลืออีก {daysLeft()} วัน
            </p>
          </div>
          <div className="purse coin">
            <span className="coin-mark">⛊</span>
            {fmt(player.guildCoins)}
          </div>
        </header>

        {error && <div className="trace">{error}</div>}

        <div className="cp-banner">
          <span className="meta">คะแนนกิลด์สัปดาห์นี้</span>
          <strong>
            {fmt(mine?.points)}
            <span className="meta tiny"> · {bannerFor(mine?.points ?? 0)}</span>
          </strong>
        </div>
        <p className="meta tiny">
          ชนะ {mine?.wins ?? 0} จาก {mine?.attacks ?? 0} ครั้ง · วันนี้เหลือ {left} จาก{' '}
          {ATTACKS_PER_DAY} ครั้ง
          {left === 0 && ` · รีเซ็ตอีก ${hoursUntilReset()} ชั่วโมง`}
        </p>

        <h2 className="section-title">คู่ปะทะ</h2>
        <p className="meta">
          สมาชิกจากกิลด์อื่น ชนะได้เต็ม แพ้ก็ยังได้คะแนน จะได้ไม่มีใครกลัวลงให้กิลด์
        </p>

        {targets === null && <p className="meta">กำลังหาคู่ปะทะ</p>}
        {targets?.map((foe) => {
          const d = defenseEntries(foe)
          const power = d.reduce((s, e) => s + entryPower(e), 0)
          return (
            <div className="card foe-card" key={foe.uid}>
              <div className="card-body">
                <h3>
                  {foe.username}
                  {foe.isBot && <span className="bot-tag">คู่ซ้อม</span>}
                </h3>
                <p className="meta cp">⚔ {formatPower(power)}</p>
              </div>
              <div className="card-actions">
                <button className="rune-link" disabled={left === 0} onClick={() => attack(foe)}>
                  ปะทะ
                </button>
                <button className="plain-link inline" onClick={() => setPeek(foe)}>
                  ดูทีม
                </button>
              </div>
            </div>
          )
        })}

        <h2 className="section-title">กระดานกิลด์</h2>
        <div className="board">
          {scores?.map((s, i) => (
            <div className="board-row" key={s.id} data-me={s.id === player.guildId}>
              <span className="board-place" data-top={i < 3}>
                {i + 1}
              </span>
              <span className="board-body">
                <span className="board-name">
                  {s.name}
                  <span className="board-title">[{s.tag}]</span>
                </span>
                <span className="meta">
                  ชนะ {s.wins ?? 0} · ปะทะ {s.attacks ?? 0} · {bannerFor(s.points)}
                </span>
              </span>
              <span className="board-points">{fmt(s.points)}</span>
            </div>
          ))}
          {scores?.length === 0 && <p className="meta">ยังไม่มีกิลด์ไหนลงศึกสัปดาห์นี้</p>}
        </div>

        <h2 className="section-title">ระดับธง</h2>
        <div className="tier-list">
          {WAR_TIERS.map((t) => (
            <div className="tier-row" key={t.need} data-open={(mine?.points ?? 0) >= t.need}>
              <div className="tier-body">
                <span className="tier-need">{t.name}</span>
                <span className="meta">{fmt(t.need)} คะแนน</span>
              </div>
            </div>
          ))}
        </div>

        <div className="gate">
          <Link className="rune-link" to="/guild">
            หน้ากิลด์
          </Link>
          <Link className="rune-link" to="/">
            หน้าหลัก
          </Link>
        </div>
      </div>

      {peek && <DefensePeek foe={peek} onClose={() => setPeek(null)} />}
    </main>
  )
}
