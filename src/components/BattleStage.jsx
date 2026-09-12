import { useEffect, useRef } from 'react'
import { ELEMENTS } from '../data/characters'
import { movesFor } from '../lib/battle'
import { hasAdvantage } from '../lib/stats'
import StatPeek from './StatPeek'

// ─────────────────────────────────────────────────────────────
// หน้าจอสนามรบ ใช้ร่วมกันทั้งด่านเนื้อเรื่องและการประลอง
//
// เดิมโค้ดส่วนนี้อยู่ใน Battle.jsx ที่เดียว พอจะทำ PvP แบบเล่นเองด้วย
// ถ้าคัดลอกไปอีกไฟล์ เวลาแก้บั๊กหรือปรับหน้าตาจะต้องแก้สองที่เสมอ
// แล้ววันหนึ่งจะลืมที่ใดที่หนึ่ง
//
// ตัวนี้ไม่รู้จักด่าน ไม่รู้จักคู่แข่ง รับแค่สถานะการต่อสู้กับฟังก์ชันสั่งท่า
// ─────────────────────────────────────────────────────────────

export function Combatant({ unit, active, selected, favoured, ally, onSelect }) {
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

export default function BattleStage({
  state,
  actor,
  auto,
  target,
  setTarget,
  onAct,
  waitingLabel,
}) {
  const logEnd = useRef(null)

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: 'nearest' })
  }, [state?.log.length])

  if (!state) return null

  const foes = state.units.filter((u) => u.side === 'enemy')
  const allies = state.units.filter((u) => u.side === 'ally')
  const yourTurn = actor?.side === 'ally' && !auto && !state.outcome

  return (
    <>
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

      <div className="moves">
        {state.outcome ? null : yourTurn ? (
          movesFor(actor).map((m) => (
            <button
              key={m.type}
              className="move-btn"
              disabled={!m.ready}
              onClick={() => onAct(m.type)}
            >
              <span className="move-name">{m.name}</span>
              <span className="move-hint">{m.hint}</span>
            </button>
          ))
        ) : (
          <p className="meta center">
            {auto ? 'ออโต้กำลังเล่นให้' : waitingLabel ?? `รอ ${actor?.name ?? ''} ลงมือ`}
          </p>
        )}
      </div>
    </>
  )
}
