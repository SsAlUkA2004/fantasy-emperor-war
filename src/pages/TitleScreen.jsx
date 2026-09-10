import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { checkConnection } from '../firebase'
import Sigil from './Sigil'

const REPORT = {
  checking: {
    head: 'กำลังติดต่อคลังเวท',
    body: 'ส่งคำขอไปยัง Firestore แล้ว รอสัญญาณตอบกลับ',
  },
  ok: {
    head: 'เชื่อมต่อสำเร็จ',
    body: 'เว็บคุยกับ Firestore ได้แล้ว และกฎความปลอดภัยยอมให้อ่านคอลเลกชัน characters',
  },
  locked: {
    head: 'เชื่อมต่อสำเร็จ',
    body: 'คำขอไปถึงเซิร์ฟเวอร์แล้ว และถูก Security Rules ปฏิเสธ ซึ่งถูกต้องสำหรับตอนนี้ เพราะยังไม่ได้เปิดสิทธิ์อ่านให้ใคร',
  },
  unconfigured: {
    head: 'ยังไม่ได้ตั้งค่า',
    body: 'เปิดไฟล์ src/firebaseConfig.js แล้ววางค่าจาก Firebase Console ลงไป จากนั้นรีเฟรชหน้านี้',
  },
  error: {
    head: 'ติดต่อไม่สำเร็จ',
    body: 'คำขอไปไม่ถึงปลายทาง มักเกิดจาก projectId พิมพ์ผิด หรือยังไม่ได้สร้าง Firestore ในโปรเจกต์',
  },
}

export default function TitleScreen() {
  const [result, setResult] = useState({ state: 'checking' })

  useEffect(() => {
    let alive = true
    checkConnection().then((r) => {
      if (alive) setResult(r)
    })
    return () => {
      alive = false
    }
  }, [])

  const lamp = result.state === 'unconfigured' ? 'idle' : result.state
  const report = REPORT[result.state] ?? REPORT.error

  return (
    <main className="screen">
      <div className="stage">
        <div className="sigil-mount">
          <Sigil />
          <div className="crest">
            <h1 className="crest-th">ศึกจอมจักรพรรดิ</h1>
            <p className="crest-en">Fantasy Emperor War</p>
          </div>
        </div>

        <p className="tagline">
          สะสมนักรบจากทั่วทั้งอาณาจักร จัดทีมสามคน แล้วชิงบัลลังก์ในทุกฤดูกาล
        </p>

        <section className="panel">
          <div className="panel-head">
            <span className="lamp" data-state={lamp} />
            {report.head}
          </div>
          <p>{report.body}</p>
          {result.state === 'ok' && result.empty && (
            <p className="hint">ตอนนี้คอลเลกชัน characters ยังว่างอยู่ ซึ่งปกติสำหรับเฟส 0</p>
          )}
          {result.state === 'error' && (
            <div className="trace">
              {result.code} — {result.message}
            </div>
          )}
        </section>

        <nav className="gate">
          <Link className="rune-link" to="/status">
            ดูรายละเอียดระบบ
          </Link>
        </nav>
      </div>
    </main>
  )
}
