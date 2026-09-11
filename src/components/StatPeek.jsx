import { ELEMENTS } from '../data/characters'
import { elementMatchup } from '../lib/stats'

/**
 * กล่องสถานะย่อ แสดงเมื่อเอาเมาส์ชี้
 *
 * ซ่อนไว้ทั้งหมดบนอุปกรณ์สัมผัส ด้วย @media (hover: hover) ในไฟล์สไตล์
 * เพราะบนมือถือไม่มีสถานะ "ชี้" การแตะคือการกดเข้าไปดูแบบเต็มอยู่แล้ว
 * ถ้าปล่อยไว้ กล่องจะเด้งค้างหลังแตะแล้วบังเนื้อหาข้างล่าง
 */
export default function StatPeek({ title, subtitle, stats, element, note, power }) {
  const el = element ? ELEMENTS[element] : null
  const matchup = element ? elementMatchup(element) : null

  return (
    <div className="peek" role="tooltip" aria-hidden="true">
      <div className="peek-head">
        {title}
        {subtitle && <span className="peek-sub">{subtitle}</span>}
      </div>

      <div className="peek-grid">
        {stats.map(([label, value]) => (
          <div className="peek-cell" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {power !== undefined && (
        <div className="peek-power">
          <span>ค่าพลังรวม</span>
          <strong>{power.toLocaleString('th-TH')}</strong>
        </div>
      )}

      {el && (
        <div className="peek-foot">
          <span>
            {el.mark} ธาตุ{el.name}
          </span>
          <span className="peek-matchup">
            แรงใส่ {matchup.strongAgainst ? ELEMENTS[matchup.strongAgainst].mark : '—'} · โดนแรงจาก{' '}
            {matchup.weakTo ? ELEMENTS[matchup.weakTo].mark : '—'}
          </span>
        </div>
      )}

      {note && <p className="peek-note">{note}</p>}
    </div>
  )
}
