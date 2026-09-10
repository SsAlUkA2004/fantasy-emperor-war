import { Link } from 'react-router-dom'
import { firebaseConfig, isConfigured } from '../firebaseConfig'

export default function Status() {
  const rows = [
    ['เส้นทางหน้าเว็บ', window.location.hash || '#/'],
    ['base path ที่ build ไว้', import.meta.env.BASE_URL],
    ['โหมด', import.meta.env.MODE],
    ['ค่า Firebase', isConfigured ? 'ครบแล้ว' : 'ยังไม่ได้กรอก'],
    ['projectId', isConfigured ? firebaseConfig.projectId : '—'],
  ]

  return (
    <main className="screen">
      <div className="sheet">
        <h1>รายละเอียดระบบ</h1>
        <p>หน้านี้มีไว้ยืนยันว่า build และการเปลี่ยนหน้าทำงานถูกต้องบน GitHub Pages</p>

        <dl className="ledger">
          {rows.map(([label, value]) => (
            <div className="ledger-row" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="gate">
          <Link className="rune-link" to="/">
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    </main>
  )
}
