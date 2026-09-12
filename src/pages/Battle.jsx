import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { STAGES } from '../data/stages'
import { findStage } from '../data/materials'
import { createBattle, currentUnit, needsTarget, takeTurn, starsEarned } from '../lib/battle'
import { loadCollection as reloadCollection } from '../lib/player'
import { awardExp, loadCollection } from '../lib/player'
import { saveStageResult } from '../lib/progress'
import { usePlayer } from '../context/PlayerContext'
import { MATERIALS, MATERIAL_IDS } from '../data/materials'
import { GRADES, SLOTS } from '../data/gear'
import BattleStage from '../components/BattleStage'

const STEP_DELAY = 750

export default function Battle() {
  const { stageId } = useParams()
  const navigate = useNavigate()
  const { user, player, refresh } = usePlayer()

  const [state, setState] = useState(null)
  const [auto, setAuto] = useState(false)
  const [target, setTarget] = useState(null)
  const [reward, setReward] = useState(null)
  const [round, setRound] = useState(0)
  const roster = useRef([])
  const saved = useRef(false)

  const stage = findStage(stageId)

  // ด่านถัดไปในลำดับรวมทั้งเกม ข้ามบทได้เอง
  // ลานฝึกกับเหมืองไม่มีด่านถัดไป เพราะไม่ได้อยู่ในลำดับเนื้อเรื่อง
  const nextStage = (() => {
    if (!stage || stage.training || stage.gemStage) return null
    const i = STAGES.findIndex((x) => x.id === stage.id)
    return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null
  })()

  // round เปลี่ยนค่าเมื่อกดเล่นอีกครั้ง ทำให้ตั้งสนามรบใหม่ทั้งหมด
  useEffect(() => {
    if (!stage) return
    saved.current = false
    setReward(null)
    setTarget(null)
    setState(null)
    loadCollection(user.uid).then((owned) => {
      const team = (player.team ?? [])
        .map((id) => owned.find((o) => o.id === id))
        .filter(Boolean)
      roster.current = team
      if (team.length) setState(createBattle(team, stage))
    })
  }, [stageId, round])

  // เดินเทิร์นอัตโนมัติ เมื่อถึงคิวมอนสเตอร์ หรือเมื่อเปิดออโต้ไว้
  useEffect(() => {
    if (!state || state.outcome) return
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

    if (state.outcome === 'won') {
      const stars = starsEarned(state)
      const exp = stage.exp ?? 0

      Promise.all([
        saveStageResult({ ...player, uid: user.uid }, stage, stars, exp),
        awardExp(user.uid, roster.current, exp),
      ])
        .then(([r, levels]) => {
          setReward({ stars, exp, levels, ...r })
          return refresh()
        })
        .catch(() => setReward({ stars, firstClear: false, gems: 0, failed: true }))
    }
  }, [state?.outcome])

  if (!stage) return <Missing message="ไม่พบด่านนี้" onBack={() => navigate('/stages')} />
  if (!state) return <Missing message="กำลังจัดทัพ" />

  const actor = currentUnit(state)
  const yourTurn = actor?.side === 'ally' && !auto && !state.outcome
  const foes = state.units.filter((u) => u.side === 'enemy')
  const allies = state.units.filter((u) => u.side === 'ally')

  function act(type) {
    const move = { type }
    if (needsTarget(actor, type)) {
      const alive = foes.filter((f) => f.alive)
      move.target = alive.find((f) => f.key === target)?.key ?? alive[0]?.key
    }
    setState((s) => takeTurn(s, move))
  }

  return (
    <main className="screen top battle">
      <div className="sheet">
        <header className="battle-head">
          <button className="plain-link inline" onClick={() => navigate('/stages')}>
            ← ออก
          </button>
          <div className="battle-title">
            <h1>{stage.name}</h1>
            <p className="meta">รอบที่ {state.round}</p>
          </div>
          <button className="plain-link inline" onClick={() => setAuto((a) => !a)}>
            ออโต้ {auto ? 'เปิด' : 'ปิด'}
          </button>
        </header>

        <BattleStage
          state={state}
          actor={actor}
          auto={auto}
          target={target}
          setTarget={setTarget}
          onAct={act}
        />
      </div>

      {state.outcome && (
        <Result
          outcome={state.outcome}
          reward={reward}
          training={stage.training}
          gemStage={stage.gemStage}
          nextStage={nextStage}
          onNext={() => navigate(`/battle/${nextStage.id}`)}
          onAgain={() => setRound((r) => r + 1)}
          onBack={() => navigate('/stages')}
        />
      )}
    </main>
  )
}

function Result({ outcome, reward, training, gemStage, nextStage, onNext, onAgain, onBack }) {
  const won = outcome === 'won'

  return (
    <div className="veil" role="dialog" aria-modal="true">
      <section className="panel result popup" data-outcome={outcome}>
        <div className="panel-head">{won ? 'ชนะแล้ว' : 'พ่ายแพ้'}</div>
      {won ? (
        <>
          {!training && !gemStage && <p className="stars">{'★'.repeat(reward?.stars ?? 0).padEnd(3, '☆')}</p>}
          {reward?.exp > 0 && (
            <p>ตัวละครได้ค่าประสบการณ์ {reward.exp.toLocaleString('th-TH')} หน่วย</p>
          )}
          {reward?.accountExp > 0 && (
            <p className="acct-exp">
              เลเวลผู้เล่นได้ {reward.accountExp.toLocaleString('th-TH')} หน่วย
            </p>
          )}
          {reward?.levels
            ?.filter((l) => l.gained > 0)
            .map((l) => (
              <p className="levelup" key={l.id}>
                เลเวลขึ้นเป็น {l.level} แล้ว
              </p>
            ))}
          {reward?.levels?.some((l) => l.level >= l.cap) && (
            <p className="meta">บางตัวชนเพดานเลเวลแล้ว ต้องเพิ่มดาวเพื่อดันเพดานขึ้นไปอีก</p>
          )}
          {reward?.account?.gained > 0 && (
            <p className="levelup">เลเวลผู้เล่นขึ้นเป็น {reward.account.level}</p>
          )}
          {reward?.coins > 0 && <p>ได้เหรียญ {reward.coins.toLocaleString('th-TH')}</p>}
          {reward?.drop && (
            <p className="levelup" style={{ color: GRADES[reward.drop.grade].color }}>
              ได้{SLOTS[reward.drop.slot].name}
              {GRADES[reward.drop.grade].name} ระดับไอเทม {reward.drop.ilvl}
            </p>
          )}
          {reward?.firstClear && <p>ผ่านครั้งแรก ได้เพชร {reward.gems} เม็ด</p>}
          {reward?.runsLeft !== undefined && (
            <p className="levelup">
              ได้เพชร {reward.gems} เม็ด · วันนี้เหลืออีก {reward.runsLeft} ครั้ง
            </p>
          )}
          {reward?.drops && (
            <p className="levelup">
              ได้{' '}
              {MATERIAL_IDS.filter((id) => reward.drops[id] > 0)
                .map((id) => `${MATERIALS[id].name} ${reward.drops[id]}`)
                .join(' · ')}
            </p>
          )}
          {reward?.quotaSpent && <p className="meta">ครบโควตาของวันนี้แล้ว รอบนี้ไม่ได้รางวัล</p>}
          {reward && !reward.firstClear && !reward.failed && !training && !gemStage && (
            <p className="meta">เคยผ่านด่านนี้แล้ว รอบนี้ไม่ได้เพชรเพิ่ม</p>
          )}
          {reward?.failed && (
            <div className="trace">
              บันทึกผลไม่สำเร็จ ตรวจว่าอัปโหลด Security Rules เวอร์ชันล่าสุดแล้วหรือยัง
            </div>
          )}
        </>
      ) : (
        <p>ลองจัดทีมใหม่หรือไปเก็บเลเวลจากลานฝึกดู</p>
      )}

      {won && nextStage && (
        <button className="rune-link block primary" onClick={onNext}>
          ไปด่าน {nextStage.id} · {nextStage.name}
        </button>
      )}
      <button className="rune-link block" onClick={onAgain}>
        เล่นอีกครั้ง
      </button>
      <button className="plain-link" onClick={onBack}>
        กลับไปแผนที่
      </button>
      </section>
    </div>
  )
}

function Missing({ message, onBack }) {
  return (
    <main className="screen">
      <div className="stage">
        <p className="meta center">{message}</p>
        {onBack && (
          <button className="rune-link block" onClick={onBack}>
            กลับไปแผนที่
          </button>
        )}
      </div>
    </main>
  )
}
