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

// ─────────────────────────────────────────────────────────────
// ฉากท่าไม้ตาย
//
// ของเดิมวาดด้วย gradient ซ้อน ๆ กัน ผลคือพอเรนเดอร์จริงทุกธาตุออกมาหน้าตาเหมือนกันหมด
// คือ "ดวงแสงมัว ๆ" เพราะเงาฟุ้งกินพื้นที่มากกว่าตัวรูปทรงเอง รอบนี้เลยรื้อทิ้งแล้ววาดเป็น SVG
// เป็นรูปทรงจริง ๆ ขอบคม มีสีทึบ ไม่พึ่งเงาฟุ้ง
//
// ทุกฉากวาดอยู่ในกรอบพิกัด 320x200 หน่วยเท่ากันหมด แล้วค่อยให้ CSS ย่อทั้งกรอบทีเดียว
// ขนาดบนจอจึงไม่ผูกกับความกว้างของ .battle-arena อีกต่อไป (จอเดสก์ท็อปเคยทำให้มันบวมจนเต็มจอ)
//
// การขยับใช้ CSS ทั้งหมด โดยตั้ง transform-box: fill-box ให้จุดหมุนอ้างอิงกรอบของรูปเอง
// ส่วนตำแหน่ง/มุมเริ่มต้นใช้ transform attribute ของ <g> ชั้นนอก เพื่อไม่ให้ชนกับ transform ของ CSS
// ─────────────────────────────────────────────────────────────

const FLAME_OUTER = 'M0 0 C-27 -25 -17 -60 0 -96 C17 -60 27 -25 0 0 Z'
const FLAME_CORE = 'M0 -8 C-14 -24 -9 -47 0 -70 C9 -47 14 -24 0 -8 Z'

function FireScene() {
  const flames = [
    { x: 58, s: 0.72, d: 150 },
    { x: 108, s: 1.02, d: 60 },
    { x: 160, s: 1.3, d: 0 },
    { x: 212, s: 0.98, d: 80 },
    { x: 262, s: 0.7, d: 140 },
  ]
  const embers = [
    { x: 92, y: 118, r: 4, d: 200 },
    { x: 140, y: 84, r: 5, d: 120 },
    { x: 196, y: 102, r: 3.5, d: 240 },
    { x: 240, y: 76, r: 4.5, d: 170 },
  ]
  return (
    <g>
      {flames.map((f, i) => (
        <g key={i} transform={`translate(${f.x} 196) scale(${f.s})`}>
          <g className="ult-flame" style={{ animationDelay: `${f.d}ms` }}>
            <path className="ult-flame-outer" d={FLAME_OUTER} />
            <path className="ult-flame-core" d={FLAME_CORE} />
          </g>
        </g>
      ))}
      {embers.map((e, i) => (
        <circle
          key={i}
          className="ult-ember"
          cx={e.x}
          cy={e.y}
          r={e.r}
          style={{ animationDelay: `${e.d}ms` }}
        />
      ))}
    </g>
  )
}

function WindScene() {
  // วงลม: ส่วนโค้ง 270 องศา กรอบของมันจึงอยู่กึ่งกลางวงพอดี หมุน/กางออกจากจุดเดียวกันได้สวย
  const rings = [
    { r: 28, w: 7, rot: 0, d: 0 },
    { r: 50, w: 5.5, rot: 130, d: 80 },
    { r: 72, w: 4, rot: 250, d: 160 },
  ]
  const streaks = [
    { y: 62, w: 4.5, d: 90 },
    { y: 100, w: 6, d: 0 },
    { y: 140, w: 4, d: 120 },
  ]
  return (
    <g>
      {rings.map((a, i) => (
        <g key={i} transform={`translate(160 100) rotate(${a.rot})`}>
          <path
            className="ult-gust"
            style={{ animationDelay: `${a.d}ms` }}
            strokeWidth={a.w}
            d={`M${a.r} 0 A${a.r} ${a.r} 0 1 1 0 ${-a.r}`}
          />
        </g>
      ))}
      {streaks.map((s, i) => (
        <path
          key={i}
          className="ult-streak"
          style={{ animationDelay: `${s.d}ms` }}
          strokeWidth={s.w}
          d={`M14 ${s.y + 16} Q160 ${s.y - 18} 306 ${s.y + 8}`}
        />
      ))}
    </g>
  )
}

function WaterScene() {
  const bubbles = [
    { x: 96, y: 126, r: 7, d: 120 },
    { x: 140, y: 100, r: 5, d: 180 },
    { x: 188, y: 112, r: 8, d: 60 },
    { x: 226, y: 86, r: 6, d: 150 },
    { x: 258, y: 120, r: 4.5, d: 100 },
  ]
  return (
    <g>
      <path
        className="ult-wave ult-wave-back"
        d="M-12 210 L-12 150 C40 126 94 118 142 132 C184 144 216 134 238 108 C254 148 226 180 176 184 C116 190 52 182 -12 210 Z"
      />
      <path
        className="ult-wave ult-wave-front"
        d="M-12 210 L-12 174 C46 158 98 152 144 160 C180 166 204 160 218 140 C230 172 204 194 162 198 C110 203 44 200 -12 210 Z"
      />
      {bubbles.map((b, i) => (
        <circle
          key={i}
          className="ult-bubble"
          cx={b.x}
          cy={b.y}
          r={b.r}
          style={{ animationDelay: `${b.d}ms` }}
        />
      ))}
    </g>
  )
}

function EarthScene() {
  const rubble = [
    { x: 72, y: 150, d: 140 },
    { x: 244, y: 158, d: 180 },
    { x: 110, y: 174, d: 100 },
  ]
  return (
    <g>
      <circle className="ult-sun" cx="160" cy="92" r="54" />
      <g className="ult-peak" style={{ animationDelay: '80ms' }}>
        <path className="ult-peak-far" d="M-14 202 L62 94 L138 202 Z" />
        <path className="ult-peak-far" d="M188 202 L262 102 L336 202 Z" />
      </g>
      <g className="ult-peak">
        <path className="ult-peak-near" d="M48 202 L160 44 L272 202 Z" />
        <path className="ult-snow" d="M160 44 L198 98 L180 91 L167 102 L154 90 L140 98 L122 94 Z" />
      </g>
      {rubble.map((r, i) => (
        <rect
          key={i}
          className="ult-rubble"
          x={r.x}
          y={r.y}
          width="11"
          height="11"
          rx="2"
          style={{ animationDelay: `${r.d}ms` }}
        />
      ))}
    </g>
  )
}

function LightScene() {
  // ลำแสงเป็นทรงกระสวยสมมาตรรอบจุด (0,0) กรอบของมันจึงอยู่กึ่งกลางพอดี ขยายออกจากศูนย์กลางได้ตรง ๆ
  const beams = [0, 30, 60, 90, 120, 150]
  const sparks = [
    { x: 76, y: 58, s: 1, d: 180 },
    { x: 240, y: 66, s: 0.82, d: 240 },
    { x: 104, y: 150, s: 0.7, d: 260 },
    { x: 252, y: 144, s: 0.95, d: 130 },
    { x: 160, y: 34, s: 0.66, d: 210 },
  ]
  return (
    <g>
      {beams.map((rot, i) => (
        <g key={i} transform={`translate(160 100) rotate(${rot})`}>
          <path
            className="ult-beam"
            style={{ animationDelay: `${i * 35}ms` }}
            d={i % 2 ? 'M-98 0 L0 -7 L98 0 L0 7 Z' : 'M-140 0 L0 -10 L140 0 L0 10 Z'}
          />
        </g>
      ))}
      <circle className="ult-halo" cx="160" cy="100" r="32" />
      {sparks.map((s, i) => (
        <g key={i} transform={`translate(${s.x} ${s.y}) scale(${s.s})`}>
          <path
            className="ult-spark"
            style={{ animationDelay: `${s.d}ms` }}
            d="M0 -16 Q3 -3 16 0 Q3 3 0 16 Q-3 3 -16 0 Q-3 -3 0 -16 Z"
          />
        </g>
      ))}
    </g>
  )
}

function DarkScene() {
  const pulls = [0, 60, 120, 180, 240, 300]
  return (
    <g>
      <g transform="translate(160 100)">
        <ellipse className="ult-disc" rx="84" ry="25" />
      </g>
      {pulls.map((rot, i) => (
        <g key={i} transform={`translate(160 100) rotate(${rot})`}>
          <rect
            className="ult-pull"
            x="44"
            y="-2"
            width="70"
            height="4"
            rx="2"
            style={{ animationDelay: `${i * 40}ms` }}
          />
        </g>
      ))}
      <circle className="ult-hole" cx="160" cy="100" r="34" />
      <circle className="ult-rim" cx="160" cy="100" r="34" />
    </g>
  )
}

const ULT_SCENES = {
  fire: FireScene,
  wind: WindScene,
  water: WaterScene,
  earth: EarthScene,
  light: LightScene,
  dark: DarkScene,
}

function UltimateScene({ element, name, move }) {
  const Scene = ULT_SCENES[element] ?? LightScene
  return (
    <div className="ult" data-el={element} aria-hidden="true">
      <div className="ult-art">
        <svg viewBox="0 0 320 200" role="presentation">
          <Scene />
        </svg>
      </div>
      <div className="ult-label">
        <span className="ult-kicker">ท่าไม้ตาย</span>
        {move && <span className="ult-move">{move}</span>}
        {name && <span className="ult-owner">{name}</span>}
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
  // ธาตุของผู้ลงมือท่านี้ ใช้ทั้งกับอนุภาคเอฟเฟคตอนร่าย/ตอนโดน และฉากท่าไม้ตาย
  const fxElement = actorUnit?.element
  const isUltimate = fx?.type === 'ultimate'
  const ultimateElement = isUltimate ? fxElement : undefined

  return (
    <div className="battle-arena" data-flash={ultimateElement}>
      {isUltimate && (
        <UltimateScene element={fxElement} name={actorUnit?.name} move={actorUnit?.ultimate?.name} />
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
