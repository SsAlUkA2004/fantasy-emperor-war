import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { CHARACTERS, ELEMENTS, TEAM_SIZE } from '../data/characters'
import { MATCHES_PER_DAY, rankLabel, rankOf, titleName, titlesFor } from '../data/ranks'
import { loadCollection } from '../lib/player'
import { teamPower, entryPower, formatPower } from '../lib/power'
import {
  defenseEntries,
  findOpponents,
  matchesLeft,
  saveDefense,
  saveMatch,
  simulate,
} from '../lib/pvp'
import { starsEarned } from '../lib/battle'
import { hoursUntilReset } from '../lib/dayclock'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function Arena() {
  const { user, player, refresh } = usePlayer()
  const [roster, setRoster] = useState(null)
  const [foes, setFoes] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const left = matchesLeft(player)
  const rank = rankOf(player.pvpPoints ?? 0)

  useEffect(() => {
    loadCollection(user.uid).then(setRoster)
  }, [user.uid])

  useEffect(() => {
    findOpponents({ ...player, uid: user.uid })
      .then(setFoes)
      .catch(() => setError('หาคู่แข่งไม่สำเร็จ ตรวจว่าอัปโหลดกฎล่าสุดแล้วหรือยัง'))
  }, [player.pvpPoints])

  const myTeam = roster
    ? (player.team ?? []).map((id) => roster.find((o) => o.id === id)).filter(Boolean)
    : []

  async function fight(foe) {
    const defense = defenseEntries(foe)
    if (!defense.length) {
      setError(`${foe.username} ยังไม่ได้ตั้งทีมรับ ยังท้าไม่ได้`)
      return
    }
    if (!myTeam.length) {
      setError('ต้องจัดทีมก่อนจึงจะประลองได้')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const state = simulate(myTeam, defense, foe.username)
      const won = state.outcome === 'won'
      const saved = await saveMatch({ ...player, uid: user.uid }, foe, won)
      setResult({ won, foe, log: state.log.slice(-8), ...saved })
      await refresh()
      setFoes(await findOpponents({ ...player, uid: user.uid, pvpPoints: saved.points }))
    } catch (err) {
      setError('บันทึกผลไม่สำเร็จ ตรวจว่าอัปโหลดกฎล่าสุดแล้วหรือยัง')
    }
    setBusy(false)
  }

  async function useCurrentAsDefense() {
    setBusy(true)
    setError(null)
    try {
      await saveDefense(user.uid, myTeam)
      await refresh()
    } catch {
      setError('บันทึกทีมรับไม่สำเร็จ')
    }
    setBusy(false)
  }

  const defense = defenseEntries(player)
  const unlocked = titlesFor(player.highestRank ?? 0)

  return (
    <main className="screen top">
      <div className="sheet">
        <header className="lobby-head">
          <div>
            <h1>ประลอง</h1>
            <p className="meta">
              {rank.mark} {rankLabel(player.pvpPoints ?? 0)} · {player.pvpPoints ?? 0} แต้ม
            </p>
          </div>
          <div className="purse-stack">
            <div className="purse cp-big">
              <span className="cp-mark">⚔</span>
              {formatPower(teamPower(myTeam))}
            </div>
            <span className="meta tiny">
              วันนี้เหลือ {left}/{MATCHES_PER_DAY} ครั้ง
            </span>
          </div>
        </header>

        {error && <div className="trace">{error}</div>}

        <h2 className="section-title">ทีมตั้งรับ</h2>
        {defense.length ? (
          <div className="team-strip-slots">
            {defense.map((e, i) => {
              const c = CHARACTERS[e.id]
              return (
                <div className="mini-slot" data-filled key={i}>
                  <span className="mini-mark">{ELEMENTS[c.element].mark}</span>
                  <span className="mini-name">{c.name}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="meta">ยังไม่ได้ตั้ง คนอื่นจึงท้าคุณไม่ได้ และคุณก็ไม่เสียแต้มจากการโดนท้า</p>
        )}
        <button className="plain-link" onClick={useCurrentAsDefense} disabled={busy || !myTeam.length}>
          ใช้ทีมปัจจุบันเป็นทีมตั้งรับ
        </button>
        <p className="meta tiny">
          ทีมตั้งรับเป็นสำเนา ณ ตอนที่บันทึก ถ้าดันเลเวลตัวละครเพิ่มแล้วอยากให้ทีมรับแข็งขึ้นด้วย
          ต้องกดบันทึกใหม่
        </p>

        <h2 className="section-title">คู่แข่ง</h2>
        {left === 0 && (
          <p className="meta">ครบโควตาวันนี้แล้ว รีเซ็ตอีก {hoursUntilReset()} ชั่วโมง</p>
        )}
        {foes === null && <p className="meta">กำลังหาคู่แข่ง</p>}
        {foes?.length === 0 && <p className="meta">ยังไม่มีผู้เล่นคนอื่นที่แต้มใกล้เคียง</p>}

        {foes?.map((foe) => {
          const d = defenseEntries(foe)
          const power = d.reduce((s, e) => s + entryPower(e), 0)
          return (
            <div className="card foe-card" key={foe.uid}>
              <div className="card-body">
                <h3>{foe.username}</h3>
                <p className="meta">
                  {rankOf(foe.pvpPoints ?? 0).mark} {rankLabel(foe.pvpPoints ?? 0)} · เลเวล{' '}
                  {foe.playerLevel ?? 1}
                </p>
                <p className="meta cp">
                  {d.length ? `⚔ ${formatPower(power)} · ตั้งรับ ${d.length} ตัว` : 'ยังไม่ได้ตั้งทีมรับ'}
                </p>
              </div>
              <button
                className="rune-link"
                disabled={busy || left === 0 || !d.length}
                onClick={() => fight(foe)}
              >
                ท้า
              </button>
            </div>
          )
        })}

        <h2 className="section-title">ฉายา</h2>
        <p className="meta">ปลดล็อกตามแรงค์สูงสุดที่เคยไปถึง ตอนนี้ได้ {unlocked.length} ฉายา</p>
        <div className="title-grid">
          {unlocked.map((t) => (
            <button
              key={t.index}
              className="title-chip"
              data-active={(player.titleIndex ?? 0) === t.index}
              disabled={busy}
              onClick={async () => {
                await updateDoc(doc(db, 'users', user.uid), { titleIndex: t.index })
                await refresh()
              }}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="gate">
          <Link className="rune-link" to="/leaderboard">
            กระดานอันดับ
          </Link>
          <Link className="rune-link" to="/">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>

      {result && <MatchResult result={result} onClose={() => setResult(null)} />}
    </main>
  )
}

function MatchResult({ result, onClose }) {
  return (
    <div className="veil" role="dialog" aria-modal="true">
      <section className="panel popup" data-outcome={result.won ? 'won' : 'lost'}>
        <div className="panel-head">{result.won ? 'ชนะการประลอง' : 'พ่ายแพ้'}</div>
        <p className="meta">คู่แข่ง {result.foe.username}</p>

        <p className="stars">
          <span className={result.delta > 0 ? 'delta up' : 'delta down'}>
            {result.delta > 0 ? '+' : ''}
            {result.delta}
          </span>
        </p>
        <p>ตอนนี้ {rankLabel(result.points)} · {result.points} แต้ม</p>

        <div className="log pvp-log">
          {result.log.map((line, i) => (
            <p key={i} data-kind={line.kind}>
              {line.text}
            </p>
          ))}
        </div>

        <button className="rune-link block primary" onClick={onClose}>
          ปิด
        </button>
      </section>
    </div>
  )
}
