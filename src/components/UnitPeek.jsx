import { CHARACTERS, ELEMENTS, ROLES } from '../data/characters'
import { GRADES, SLOTS, SLOT_IDS, gearStat, gearSubstatLines } from '../data/gear'
import { entryStats, entryLevelCap } from '../lib/stats'
import { effectiveRarity, awakenName } from '../data/ascension'
import { entryPower, formatPower } from '../lib/power'

/**
 * ป๊อปอัปดูรายละเอียดตัวละครหนึ่งตัวของผู้เล่นคนอื่น (สตัสเต็ม + อุปกรณ์แบบเห็นชัด)
 *
 * แยกจาก DefensePeek เพราะที่นั่นดูทั้งทีมพร้อมกัน ส่วนอันนี้เจาะตัวเดียวให้เห็นรายละเอียดเต็ม ๆ
 */
export default function UnitPeek({ entry, onClose }) {
  const char = CHARACTERS[entry.id]
  if (!char) return null

  const st = entryStats(entry.id, entry)
  const rarity = effectiveRarity(entry.id, entry.tier)
  const gear = entry.gear ?? []

  return (
    <div className="veil" role="dialog" aria-modal="true">
      <section className="panel popup peek-popup">
        <div className="panel-head">
          {ELEMENTS[char.element].mark} {char.name}
        </div>

        <p className="meta chips">
          <span className="chip">ธาตุ{ELEMENTS[char.element].name}</span>
          <span className="chip">{ROLES[char.role]}</span>
          <span className="chip gold">{rarity}</span>
          {(entry.awaken ?? 0) > 0 && (
            <span className="chip good">{awakenName(entry.awaken)}</span>
          )}
          <span className="chip">{'★'.repeat(entry.star ?? 1)}</span>
        </p>

        <p className="meta">
          เลเวล {entry.level}/{entryLevelCap(entry.id, entry)} · ⚔ {formatPower(entryPower(entry))}
        </p>

        <dl className="ledger stat-grid">
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

        <h2 className="section-title">อุปกรณ์</h2>
        <div className="gear-list">
          {SLOT_IDS.map((sid) => {
            const worn = gear.find((g) => g.slot === sid)
            return (
              <div className="gear-row" key={sid} data-worn={Boolean(worn)}>
                <span className="gear-mark">{SLOTS[sid].mark}</span>
                <div className="gear-body">
                  {worn ? (
                    <>
                      <h3 style={{ color: GRADES[worn.grade].color }}>
                        {SLOTS[sid].name}
                        {GRADES[worn.grade].name}
                        {worn.plus > 0 && ` +${worn.plus}`}
                      </h3>
                      <p className="meta">
                        +{gearStat(worn)} {SLOTS[sid].stat} · ระดับไอเทม {worn.ilvl}
                      </p>
                      {gearSubstatLines(worn).length > 0 && (
                        <p className="meta tiny substat">
                          {gearSubstatLines(worn)
                            .map((s) => `+${s.value}${s.isPercent ? '%' : ''} ${s.label}`)
                            .join(' · ')}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="meta">{SLOTS[sid].name}</h3>
                      <p className="meta tiny">ว่าง</p>
                    </>
                  )}
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
