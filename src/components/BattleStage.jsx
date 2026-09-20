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
// ท่าธรรมดา/สกิล/สตัน ต้องสั้นกว่า STEP_DELAY ที่ต่ำสุด (BossFight.jsx = 650ms) เสมอ ไม่งั้นเทิร์นถัดไป
// จะมาตัดอนิเมชันที่กำลังเล่นอยู่กลางคันจนดูกระตุก ส่วนท่าไม้ตายยาวกว่านั้นได้ เพราะทั้งสามหน้า
// (Battle.jsx/PvpMatch.jsx/BossFight.jsx) หน่วงเทิร์นถัดไปนานขึ้นเป็นพิเศษเฉพาะตอน lastAction.type
// เป็น 'ultimate' อยู่แล้ว (ดู ULTIMATE_STEP_DELAY ในแต่ละไฟล์)
// ─────────────────────────────────────────────────────────────

// ท่าไม้ตายให้เวลานานกว่าท่าอื่นชัดเจน เพราะมีทั้งฉากกลางจอ+รูปทรงเฉพาะธาตุที่ต้องดูออก
// ต่างจากท่าธรรมดาที่จบไวได้ ฝั่ง Battle.jsx/PvpMatch.jsx/BossFight.jsx ต้องหน่วงเทิร์นถัดไปนานขึ้นเป็นพิเศษ
// เฉพาะตอนท่าไม้ตายเท่านั้น (เช็คจาก lastAction.type ก่อนตั้งเวลาเดินเทิร์นออโต้) ไม่งั้นแบนเนอร์นี้โดนตัดกลางคัน
const FX_MS = { attack: 420, skill: 560, ultimate: 1150, stunned: 380 }

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

const ELEMENT_PARTICLES = { fire: 8, water: 8, wind: 6, earth: 7, light: 9, dark: 8 }
const BURST_DIST = { sm: 34, md: 58, lg: 88 }

// อนุภาคเอฟเฟคธาตุจริง (ไม่ใช่แค่ข้อความ) พุ่งออกจากจุดกลางของ .combatant กระจายมุมรอบวงเท่า ๆ กัน
// สีธาตุมาจากผู้ลงมือท่านั้นเสมอ ไม่ใช่ธาตุของเป้าหมาย เพราะเอฟเฟคคือของท่าที่ปล่อยออกมา
// รูปร่าง/จังหวะแยกตามธาตุจริง ๆ ที่ styles.css (ไฟ/น้ำ/แสง/มืด เป็นวงกลมพุ่งออก, ลมเป็นริ้ว, ดินเป็นก้อนหมุนร่วง)
// จำนวนอนุภาคต้องลดลงตอนท่าเล็ก (sm) และเพิ่มตอนท่าไม้ตาย (lg) ไม่ใช่แค่ตั้งระยะห่างเปลี่ยน
// เพราะระยะวงเล็กกว่า ถ้าจำนวนเท่าเดิมอนุภาคจะถูกอัดแน่นจนแสงเรืองทับกันเป็นก้อนเดียว (บั๊กที่เจอจริง)
function ElementBurst({ element, size = 'md', ring }) {
  if (!element) return null
  const base = ELEMENT_PARTICLES[element] ?? 6
  const count = Math.max(4, base + (size === 'lg' ? 3 : size === 'sm' ? -3 : 0))
  const dist = BURST_DIST[size] ?? 24
  return (
    <span className="vfx" data-vfx-el={element} data-vfx-size={size} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="vfx-p"
          style={{
            '--a': `${Math.round((360 / count) * i)}deg`,
            '--delay': `${i * 30}ms`,
            '--dist': `${dist}px`,
          }}
        />
      ))}
      {ring && <span className="vfx-ring" />}
      {element === 'earth' && size !== 'sm' && <span className="vfx-dust" />}
    </span>
  )
}

// ภาพเฉพาะของแต่ละธาตุตอนปล่อยท่าไม้ตาย แทนที่จะใช้รัศมี+แฟลชแบบเดียวกันหมดแล้วเปลี่ยนแค่สี
// ไฟ = เปลวไฟลุกวูบ, วายุ = ลมหมุนวน+ริ้วเฉือน, น้ำ = คลื่นซัด+ฟองฟู่, ดิน = ทิวเขาอลังการ,
// แสง = รัศมี+ประกายดาว (ยังใช้รัศมีเดิมเพราะตรงคอนเซปต์อยู่แล้ว), มืด = หลุมดำขยายตัว+จานพอกพูนหมุน
function UltimateFx({ element }) {
  if (element === 'fire') {
    // ระยะห่างต้องมากกว่าความกว้างเปลว+แสงเรือง (ดู .vfx-ult-flame) ไม่งั้นเปลวจะทับกันจนกลายเป็นก้อนแสงกลม ๆ
    const flames = [-80, -40, 0, 40, 80]
    return flames.map((x, i) => (
      <span
        key={i}
        className="vfx-ult-flame"
        style={{ '--x': `${x}px`, '--wob': `${i % 2 ? 8 : -8}deg`, animationDelay: `${i * 60}ms` }}
      />
    ))
  }

  if (element === 'wind') {
    return (
      <>
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="vfx-ult-gust"
            style={{ '--a': `${i * 60}deg`, animationDelay: `${i * 45}ms` }}
          />
        ))}
        <span className="vfx-ult-slash" style={{ '--rot': '-8deg', top: '44%' }} />
        <span className="vfx-ult-slash" style={{ '--rot': '6deg', top: '58%', animationDelay: '130ms' }} />
      </>
    )
  }

  if (element === 'water') {
    const bubbles = [-84, -56, -28, 0, 28, 56, 84]
    return (
      <>
        <span className="vfx-ult-wave" />
        {bubbles.map((x, i) => (
          <span
            key={i}
            className="vfx-ult-bubble"
            style={{ '--x': `${x}px`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </>
    )
  }

  if (element === 'earth') {
    return (
      <>
        <span className="vfx-ult-glow" />
        <span className="vfx-ult-peak" style={{ '--x': '-2.4rem', '--s': 0.82 }} />
        <span className="vfx-ult-peak" style={{ '--x': '2.6rem', '--s': 0.9, animationDelay: '70ms' }} />
        <span className="vfx-ult-peak" style={{ '--x': '0.1rem', '--s': 1.18, animationDelay: '140ms' }} />
      </>
    )
  }

  if (element === 'light') {
    return (
      <>
        <span className="vfx-ult-rays" />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / 8
          const r = 40 + (i % 2) * 20
          return (
            <span
              key={i}
              className="vfx-ult-spark"
              style={{
                left: `calc(50% + ${Math.round(Math.cos(angle) * r)}px)`,
                top: `calc(50% + ${Math.round(Math.sin(angle) * r)}px)`,
                animationDelay: `${i * 70}ms`,
              }}
            />
          )
        })}
      </>
    )
  }

  if (element === 'dark') {
    return (
      <>
        <span className="vfx-ult-accretion" />
        <span className="vfx-ult-hole" />
      </>
    )
  }

  return (
    <>
      <span className="vfx-ult-rays" />
      <span className="vfx-ult-core" />
    </>
  )
}

// แบนเนอร์ท่าไม้ตายกลางจอ แยกจาก ElementBurst ที่ติดกับตัวละครแต่ละตัว
// อันนี้คลุมทั้งสนามรบ ให้ความรู้สึก "จังหวะใหญ่" สมกับเป็นท่าไม้ตาย ไม่ใช่แค่เอฟเฟคเล็ก ๆ ที่ตัวละคร
function UltimateBanner({ element, name, move }) {
  return (
    <div className="vfx-ult" data-vfx-el={element} aria-hidden="true">
      <UltimateFx element={element} />
      <div className="vfx-ult-text">
        <span className="vfx-ult-tag">ท่าไม้ตาย</span>
        {move && <span className="vfx-ult-move">{move}</span>}
        {name && <span className="vfx-ult-name">{name}</span>}
      </div>
    </div>
  )
}

export function Combatant({ unit, active, selected, favoured, ally, onSelect, cast, impacts, fxElement }) {
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

      {cast && cast !== 'stunned' && (
        <ElementBurst element={fxElement} size={cast === 'ultimate' ? 'lg' : cast === 'skill' ? 'md' : 'sm'} />
      )}

      {impacts?.length > 0 && (primaryImpact === 'damage' || primaryImpact === 'crit') && (
        <ElementBurst
          element={fxElement}
          size={primaryImpact === 'crit' ? 'lg' : 'md'}
          ring={fxElement === 'water' || fxElement === 'dark'}
        />
      )}

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
  const actorUnit = fx ? state.units.find((u) => u.key === fx.actorKey) : undefined
  // ธาตุของผู้ลงมือท่านี้ ใช้ทั้งกับอนุภาคเอฟเฟคตอนร่าย/ตอนโดน และแสงทั้งสนามตอนท่าไม้ตาย
  const fxElement = actorUnit?.element
  // ท่าไม้ตายเท่านั้นที่เขย่า/ปล่อยแสงทั้งสนาม + โชว์แบนเนอร์กลางจอ สีตามธาตุของคนร่าย
  const isUltimate = fx?.type === 'ultimate'
  const ultimateElement = isUltimate ? fxElement : undefined

  return (
    <div className="battle-arena" data-flash={ultimateElement}>
      {isUltimate && (
        <UltimateBanner element={fxElement} name={actorUnit?.name} move={actorUnit?.ultimate?.name} />
      )}

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
            fxElement={fxElement}
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
            fxElement={fxElement}
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
