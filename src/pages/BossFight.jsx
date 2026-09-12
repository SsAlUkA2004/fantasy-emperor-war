import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { createBattle, currentUnit, needsTarget, takeTurn } from '../lib/battle'
import { loadCollection } from '../lib/player'
import { bossForWeek, weekIndex } from '../data/worldboss'
import { submitDamage } from '../lib/worldboss'
import { ROUND_LIMIT } from '../lib/pvp'
import BattleStage from '../components/BattleStage'

const STEP_DELAY = 650
const fmt = (n) => Math.round(n).toLocaleString('th-TH')

/**
 * สนามโจมตีบอสโลก
 *
 * บอสในสนามมีเลือดสูงมากจนตีไม่มีวันตายในครั้งเดียว
 * คะแนนของผู้เล่นคือดาเมจรวมที่ทำได้ภายในเพดานรอบ ไม่ใช่การล้มบอส
 * ดาเมจก้อนนั้นค่อยถูกส่งไปหักจากเลือดก้อนกลางที่ทุกคนใช้ร่วมกัน
 */
export default function BossFight() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, player } = usePlayer()

  const week = location.state?.week ?? weekIndex()
  const spec = bossForWeek(week)

  const [state, setState] = useState(null)
  const [auto, setAuto] = useState(true)
  const [target, setTarget] = useState(null)
  const [done, setDone] = useState(null)
  const [error, setError] = useState(null)
  const sent = useRef(false)

  useEffect(() => {
    loadCollection(user.uid).then((owned) => {
      const ids = player.team ?? []
      const mine = ids.map((id) => owned.find((o) => o.id === id)).filter(Boolean)
      if (!mine.length) {
        setError('ต้องจัดทีมผจญภัยก่อนจึงจะโจมตีบอสได้')
        return
      }
      setState(
        createBattle(mine, {
          id: 'worldboss',
          intro: spec.intro,
          enemies: [{ id: `boss:${spec.id}`, level: 1 }],
        })
      )
    })
  }, [week])

  useEffect(() => {
    if (!state || state.outcome || done) return
    if (state.round > ROUND_LIMIT) {
      finish(state)
      return
    }
    const actor = currentUnit(state)
    if (!actor) return
    if (actor.side === 'ally' && !auto) return
    const t = setTimeout(() => setState((s) => takeTurn(s, null)), STEP_DELAY)
    return () => clearTimeout(t)
  }, [state, auto, done])

  useEffect(() => {
    if (state?.outcome && !done) finish(state)
  }, [state?.outcome])

  async function finish(s) {
    if (sent.current) return
    sent.current = true

    const boss = s.units.find((u) => u.side === 'enemy')
    const dealt = Math.max(0, boss.maxHp - boss.hp)

    try {
      const r = await submitDamage({ ...player, uid: user.uid }, week, dealt)
      setDone({ dealt, ...r })
    } catch (err) {
      setDone({ dealt, failed: true, message: err.message })
    }
  }

  const actor = state ? currentUnit(state) : null

  function act(type) {
    const move = { type }
    if (needsTarget(actor, type)) {
      move.target = state.units.find((u) => u.side === 'enemy' && u.alive)?.key
    }
    setState((s) => takeTurn(s, move))
  }

  if (error) {
    return (
      <main className="screen">
        <div className="stage">
          <div className="trace">{error}</div>
          <button className="rune-link block" onClick={() => navigate('/team')}>
            ไปจัดทีม
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="screen top battle">
      <div className="sheet">
        <header className="battle-head">
          <button className="plain-link inline" onClick={() => navigate('/boss')}>
            ← ออก
          </button>
          <div className="battle-title">
            <h1>{spec.name}</h1>
            <p className="meta">รอบที่ {state?.round ?? 1} จาก {ROUND_LIMIT}</p>
          </div>
          <button className="plain-link inline" onClick={() => setAuto((a) => !a)}>
            ออโต้ {auto ? 'เปิด' : 'ปิด'}
          </button>
        </header>

        <p className="meta center round-note">
          บอสตัวนี้ล้มไม่ได้ในครั้งเดียว คะแนนคือดาเมจรวมที่ทำได้ก่อนหมดรอบ
        </p>

        <BattleStage
          state={state}
          actor={actor}
          auto={auto}
          target={target}
          setTarget={setTarget}
          onAct={act}
        />
      </div>

      {done && (
        <div className="veil" role="dialog" aria-modal="true">
          <section className="panel popup" data-outcome="won">
            <div className="panel-head">จบการโจมตี</div>
            <p className="stars">{fmt(done.dealt)}</p>
            <p className="meta">ดาเมจที่ทำได้ครั้งนี้</p>

            {done.failed ? (
              <div className="trace">{done.message || 'ส่งดาเมจไม่สำเร็จ'}</div>
            ) : (
              <>
                <p>ดาเมจสะสมของคุณ {fmt(done.total)}</p>
                <p className="meta">เลือดบอสที่เหลือ {fmt(Math.max(0, done.remaining))}</p>
              </>
            )}

            <button className="rune-link block primary" onClick={() => navigate('/boss')}>
              กลับหน้าบอส
            </button>
          </section>
        </div>
      )}
    </main>
  )
}
