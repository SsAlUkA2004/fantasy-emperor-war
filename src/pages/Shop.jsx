import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { MATERIALS, MATERIAL_IDS, SHOP, EMPTY_BAG } from '../data/materials'
import { buy } from '../lib/crafting'

export default function Shop() {
  const { user, player, refresh } = usePlayer()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)

  const bag = { ...EMPTY_BAG, ...(player.materials ?? {}) }

  async function purchase(sku) {
    setBusy(sku.id)
    setError(null)
    setDone(null)
    try {
      const r = await buy({ ...player, uid: user.uid }, sku.id)
      setDone(r)
      await refresh()
    } catch (err) {
      setError(err.message || 'ซื้อไม่สำเร็จ')
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
          <div className="purse">
            <span className="gem">◆</span>
            {player.gems.toLocaleString('th-TH')}
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
        {SHOP.map((sku) => {
          const m = MATERIALS[sku.material]
          const poor = player.gems < sku.price
          return (
            <div className="card shop-row" key={sku.id}>
              <span className="card-mark">{m.mark}</span>
              <div className="card-body">
                <h3>
                  {m.name} ×{sku.amount}
                </h3>
                <p className="meta">{m.desc}</p>
              </div>
              <button
                className="rune-link"
                disabled={busy === sku.id || poor}
                onClick={() => purchase(sku)}
              >
                ◆ {sku.price}
              </button>
            </div>
          )
        })}

        <p className="meta tiny">
          วัสดุหาได้ฟรีจากด่านหาของในหน้าแผนที่ ร้านนี้มีไว้สำหรับคนที่อยากเร่ง
        </p>

        <div className="gate">
          <Link className="rune-link" to="/">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  )
}
