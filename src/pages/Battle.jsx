import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getStage } from '../data/stages'
import { createBattle, currentUnit, movesFor, needsTarget, takeTurn, starsEarned } from '../lib/battle'
import { awardExp, loadCollection } from '../lib/player'
import { saveStageResult } from '../lib/progress'
import { usePlayer } from '../context/PlayerContext'
import { hasAdvantage } from '../lib/stats'
import { ELEMENTS } from '../data/characters'
import StatPeek from '../components/StatPeek'

const STEP_DELAY = 750

export default function Battle() {
  const { stageId } = useParams()
  const navigate = useNavigate()
  const { user, player, refresh } = usePlayer()

  const [state, setState] = useState(null)
  const [auto, setAuto] = useState(false)
  const [target, setTarget] = useState(null)
  const [reward, setReward] = useState(null)
  const roster = useRef([])
  const saved = useRef(false)
  const logEnd = useRef(null)

  const stage = getStage(stageId)

  useEffect(() => {
    if (!stage) return
    loadCollection(user.uid).then((owned) => {
      const team = (player.team ?? [])
        .map((id) => owned.find((o) => o.id === id))
        .filter(Boolean)
      roster.current = team
      if (team.length) setState(createBattle(team, stage))
    })
  }, [stageId])

  // เดินเทิร์นอัตโนมัติ เมื่อถึงคิวมอนสเตอร์ หรือเมื่อเปิดออโต้ไว้
  useEffect(() => {
    if (!state || state.outcome) return
    const actor = currentUnit(state)
    if (!actor) return
    if (actor.side === 'ally' && !auto) return

    const t = setTimeout(() => setState((s) => takeTurn(s, null)), STEP_DELAY)
    return () => clearTimeout(t)
  }, [state, auto])

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: 'nearest' })
  }, [state?.log.length])

  // บันทึกผลครั้งเดียวเมื่อจบ
  useEffect(() => {
    if (!state?.outcome || saved.current) return
    saved.current = true

    if (state.outcome === 'won') {
      const stars = starsEarned(state)
      const exp = stage.exp ?? 0

      Promise.all([
        saveStageResult({ ...player, uid: user.uid }, stageId, stars),
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
          <div>
            <h1>{stage.name}</h1>
            <p className="meta">รอบที่ {state.round}</p>
          </div>
          <button className="plain-link inline" onClick={() => setAuto((a) => !a)}>
            ออโต้ {auto ? 'เปิด' : 'ปิด'}
          </button>
        </header>

        <section className="field-side">
          {foes.map((u) => (
            <Combatant
              key={u.key}
              unit={u}
              active={actor?.key === u.key}
              selected={target === u.key}
              favoured={actor?.side === 'ally' && hasAdvantage(actor.element, u.element)}
              onSelect={() => u.alive && setTarget(u.key)}
            />
          ))}
        </section>

        <div className="log" role="log">
          {state.log.slice(-6).map((line, i) => (
            <p key={i} data-kind={line.kind}>
              {line.text}
            </p>
          ))}
          <div ref={logEnd} />
        </div>

        <section className="field-side">
          {allies.map((u) => (
            <Combatant key={u.key} unit={u} active={actor?.key === u.key} ally />
          ))}
        </section>

        {state.outcome ? (
          <Result outcome={state.outcome} reward={reward} onBack={() => navigate('/stages')} />
        ) : (
          <div className="moves">
            {yourTurn ? (
              movesFor(actor).map((m) => (
                <button
                  key={m.type}
                  className="move-btn"
                  disabled={!m.ready}
                  onClick={() => act(m.type)}
                >
                  <span className="move-name">{m.name}</span>
                  <span className="move-hint">{m.hint}</span>
                </button>
              ))
            ) : (
              <p className="meta center">
                {auto ? 'ออโต้กำลังเล่นให้' : `รอ ${actor?.name ?? ''} ลงมือ`}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function Combatant({ unit, active, selected, favoured, ally, onSelect }) {
  const pct = Math.round((unit.hp / unit.maxHp) * 100)
  const element = ELEMENTS[unit.element]

  return (
    <button
      className="combatant peek-host"
      data-active={active}
      data-selected={selected}
      data-down={!unit.alive}
      onClick={onSelect}
      disabled={!onSelect}
    >
      <span className="combatant-mark">{unit.mark}</span>
      <div className="combatant-body">
        <div className="combatant-name">
          {unit.name}
          <span className="tag element">
            {element.mark} {element.name}
          </span>
          {favoured && <span className="tag good">แพ้ทางเรา</span>}
          {unit.effects.burn > 0 && <span className="tag burn">ติดไฟ</span>}
          {unit.effects.taunt > 0 && <span className="tag">ดึงเป้า</span>}
          {unit.effects.stun > 0 && <span className="tag">สตัน</span>}
          {unit.effects.shield && <span className="tag">เกราะ</span>}
        </div>
        <div className="bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <div className="combatant-meta">
          {unit.hp} / {unit.maxHp}
          {ally && ` · เลเวล ${unit.level} · เวท ${unit.mp} · เกจ ${unit.gauge}`}
        </div>
      </div>

      <StatPeek
        title={unit.name}
        subtitle={`เลเวล ${unit.level}`}
        element={unit.element}
        stats={[
          ['พลังชีวิต', `${unit.hp}/${unit.maxHp}`],
          ['โจมตี', unit.atk],
          ['ป้องกัน', unit.def],
          ['ความเร็ว', unit.spd],
        ]}
        note={ally ? `พลังเวท ${unit.mp} · เกจไม้ตาย ${unit.gauge}/100` : null}
      />
    </button>
  )
}

function Result({ outcome, reward, onBack }) {
  const won = outcome === 'won'

  return (
    <section className="panel result">
      <div className="panel-head">{won ? 'ชนะแล้ว' : 'พ่ายแพ้'}</div>
      {won ? (
        <>
          <p className="stars">{'★'.repeat(reward?.stars ?? 0).padEnd(3, '☆')}</p>
          {reward?.exp > 0 && <p>ได้ค่าประสบการณ์ {reward.exp} หน่วย</p>}
          {reward?.levels
            ?.filter((l) => l.gained > 0)
            .map((l) => (
              <p className="levelup" key={l.id}>
                เลเวลขึ้นเป็น {l.level} แล้ว
              </p>
            ))}
          {reward?.firstClear && <p>ผ่านครั้งแรก ได้เพชร {reward.gems} เม็ด</p>}
          {reward && !reward.firstClear && !reward.failed && <p className="meta">เคยผ่านด่านนี้แล้ว รอบนี้ไม่ได้เพชรเพิ่ม</p>}
          {reward?.failed && <div className="trace">บันทึกผลไม่สำเร็จ ตรวจว่าอัปโหลด Security Rules เวอร์ชันล่าสุดแล้วหรือยัง</div>}
        </>
      ) : (
        <p>ลองจัดทีมใหม่หรือไปเก็บเลเวลจากด่านก่อนหน้าดู</p>
      )}
      <button className="rune-link block" onClick={onBack}>
        กลับไปแผนที่
      </button>
    </section>
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
