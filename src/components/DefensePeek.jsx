import { useState } from 'react'
import { CHARACTERS, ELEMENTS, ROLES } from '../data/characters'
import { SLOTS, GRADES, gearStat } from '../data/gear'
import { entryStats, entrySkillScale } from '../lib/stats'
import { effectiveRarity, awakenName } from '../data/ascension'
import { entryLevelCap } from '../lib/stats'
import { entryPower, formatPower } from '../lib/power'
import { rankLabel, rankOf } from '../data/ranks'
import { defenseEntries } from '../lib/pvp'

/**
 * ดูทีมตั้งรับของผู้เล่นคนอื่น
 *
 * แสดงได้เฉพาะทีมตั้งรับ เพราะนั่นคือข้อมูลชุดเดียวที่เจ้าตัวเก็บไว้ในเอกสารของตัวเอง
 * กระเป๋าตัวละครทั้งหมดอยู่ในคอลเลกชันย่อยที่กฎไม่เปิดให้คนอื่นอ่าน และไม่ควรเปิดด้วย
 */
export default function DefensePeek({ foe, title, onClose }) {
  const team = defenseEntries(foe)
  const total = team.reduce((s, e) => s + entryPower(e), 0)
  const [open, setOpen] = useState(null)

  return (
    <div className="veil" role="dialog" aria-modal="true">
      <section className="panel popup peek-popup">
        <div className="panel-head">{title ?? `ทีมตั้งรับของ ${foe.username}`}</div>
        <p className="meta">
          {rankOf(foe.pvpPoints ?? 0).mark} {rankLabel(foe.pvpPoints ?? 0)} · ⚔ {formatPower(total)}
        </p>

        {team.length === 0 && <p className="meta">ยังไม่ได้ตั้งทีมตั้งรับ</p>}

        <div className="peek-team">
          {team.map((e, i) => {
            const c = CHARACTERS[e.id]
            if (!c) return null
            return (
              <button
                className="card peek-unit"
                key={i}
                data-open={open === i}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="card-mark">{ELEMENTS[c.element].mark}</span>
                <div className="card-body">
                  <h3>
                    {c.name}
                    <span
                      className="rarity"
                      data-rarity={effectiveRarity(e.id, e.tier)}
                      data-upgraded={(e.tier ?? 0) > 0}
                    >
                      {effectiveRarity(e.id, e.tier)}
                    </span>
                    {(e.awaken ?? 0) > 0 && (
                      <span className="awaken-tag">{awakenName(e.awaken)}</span>
                    )}
                  </h3>
                  <p className="meta">
                    {ROLES[c.role]} · เลเวล {e.level}/{entryLevelCap(e.id, e)} ·{' '}
                    {'★'.repeat(e.star ?? 1)}
                  </p>
                  <p className="meta cp">
                    ⚔ {formatPower(entryPower(e))}
                    <span className="peek-more">{open === i ? ' ▲' : ' ▼ ดูรายละเอียด'}</span>
                  </p>

                  {open === i && <UnitDetail entry={e} char={c} />}
                </div>
              </button>
            )
          })}
        </div>

        <button className="rune-link block primary" onClick={onClose}>
          ปิด
        </button>
      </section>
    </div>
  )
}

/** รายละเอียดของตัวละครหนึ่งตัวในทีมตั้งรับ กางออกเมื่อกด */
function UnitDetail({ entry, char }) {
  const st = entryStats(entry.id, entry)
  const scale = entrySkillScale(entry)
  const gear = entry.gear ?? []

  return (
    <div className="unit-detail">
      <dl className="ledger">
        {[
          ['พลังชีวิต', st.hp],
          ['พลังโจมตี', st.atk],
          ['พลังป้องกัน', st.def],
          ['ความเร็ว', st.spd],
          ['คริติคอล', st.crit + '%'],
        ].map(([k, v]) => (
          <div className="ledger-row" key={k}>
            <dt>{k}</dt>
            <dd>{typeof v === 'number' ? v.toLocaleString('th-TH') : v}</dd>
          </div>
        ))}
      </dl>

      <div className="move">
        <h3>{char.skill.name}</h3>
        <p>{char.skill.desc}</p>
      </div>
      <div className="move ult">
        <h3>{char.ultimate.name}</h3>
        <p>{char.ultimate.desc}</p>
      </div>
      <p className="meta tiny">
        ระดับสกิล {entry.skillLevel ?? 1} · ความแรงสกิลรวม {Math.round(scale * 100)}%
      </p>

      {gear.length > 0 && (
        <p className="meta tiny">
          อุปกรณ์{' '}
          {gear
            .map((g) => `${SLOTS[g.slot].name}${GRADES[g.grade].name}+${g.plus ?? 0}`)
            .join(' · ')}
        </p>
      )}
    </div>
  )
}
