import { CHARACTERS, ELEMENTS, ROLES } from '../data/characters'
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
              <div className="card peek-unit" key={i}>
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
                  <p className="meta cp">⚔ {formatPower(entryPower(e))}</p>
                </div>
              </div>
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
