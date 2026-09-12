import { Link } from 'react-router-dom'
import { CHAPTERS } from '../data/stages'

/**
 * หน้าจอบอกว่าโหมดนี้ยังไม่เปิด
 *
 * บอกด้วยว่าเหลือด่านไหนบ้าง ไม่ใช่แค่ว่ายังไม่ผ่าน
 * ผู้เล่นจะได้รู้ทันทีว่าต้องไปทำอะไรต่อ ไม่ต้องกลับไปไล่ดูเอง
 */
export default function Locked({ mode, progress = {} }) {
  const chapter = CHAPTERS[mode.chapter - 1]
  const left = chapter.stages.filter((s) => (progress[s.id] ?? 0) === 0)

  return (
    <main className="screen top">
      <div className="sheet">
        <h1>{mode.label}</h1>
        <p className="meta center locked-note">
          ต้องผ่านบทที่ {mode.chapter} · {chapter.name} ให้ครบทุกด่านก่อน
        </p>

        <h2 className="section-title">ด่านที่ยังเหลือ {left.length} ด่าน</h2>
        <div className="stage-list">
          {left.map((s) => (
            <div className="stage-row" key={s.id} data-locked>
              <span className="stage-id">{s.id}</span>
              <span className="stage-body">
                <span className="stage-name">{s.name}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="gate">
          <Link className="rune-link" to="/stages">
            ไปที่แผนที่ด่าน
          </Link>
          <Link className="rune-link" to="/">
            หน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  )
}
