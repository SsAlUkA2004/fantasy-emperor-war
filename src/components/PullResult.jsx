import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CHARACTERS, ELEMENTS, ROLES } from '../data/characters'

const RARITY_ORDER = { 'UR+': 0, UR: 1, SSR: 2, SR: 3, R: 4 }

// ห้าคอลัมน์คูณสองแถวพอดีหนึ่งหน้า เกินนี้ (มีแค่ตู้ UR สุ่มห้าสิบทีเดียว) ถึงจะขึ้นหน้าถัดไป
const PAGE_SIZE = 10

function titleFor(best) {
  if (best === 'UR+') return 'ได้ตัวระดับสูงสุดขั้นเทพ'
  if (best === 'UR') return 'ได้ตัวระดับสูงสุด'
  if (best === 'SSR') return 'ได้ตัวระดับตำนาน'
  if (best === 'SR') return 'ได้ตัวหายาก'
  return 'ผลการอัญเชิญ'
}

/**
 * ป๊อปอัพผลการสุ่ม ใช้ร่วมกันทั้งสามตู้ (เริ่มต้น/ทัพหน้า, ธาตุหมุนเวียน, UR)
 *
 * เดิมแต่ละตู้มีฟังก์ชันนี้แยกกันเกือบเหมือนกันทุกตัวอักษร ต่างแค่ราคาสุ่มซ้ำกับหัวข้อ
 * (ตู้ UR มีระดับ UR เพิ่มมาอีกขั้น) พอจะเพิ่มแบ่งหน้ารวมเป็นที่เดียวจะได้แก้ทีเดียวครบทั้งสามตู้
 *
 * ไม่เรียงของหายากไว้ก่อนอีกต่อไป (เดิมเรียง SSR ขึ้นก่อนเสมอ) เพราะผู้เล่นอยากเห็นว่ารอบนั้น
 * สุ่มได้อะไรตามลำดับจริงที่สุ่มออกมา ไม่ใช่สลับที่ตามความหายาก ส่วนหัวข้อกับสีกรอบยังบอก
 * ของดีที่สุดที่ได้เหมือนเดิม (คำนวณจากค่าดิบ ไม่ต้องพึ่งลำดับที่เรียงแล้ว)
 *
 * เกินสิบตัว (มีแค่ตู้ UR สุ่มห้าสิบทีเดียว) แบ่งเป็นหน้าละสิบตัวแทนที่จะดันเป็นแถวยาวให้เลื่อนดู
 * เพราะห้าสิบใบในหน้าเดียวยาวเกินจะไล่ดูสะดวก พร้อมลูกศรซ้ายขวาเปลี่ยนหน้า
 */
export default function PullResult({ results, count, again, gems, busy, onAgain, onClose }) {
  const [page, setPage] = useState(0)

  // ผลใหม่ทุกครั้งที่กดสุ่มอีก ต้องกลับไปหน้าแรกเสมอ ไม่งั้นถ้าผลใหม่มีน้อยกว่าหน้าที่ค้างไว้
  // จะเห็นหน้าว่างเปล่า
  useEffect(() => {
    setPage(0)
  }, [results])

  const best = results.reduce(
    (b, r) => (RARITY_ORDER[r.rarity] < RARITY_ORDER[b] ? r.rarity : b),
    'R'
  )
  const tally = results.reduce((acc, r) => {
    acc[r.rarity] = (acc[r.rarity] ?? 0) + 1
    return acc
  }, {})

  const pageCount = Math.ceil(results.length / PAGE_SIZE)
  const shown = results.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="veil" role="dialog" aria-modal="true">
      <section className="panel popup pull-popup" data-best={best}>
        <div className="panel-head">{titleFor(best)}</div>

        <p className="meta tally">
          {['UR+', 'UR', 'SSR', 'SR', 'R']
            .filter((r) => tally[r])
            .map((r) => `${r} ${tally[r]} ตัว`)
            .join(' · ')}
        </p>

        <div className="pull-grid">
          {shown.map((r, i) => {
            const c = CHARACTERS[r.id]
            return (
              <Link
                className="pull-card reveal"
                to={`/hero/${r.id}`}
                data-rarity={r.rarity}
                style={{ animationDelay: `${i * 90}ms` }}
                key={page * PAGE_SIZE + i}
              >
                <span className="pull-mark">{ELEMENTS[c.element].mark}</span>
                <span className="pull-name">{c.name}</span>
                <span className="pull-role">{ROLES[c.role]}</span>
                <span className="pull-tag">
                  {r.isNew ? 'ตัวใหม่' : `ซ้ำ +${r.shards} ชิ้นส่วน`}
                </span>
              </Link>
            )
          })}
        </div>

        {pageCount > 1 && (
          <div className="pull-pager">
            <button
              className="plain-link inline"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              ← ก่อนหน้า
            </button>
            <span className="meta tiny">
              หน้า {page + 1} / {pageCount}
            </span>
            <button
              className="plain-link inline"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              ถัดไป →
            </button>
          </div>
        )}

        <p className="meta tiny">แตะการ์ดเพื่อดูรายละเอียดตัวละคร</p>

        <button className="rune-link block primary" onClick={onAgain} disabled={busy || gems < again}>
          {gems < again ? 'เพชรไม่พอสุ่มอีก' : `สุ่มอีก ${count} ครั้ง · ${again}`}
        </button>
        <button className="plain-link" onClick={onClose}>
          ปิด
        </button>
      </section>
    </div>
  )
}
