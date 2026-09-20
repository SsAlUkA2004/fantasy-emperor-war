import { useEffect, useRef, useState } from 'react'
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
//
// อนิเมชันท่าโจมตีอ่านจาก state.lastAction (โครงสร้างที่ lib/battle.js เติมให้ทุกเทิร์น)
// ไม่ได้แกะข้อความ log เอาเอง จึงรู้แน่ชัดว่าใครลงมือ ท่าไหน โดนใครบ้าง คริไหม
// ตั้งเวลาเองให้สั้นกว่า STEP_DELAY ของ Battle.jsx (750ms) เสมอ ไม่งั้นเทิร์นถัดไปจะมาตัดอนิเมชัน
// ที่กำลังเล่นอยู่กลางคันจนดูกระตุก
// ─────────────────────────────────────────────────────────────

const FX_MS = { attack: 420, skill: 560, ultimate: 680, stunned: 380 }

const STATUS_LABEL = {
  burn: 'ติดไฟ',
  stun: 'ขยับไม่ได้',
  taunt: 'ดึงเป้า',
  defUp: 'ป้องกัน+',
  shield: 'ได้เกราะ',
}

/** ชนิดผลลัพธ์ที่ใช้เลือกสี/อนิเมชัน คริกับดาเมจธรรมดาแยกกันแม้จะมาจาก hit.kind เดียวกัน */
function impactKindOf(hit) {
  if (hit.kind === 'damage' && hit.crit) return 'crit'
  return hit.kind
}

function popupText(hit) {
  if (hit.kind === 'heal') return `+${hit.amount.toLocaleString('th-TH')}`
  if (hit.kind === 'block') return 'กันได้'
  if (hit.kind === 'cleanse') return 'หายสถานะ'
  if (hit.kind === 'status') return STATUS_LABEL[hit.status] ?? hit.status
  return `-${hit.amount.toLocaleString('th-TH')}`
}

export function Combatant({ unit, active, selected, favoured, ally, onSelect, cast, impacts }) {
  const pct = Math.round((unit.hp / unit.maxHp) * 100)
  const element = ELEMENTS[unit.element]
  const primaryImpact = impacts?.[0] ? impactKindOf(impacts[0]) : undefined

  return (
    <button
      className="combatant peek-host"
      data-active={active}
      data-selected={selected}
      data-down={!unit.alive}
      data-element={unit.element}
      data-cast={cast || undefined}
      data-impact={primaryImpact}
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

      {impacts?.map((hit, i) => (
        <span
          key={i}
          className="dmg-pop"
          data-impact={impactKindOf(hit)}
          style={{ animationDelay: `${i * 90}ms` }}
        >
          {popupText(hit)}
        </span>
      ))}

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
  const [fx, setFx] = useState(null)

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: 'nearest' })
  }, [state?.log.length])

  // fx อยู่ได้สั้น ๆ ตามชนิดท่า แล้วเคลียร์ตัวเองทิ้ง ให้เทิร์นถัดไปสร้างของใหม่เสมอ
  // (ไม่ใช้ state.lastAction ตรง ๆ ในการเรนเดอร์ เพราะอยากให้ผลจบแล้วหายไปเอง ไม่ค้างจนเทิร์นถัดไป)
  useEffect(() => {
    if (!state?.lastAction) return
    setFx(state.lastAction)
    const ms = FX_MS[state.lastAction.type] ?? FX_MS.attack
    const t = setTimeout(() => setFx(null), ms)
    return () => clearTimeout(t)
  }, [state?.lastAction])

  if (!state) return null

  const foes = state.units.filter((u) => u.side === 'enemy')
  const allies = state.units.filter((u) => u.side === 'ally')
  const yourTurn = actor?.side === 'ally' && !auto && !state.outcome
  const hitsFor = (key) => fx?.hits.filter((h) => h.targetKey === key)
  // ท่าไม้ตายเท่านั้นที่เขย่า/ปล่อยแสงทั้งสนาม สีตามธาตุของคนร่าย
  const ultimateElement =
    fx?.type === 'ultimate' ? state.units.find((u) => u.key === fx.actorKey)?.element : undefined

  return (
    <div className="battle-arena" data-flash={ultimateElement}>
      <section className="field-side side-enemy">
        <h3 className="side-label enemy">ฝั่งศัตรู</h3>
        {foes.map((u) => (
          <Combatant
            key={u.key}
            unit={u}
            active={actor?.key === u.key}
            selected={target === u.key}
            favoured={actor?.side === 'ally' && hasAdvantage(actor.element, u.element)}
            onSelect={() => u.alive && setTarget(u.key)}
            cast={fx?.actorKey === u.key ? fx.type : null}
            impacts={hitsFor(u.key)}
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

      <section className="field-side side-ally">
        <h3 className="side-label ally">ฝั่งเรา</h3>
        {allies.map((u) => (
          <Combatant
            key={u.key}
            unit={u}
            active={actor?.key === u.key}
            ally
            cast={fx?.actorKey === u.key ? fx.type : null}
            impacts={hitsFor(u.key)}
          />
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
    </div>
  )
}
