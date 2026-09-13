import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import DefensePeek from '../components/DefensePeek'
import { CHARACTERS, ELEMENTS, TEAM_SIZE } from '../data/characters'
import { MATCHES_PER_DAY, claimableRanks, rankLabel, rankOf, titleName, titlesFor } from '../data/ranks'
import { entryLevelCap } from '../lib/stats'
import { effectiveRarity, awakenName } from '../data/ascension'
import { ROLES } from '../data/characters'
import { loadCollection } from '../lib/player'
import { UNLOCKS, chapterCleared } from '../data/stages'
import Locked from '../components/Locked'
import { teamPower, entryPower, formatPower } from '../lib/power'
import {
  defenseEntries,
  findOpponents,
  matchesLeft,
  saveMatch,
  simulate,
} from '../lib/pvp'
import { hoursUntilReset } from '../lib/dayclock'
import { SEASON_DAYS, daysLeft, seasonIndex } from '../data/season'
import { closeSeasonIfNeeded } from '../lib/season'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function Arena() {
  const { user, player, refresh } = usePlayer()
  const navigate = useNavigate()
  const [roster, setRoster] = useState(null)
  const [foes, setFoes] = useState(null)
  const [peek, setPeek] = useState(null)
  const [rerolling, setRerolling] = useState(false)
  const [quick, setQuick] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const left = matchesLeft(player)
  const rank = rankOf(player.pvpPoints ?? 0)
  const unlocked = chapterCleared(player.stageProgress, UNLOCKS.arena.chapter)

  const [closed, setClosed] = useState(null)

  useEffect(() => {
    loadCollection(user.uid).then(setRoster)
    // ปิดฤดูกาลเก่าให้เองถ้าเปลี่ยนฤดูกาลแล้ว รางวัลส่งเข้ากล่องจดหมาย
    closeSeasonIfNeeded({ ...player, uid: user.uid })
      .then(async (r) => {
        if (r) {
          setClosed(r)
          await refresh()
        }
      })
      .catch(() => {})
  }, [user.uid])

  useEffect(() => {
    if (!roster || !unlocked) return
    findOpponents({ ...player, uid: user.uid }, teamPower(myTeam))
      .then(setFoes)
      .catch((e) => setError(explainError('หาคู่แข่งไม่สำเร็จ', e)))
  }, [roster, player.pvpPoints])

  // ใช้ทีมบุกของโหมดประลอง ถ้ายังไม่ได้ตั้งให้ถอยไปใช้ทีมผจญภัย
  const attackIds = (player.pvpTeam?.length ? player.pvpTeam : player.team) ?? []
  const myTeam = roster ? attackIds.map((id) => roster.find((o) => o.id === id)).filter(Boolean) : []
  const usingFallback = !player.pvpTeam?.length

  async function reroll() {
    setRerolling(true)
    setError(null)
    try {
      setFoes(await findOpponents({ ...player, uid: user.uid }, teamPower(myTeam)))
    } catch {
      setError('หาคู่แข่งใหม่ไม่สำเร็จ')
    }
    setRerolling(false)
  }

  /**
   * ท้าแบบข้าม ตัดสินผลทันทีโดยไม่เข้าสนาม
   *
   * ใช้เครื่องยนต์ตัวเดียวกับการเข้าไปเล่นเอง ต่างกันแค่ไม่วาดหน้าจอระหว่างทาง
   * มีไว้สำหรับคนที่ต้องการเก็บโควตาสิบครั้งต่อวันให้ครบโดยไม่ต้องนั่งดู
   */
  async function quickFight(foe) {
    const defense = defenseEntries(foe)
    if (!defense.length) {
      setError(`${foe.username} ยังไม่ได้ตั้งทีมรับ ยังท้าไม่ได้`)
      return
    }
    if (!myTeam.length) {
      setError('ต้องจัดทีมบุกก่อนจึงจะประลองได้')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const state = simulate(myTeam, defense, foe.username)
      const won = state.outcome === 'won'
      const saved = await saveMatch({ ...player, uid: user.uid }, foe, won)
      setQuick({ won, foe, log: state.log.slice(-6), decidedByHp: state.decidedByHp, ...saved })
      await refresh()
      setFoes(
        await findOpponents({ ...player, uid: user.uid, pvpPoints: saved.points }, teamPower(myTeam))
      )
    } catch (e) {
      setError(explainError('บันทึกผลไม่สำเร็จ', e))
    }
    setBusy(false)
  }

  // เข้าแมตช์แล้วเล่นเองหรือกดออโต้ก็ได้ ผลบันทึกที่หน้านั้น
  function fight(foe) {
    if (!defenseEntries(foe).length) {
      setError(`${foe.username} ยังไม่ได้ตั้งทีมรับ ยังท้าไม่ได้`)
      return
    }
    if (!myTeam.length) {
      setError('ต้องจัดทีมบุกก่อนจึงจะประลองได้')
      return
    }
    navigate('/pvp', { state: { foe } })
  }

  const defense = defenseEntries(player)
  const myTitles = titlesFor(player.highestRank ?? 0)

  if (!unlocked) {
    return <Locked mode={UNLOCKS.arena} progress={player.stageProgress} />
  }

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

        {closed && (
          <p className="levelup">
            ฤดูกาลที่ {closed.season} จบแล้ว · แต้มรีเซ็ตจาก {closed.from} เหลือ {closed.to} ·
            รางวัลส่งเข้ากล่องจดหมายแล้ว
          </p>
        )}

        <div className="season-bar">
          <span className="meta">ฤดูกาลที่ {seasonIndex()}</span>
          <span className="meta">
            เหลืออีก {daysLeft()} วัน จาก {SEASON_DAYS}
          </span>
        </div>

        <h2 className="section-title">ทีมบุก</h2>
        {myTeam.length ? (
          <div className="team-strip-slots">
            {myTeam.map((e, i) => {
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
          <p className="meta">ยังไม่ได้จัดทีม</p>
        )}
        {usingFallback && (
          <p className="meta tiny">ยังไม่ได้ตั้งทีมบุกแยก ตอนนี้ใช้ทีมผจญภัยไปก่อน</p>
        )}
        <Link className="plain-link" to="/team?mode=attack">
          จัดทีมบุก
        </Link>

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
        <Link className="plain-link" to="/team?mode=defense">
          จัดทีมตั้งรับ
        </Link>
        <p className="meta tiny">
          ทีมตั้งรับเป็นสำเนา ณ ตอนที่บันทึก ถ้าดันเลเวลตัวละครเพิ่มแล้วอยากให้ทีมรับแข็งขึ้นด้วย
          ต้องเข้าไปกดบันทึกใหม่
        </p>

        <div className="roster-head">
          <h2 className="section-title flush">คู่แข่ง</h2>
          <button className="plain-link inline" onClick={reroll} disabled={rerolling || busy}>
            {rerolling ? 'กำลังหา' : '↻ หาคู่ใหม่'}
          </button>
        </div>
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
                <h3>
                  {foe.username}
                  {foe.isBot && <span className="bot-tag">คู่ซ้อม</span>}
                </h3>
                <p className="meta">
                  {rankOf(foe.pvpPoints ?? 0).mark} {rankLabel(foe.pvpPoints ?? 0)} · เลเวล{' '}
                  {foe.playerLevel ?? 1}
                </p>
                <p className="meta cp">
                  {d.length ? `⚔ ${formatPower(power)} · ตั้งรับ ${d.length} ตัว` : 'ยังไม่ได้ตั้งทีมรับ'}
                </p>
              </div>
              <div className="card-actions">
                <button
                  className="rune-link"
                  disabled={busy || left === 0 || !d.length}
                  onClick={() => fight(foe)}
                >
                  เข้าสู้
                </button>
                <button
                  className="rune-link"
                  disabled={busy || left === 0 || !d.length}
                  onClick={() => quickFight(foe)}
                >
                  ข้าม
                </button>
                <button
                  className="plain-link inline"
                  disabled={!d.length}
                  onClick={() => setPeek(foe)}
                >
                  ดูทีม
                </button>
              </div>
            </div>
          )
        })}

        <h2 className="section-title">ฉายา</h2>
        <p className="meta">ปลดล็อกตามแรงค์สูงสุดที่เคยไปถึง ตอนนี้ได้ {myTitles.length} ฉายา</p>
        <div className="title-grid">
          {myTitles.map((t) => (
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
          <Link className="rune-link" to="/ranks">
            แรงค์และรางวัล
          </Link>
          <Link className="rune-link" to="/leaderboard">
            กระดานอันดับ
          </Link>
          <Link className="rune-link" to="/">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>

      {peek && <DefensePeek foe={peek} onClose={() => setPeek(null)} />}
      {quick && <QuickResult result={quick} onClose={() => setQuick(null)} />}

    </main>
  )
}

/** สรุปผลของการท้าแบบข้าม */
function QuickResult({ result, onClose }) {
  return (
    <div className="veil" role="dialog" aria-modal="true">
      <section className="panel popup" data-outcome={result.won ? 'won' : 'lost'}>
        <div className="panel-head">{result.won ? 'ชนะการประลอง' : 'พ่ายแพ้'}</div>
        <p className="meta">คู่แข่ง {result.foe.username}</p>
        {result.decidedByHp && <p className="meta">ตัดสินด้วยเลือดที่เหลือเมื่อครบรอบ</p>}

        <p className="stars">
          <span className={result.delta > 0 ? 'delta up' : 'delta down'}>
            {result.delta > 0 ? '+' : ''}
            {result.delta}
          </span>
        </p>
        <p>
          ตอนนี้ {rankLabel(result.points)} · {result.points} แต้ม
        </p>

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
