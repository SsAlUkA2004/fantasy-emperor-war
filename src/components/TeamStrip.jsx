import { Link } from 'react-router-dom'
import { CHARACTERS, ELEMENTS, TEAM_SIZE } from '../data/characters'
import { formatPower } from '../lib/power'

/**
 * แถบทีมปัจจุบัน วางไว้ทั้งหน้าหลักและหน้าแผนที่
 *
 * เดิมหน้าจัดทีมซ่อนอยู่ในปุ่มเล็ก ๆ ปนกับปุ่มอื่น ผู้เล่นที่สุ่มตัวละครมาใหม่
 * จึงไม่รู้ว่าต้องไปใส่ทีมเอง แล้วเข้าด่านด้วยตัวเดียวตลอด
 * แถบนี้ทำให้ช่องว่างมองเห็นได้ทันทีก่อนกดเข้าด่าน
 */
export default function TeamStrip({ team = [], power }) {
  const empty = TEAM_SIZE - team.length

  return (
    <section className="team-strip">
      <div className="team-strip-slots">
        {[...Array(TEAM_SIZE)].map((_, i) => {
          const c = team[i] ? CHARACTERS[team[i]] : null
          return (
            <div className="mini-slot" key={i} data-filled={Boolean(c)}>
              {c ? (
                <>
                  <span className="mini-mark">{ELEMENTS[c.element].mark}</span>
                  <span className="mini-name">{c.name}</span>
                </>
              ) : (
                <span className="mini-empty">ว่าง</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="team-strip-foot">
        <span className="meta">
          {power !== undefined && <strong className="cp">⚔ {formatPower(power)}</strong>}
          {power !== undefined && ' · '}
          {empty > 0 ? `ว่างอีก ${empty} ช่อง` : 'ทีมเต็มแล้ว'}
        </span>
        <Link className="plain-link inline" to="/team">
          จัดทีม
        </Link>
      </div>
    </section>
  )
}
