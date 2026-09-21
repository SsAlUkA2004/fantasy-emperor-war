import { useEffect, useRef, useState } from 'react'
import Sigil from './Sigil'

// ─────────────────────────────────────────────────────────────
// ม่านเปิดเกม
//
// ตอนเข้าหน้าหลักครั้งแรกของการเปิดเกมแต่ละรอบ จะมีประตูสองบานปิดจออยู่ก่อน
// มีตราเวทหมุนกับชื่อเกมอยู่กลาง แล้วค่อยแหวกออกซ้าย-ขวาเผยหน้าหลักข้างใน
// เล่นตามคำว่า "เปิดประตูอาณาจักร" ที่เกมใช้เป็นข้อความรอโหลดอยู่แล้ว
//
// จังหวะผูกกับสองเงื่อนไขพร้อมกัน คือข้อมูลโหลดเสร็จ (ready) และอยู่ครบเวลาขั้นต่ำ
// ถ้าเน็ตเร็วจนโหลดเสร็จทันทีก็ยังได้ดูจนจบ ไม่ใช่วาบเดียวหาย
// และถ้าเน็ตช้ากว่านั้นประตูก็รอจนข้อมูลมาจริงค่อยเปิด ไม่เผยหน้าเปล่า ๆ ให้เห็น
// ─────────────────────────────────────────────────────────────

const LINES = [
  'กำลังเปิดประตูอาณาจักร',
  'ปลุกกองทัพจากนิทรา',
  'ลับคมอาวุธในคลังหลวง',
  'อ่านคำพยากรณ์ประจำบท',
  'จารึกชื่อจอมทัพลงศิลา',
]

const HOLD_MS = 1900 // เวลาขั้นต่ำที่ม่านต้องอยู่ ถึงข้อมูลจะพร้อมก่อนก็ตาม
const OPEN_MS = 950 // เวลาที่ประตูใช้แหวกออกจนสุด ต้องเท่ากับ transition ใน styles.css
const LINE_MS = 430

export default function BootCurtain({ ready, onDone }) {
  const [phase, setPhase] = useState('hold')
  const [line, setLine] = useState(0)
  const openedAt = useRef(Date.now())

  // เก็บ onDone ไว้ใน ref เพื่อไม่ให้ callback ที่สร้างใหม่ทุกเรนเดอร์ไปรีเซ็ตตัวจับเวลาเปิดประตู
  const done = useRef(onDone)
  useEffect(() => {
    done.current = onDone
  }, [onDone])

  useEffect(() => {
    const t = setInterval(() => setLine((i) => (i + 1) % LINES.length), LINE_MS)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!ready || phase !== 'hold') return
    const waited = Date.now() - openedAt.current
    const t = setTimeout(() => setPhase('open'), Math.max(0, HOLD_MS - waited))
    return () => clearTimeout(t)
  }, [ready, phase])

  useEffect(() => {
    if (phase !== 'open') return
    const t = setTimeout(() => done.current?.(), OPEN_MS)
    return () => clearTimeout(t)
  }, [phase])

  return (
    <div className="boot" data-phase={phase} aria-hidden="true">
      <div className="boot-door boot-door-l" />
      <div className="boot-door boot-door-r" />
      <div className="boot-seam" />

      <div className="boot-core">
        <div className="boot-sigil">
          <Sigil />
        </div>
        <h1 className="boot-title">ศึกจอมจักรพรรดิ</h1>
        <p className="boot-sub">FANTASY EMPEROR WAR</p>
        <p className="boot-status">{LINES[line]}</p>
        <div className="boot-bar">
          <span />
        </div>
      </div>
    </div>
  )
}
