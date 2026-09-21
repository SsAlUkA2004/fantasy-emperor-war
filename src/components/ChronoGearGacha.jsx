import { useState } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import { GRADES, SLOTS, gearName } from '../data/gear'
import { CHRONOGEAR_NAME, CHRONOGEAR_RATES, CHRONOGEAR_GRADE_IDS } from '../data/chronogear'
import { CHRONOGEAR_PULL_COST, CHRONOGEAR_TEN_PULL_COST, CHRONOGEAR_HARD_PITY, pullChronoGear } from '../lib/chronogear'

function costFor(count) {
  return count === 10 ? CHRONOGEAR_TEN_PULL_COST : CHRONOGEAR_PULL_COST
}

/** เรียงผลตามความหายาก มากไปน้อย ไว้โชว์ของดีที่สุดในชุดก่อนเสมอ */
const GRADE_ORDER = Object.fromEntries(CHRONOGEAR_GRADE_IDS.map((g, i) => [g, i]))

/**
 * การ์ดตู้อุปกรณ์โคลโน — ตู้กาชาอุปกรณ์ตู้แรกของเกม (แยกจากตู้ตัวละครทั้งหมด)
 *
 * สุ่มได้แค่สี่เกรดบนสุด (ตำนาน/เทพ/อมตะ/เทพนิยาย) การันตีเทพนิยายที่ 60 ครั้ง
 * ผลการสุ่มไม่ใช้ PullResult.jsx ร่วมกับตัวละคร เพราะรูปร่างข้อมูลคนละแบบ
 * (ของมีช่อง/เกรด/ค่ารอง ไม่มีชื่อ/ธาตุ/บทบาทแบบตัวละคร) จึงมีป๊อปอัพผลลัพธ์ของตัวเอง
 */
export default function ChronoGearGacha() {
  const { user, player, refresh } = usePlayer()
  const [results, setResults] = useState(null)
  const [lastCount, setLastCount] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const sinceBlack = player.chronoGearPitySinceBlack ?? 0

  async function roll(count) {
    const cost = costFor(count)
    if (player.gems < cost) {
      setError('เพชรไม่พอ ไปเก็บจากด่านที่ยังไม่เคยผ่านก่อน')
      return
    }

    setBusy(true)
    setError(null)
    setResults(null)
    setLastCount(count)
    try {
      const r = await pullChronoGear({ ...player, uid: user.uid }, count)
      setResults([...r.items].sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade]))
      await refresh()
    } catch (err) {
      setError(err.message === 'เพชรไม่พอ' ? err.message : explainError('สุ่มไม่สำเร็จ', err))
    }
    setBusy(false)
  }

  const best = results?.[0]?.grade

  return (
    <div className="sheet">
      <header className="lobby-head">
        <div>
          <h1>🖤 {CHRONOGEAR_NAME}</h1>
          <p className="meta">
            โอกาสออกในตู้นี้ ·{' '}
            {CHRONOGEAR_GRADE_IDS.map((g) => `${GRADES[g].name} ${CHRONOGEAR_RATES[g] * 100}%`).join(' · ')}
          </p>
        </div>
        <div className="purse">
          <span className="gem">◆</span>
          {player.gems.toLocaleString('th-TH')}
        </div>
      </header>

      <p className="meta">
        ตู้แรกของเกมที่สุ่มอุปกรณ์แทนตัวละคร ระดับไอเทมเต็ม 5 ทุกชิ้นเสมอ สุ่มได้เฉพาะสี่เกรดบนสุด
        (ตำนาน/เทพ/อมตะ/เทพนิยาย) ไม่มีทางออกของเกรดต่ำกว่านั้นจากตู้นี้เลย
      </p>
      <p className="meta tiny">
        เทพนิยายคือเกรดสูงสุดใหม่ของเกม แรงกว่าอมตะทุกด้านและติดค่ารองสี่ช่องแทนที่จะเป็นสาม
        (พลังสกิลของเทพนิยายก็แรงกว่าอมตะตามสัดส่วนเดียวกัน)
      </p>

      <section className="pity">
        <div className="pity-row">
          <span className="meta">
            อีก {Math.max(0, CHRONOGEAR_HARD_PITY - sinceBlack)} ครั้งได้เทพนิยายการันตีแน่นอน
          </span>
          <div className="bar thin wide">
            <span style={{ width: `${(sinceBlack / CHRONOGEAR_HARD_PITY) * 100}%` }} />
          </div>
        </div>
      </section>

      {error && <div className="trace">{error}</div>}

      <div className="pull-row">
        <button className="rune-link" disabled={busy} onClick={() => roll(1)}>
          สุ่ม 1 ครั้ง · {CHRONOGEAR_PULL_COST}
        </button>
        <button className="rune-link" disabled={busy} onClick={() => roll(10)}>
          สุ่ม 10 ครั้ง · {CHRONOGEAR_TEN_PULL_COST}
        </button>
      </div>
      <p className="meta tiny center">สุ่มสิบครั้งถูกกว่าสุ่มทีละครั้งอยู่ 500 เพชร</p>

      {busy && <p className="meta center">กำลังหลอมของ</p>}

      {results && (
        <div className="veil" role="dialog" aria-modal="true">
          <section className="panel popup pull-popup">
            <div className="panel-head" style={{ color: GRADES[best]?.color }}>
              {best === 'black' ? 'ได้ของเกรดสูงสุดขั้นเทพนิยาย' : `ได้ของเกรด ${GRADES[best]?.name ?? ''}`}
            </div>

            <div className="pull-grid">
              {results.map((g, i) => (
                <span
                  key={g.id}
                  className="pull-card reveal"
                  style={{ animationDelay: `${i * 90}ms`, borderColor: GRADES[g.grade].color }}
                >
                  <span className="pull-mark">{SLOTS[g.slot].mark}</span>
                  <span className="pull-name" style={{ color: GRADES[g.grade].color }}>
                    {gearName(g)}
                  </span>
                  <span className="pull-role">ระดับไอเทม {g.ilvl}</span>
                  <span className="pull-tag">{g.substats.length ? `ค่ารอง ${g.substats.length} ช่อง` : 'ไม่มีค่ารอง'}</span>
                </span>
              ))}
            </div>

            <p className="meta tiny">แตะเมนูคลังอุปกรณ์เพื่อดูรายละเอียดและสวมใส่</p>

            <button
              className="rune-link block primary"
              onClick={() => roll(lastCount)}
              disabled={busy || player.gems < costFor(lastCount)}
            >
              {player.gems < costFor(lastCount) ? 'เพชรไม่พอสุ่มอีก' : `สุ่มอีก ${lastCount} ครั้ง · ${costFor(lastCount)}`}
            </button>
            <button className="plain-link" onClick={() => setResults(null)}>
              ปิด
            </button>
          </section>
        </div>
      )}
    </div>
  )
}
