import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { currentUnit, needsTarget, takeTurn } from '../lib/battle'
import {
  ROUND_LIMIT,
  createPvpBattle,
  decideByHp,
  defenseEntries,
  matchesLeft,
  saveMatch,
} from '../lib/pvp'
import { loadCollection } from '../lib/player'
import { rankLabel, rankOf } from '../data/ranks'
import { teamPower, entryPower, formatPower } from '../lib/power'
import BattleStage from '../components/BattleStage'

const STEP_DELAY = 700

export default function PvpMatch() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, player, refresh } = usePlayer()

  const foe = location.state?.foe
  const friendly = Boolean(location.state?.friendly)

  const [state, setState] = useState(null)
  const [auto, setAuto] = useState(false)
  const [target, setTarget] = useState(null)
  const [outcome, setOutcome] = useState(null)
  const [error, setError] = useState(null)
  const saved = useRef(false)

  // ตั้งสนามรบครั้งเดียวตอนเข้าหน้า
  useEffect(() => {
    if (!foe) return
    loadCollection(user.uid).then((owned) => {
      const ids = (player.pvpTeam?.length ? player.pvpTeam : player.team) ?? []
      const mine = ids.map((id) => owned.find((o) => o.id === id)).filter(Boolean)
      const theirs = defenseEntries(foe)
      if (!mine.length || !theirs.length) {
        setError('ทีมไม่ครบ กลับไปจัดทีมก่อน')
        return
      }
      setState(createPvpBattle(mine, theirs, foe.username))
    })
  }, [foe?.uid])

  // เดินเทิร์นเองเมื่อถึงคิวฝ่ายตรงข้าม หรือเมื่อเปิดออโต้ไว้
  useEffect(() => {
    if (!state || state.outcome) return
    if (state.round > ROUND_LIMIT) {
      setState((s) => decideByHp(s))
      return
    }
    const actor = currentUnit(state)
    if (!actor) return
    if (actor.side === 'ally' && !auto) return

    const t = setTimeout(() => setState((s) => takeTurn(s, null)), STEP_DELAY)
    return () => clearTimeout(t)
  }, [state, auto])

  // บันทึกผลครั้งเดียวเมื่อจบ
  useEffect(() => {
    if (!state?.outcome || saved.current) return
    saved.current = true

    const won = state.outcome === 'won'
    if (friendly) {
      setOutcome({ won, friendly: true })
      return
    }

    saveMatch({ ...player, uid: user.uid }, foe, won)
      .then((r) => {
        setOutcome({ won, ...r })
        return refresh()
      })
      .catch(() => setOutcome({ won, failed: true }))
  }, [state?.outcome])

  if (!foe) {
    return (
      <main className="screen">
        <div className="stage">
          <p className="meta center">ไม่พบคู่แข่ง</p>
          <button className="rune-link block" onClick={() => navigate('/arena')}>
            กลับไปสนามประลอง
          </button>
        </div>
      </main>
    )
  }

  const actor = currentUnit(state ?? {})
  const foePower = defenseEntries(foe).reduce((s, e) => s + entryPower(e), 0)

  function act(type) {
    const move = { type }
    if (needsTarget(actor, type)) {
      const alive = state.units.filter((u) => u.side === 'enemy' && u.alive)
      move.target = alive.find((f) => f.key === target)?.key ?? alive[0]?.key
    }
    setState((s) => takeTurn(s, move))
  }

  return (
    <main className="screen top battle">
      <div className="sheet">
        <header className="battle-head">
          <button className="plain-link inline" onClick={() => navigate('/arena')}>
            ← ออก
          </button>
          <div className="battle-title">
            <h1>{foe.username}</h1>
            <p className="meta">
              {friendly ? 'ประลองสนุก ๆ ไม่นับแต้ม' : rankLabel(foe.pvpPoints ?? 0)} · ⚔{' '}
              {formatPower(foePower)}
            </p>
          </div>
          <button className="plain-link inline" onClick={() => setAuto((a) => !a)}>
            ออโต้ {auto ? 'เปิด' : 'ปิด'}
          </button>
        </header>

        {error && <div className="trace">{error}</div>}

        {state && (
          <p className="meta center round-note">
            รอบที่ {state.round} จาก {ROUND_LIMIT} · ครบแล้วตัดสินด้วยเลือดที่เหลือ
          </p>
        )}

        <BattleStage
          state={state}
          actor={actor}
          auto={auto}
          target={target}
          setTarget={setTarget}
          onAct={act}
          waitingLabel={`รอ ${actor?.name ?? ''} ลงมือ`}
        />
      </div>

      {outcome && (
        <PvpResult
          outcome={outcome}
          foe={foe}
          decidedByHp={state?.decidedByHp}
          onAgain={() => navigate('/arena')}
        />
      )}
    </main>
  )
}

function PvpResult({ outcome, foe, decidedByHp, onAgain }) {
  return (
    <div className="veil" role="dialog" aria-modal="true">
      <section className="panel popup" data-outcome={outcome.won ? 'won' : 'lost'}>
        <div className="panel-head">{outcome.won ? 'ชนะการประลอง' : 'พ่ายแพ้'}</div>
        <p className="meta">คู่แข่ง {foe.username}</p>

        {decidedByHp && <p className="meta">ตัดสินด้วยเลือดที่เหลือเมื่อครบรอบ</p>}

        {outcome.friendly ? (
          <p>ประลองสนุก ๆ ไม่มีการเปลี่ยนแปลงแต้ม</p>
        ) : outcome.failed ? (
          <div className="trace">บันทึกผลไม่สำเร็จ ตรวจว่าอัปโหลดกฎล่าสุดแล้วหรือยัง</div>
        ) : (
          <>
            <p className="stars">
              <span className={outcome.delta > 0 ? 'delta up' : 'delta down'}>
                {outcome.delta > 0 ? '+' : ''}
                {outcome.delta}
              </span>
            </p>
            <p>
              ตอนนี้ {rankLabel(outcome.points)} · {outcome.points} แต้ม
            </p>
          </>
        )}

        <button className="rune-link block primary" onClick={onAgain}>
          กลับไปสนามประลอง
        </button>
      </section>
    </div>
  )
}
