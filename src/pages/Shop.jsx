import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { MATERIALS, MATERIAL_IDS, SHOP, EMPTY_BAG, BULK_OPTIONS } from '../data/materials'
import { buy } from '../lib/crafting'
import { GEAR_BOXES, GRADES, SLOTS } from '../data/gear'
import { buyBox } from '../lib/gear'

export default function Shop() {
  const { user, player, refresh } = usePlayer()
  const [qty, setQty] = useState(1)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)
  const [box, setBox] = useState(null)

  const bag = { ...EMPTY_BAG, ...(player.materials ?? {}) }

  async function purchase(sku) {
    setBusy(sku.id)
    setError(null)
    setDone(null)
    try {
      const r = await buy({ ...player, uid: user.uid }, sku.id, qty)
      setDone(r)
      await refresh()
    } catch (err) {
      setError(err.message || 'ซื้อไม่สำเร็จ')
    }
    setBusy(null)
  }

  async function openBox(b) {
    setBusy(b.id)
    setError(null)
    setBox(null)
    try {
      setBox(await buyBox({ ...player, uid: user.uid }, b.id))
      await refresh()
    } catch (err) {
      setError(err.message || 'เปิดหีบไม่สำเร็จ')
    }
    setBusy(null)
  }

  return (
    <main className="screen top">
      <div className="sheet">
        <header className="lobby-head">
          <div>
            <h1>ร้านค้า</h1>
            <p className="meta">แลกเพชรเป็นวัสดุ ราคาคงที่ ไม่มีของสุ่ม</p>
          </div>
          <div className="purse-stack">
            <div className="purse">
              <span className="gem">◆</span>
              {player.gems.toLocaleString('th-TH')}
            </div>
            <div className="purse coin">
              <span className="coin-mark">⛁</span>
              {(player.coins ?? 0).toLocaleString('th-TH')}
            </div>
          </div>
        </header>

        <h2 className="section-title">คลังวัสดุ</h2>
        <div className="bag">
          {MATERIAL_IDS.map((id) => (
            <div className="bag-cell" key={id}>
              <span className="bag-mark">{MATERIALS[id].mark}</span>
              <span className="bag-name">{MATERIALS[id].name}</span>
              <strong className="bag-count">{(bag[id] ?? 0).toLocaleString('th-TH')}</strong>
            </div>
          ))}
        </div>

        {error && <div className="trace">{error}</div>}
        {done && (
          <p className="levelup center">
            ได้ {MATERIALS[done.material].name} {done.amount} ชิ้น
          </p>
        )}

        <h2 className="section-title">สินค้า</h2>

        <div className="qty-row">
          <span className="meta">ซื้อครั้งละ</span>
          {BULK_OPTIONS.map((n) => (
            <button
              key={n}
              className="qty-chip"
              data-active={qty === n}
              onClick={() => setQty(n)}
            >
              ×{n}
            </button>
          ))}
        </div>
        {SHOP.map((sku) => {
          const m = MATERIALS[sku.material]
          const total = sku.price * qty
          const poor = player.gems < total
          return (
            <div className="card shop-row" key={sku.id}>
              <span className="card-mark">{m.mark}</span>
              <div className="card-body">
                <h3>
                  {m.name} ×{(sku.amount * qty).toLocaleString('th-TH')}
                </h3>
                <p className="meta">{m.desc}</p>
              </div>
              <button
                className="rune-link"
                disabled={busy === sku.id || poor}
                onClick={() => purchase(sku)}
              >
                ◆ {total.toLocaleString('th-TH')}
              </button>
            </div>
          )
        })}

        <p className="meta tiny">
          วัสดุหาได้ฟรีจากด่านหาของในหน้าแผนที่ ร้านนี้มีไว้สำหรับคนที่อยากเร่ง
        </p>

        <h2 className="section-title">หีบอุปกรณ์</h2>
        <p className="meta">
          ซื้อด้วยเหรียญ ได้อุปกรณ์สุ่มหนึ่งชิ้น ระดับไอเทมตามหีบ ต้องผ่านบทนั้นมาก่อน
        </p>

        {box && (
          <p className="levelup center" style={{ color: GRADES[box.grade].color }}>
            เปิดหีบได้ {SLOTS[box.slot].name}
            {GRADES[box.grade].name} ระดับไอเทม {box.ilvl}
          </p>
        )}

        {GEAR_BOXES.map((b) => {
          const open = (player.stageProgress?.[b.requires] ?? 0) > 0
          const poor = (player.coins ?? 0) < b.price
          return (
            <div className="card shop-row" key={b.id}>
              <span className="card-mark">🎁</span>
              <div className="card-body">
                <h3>{b.name}</h3>
                <p className="meta">
                  {open ? `ระดับไอเทม ${b.ilvl}` : `ผ่านด่าน ${b.requires} เพื่อปลดล็อก`}
                </p>
              </div>
              <button
                className="rune-link"
                disabled={!open || poor || busy === b.id}
                onClick={() => openBox(b)}
              >
                ⛁ {b.price.toLocaleString('th-TH')}
              </button>
            </div>
          )
        })}

        <div className="gate">
          <Link className="rune-link" to="/">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  )
}
