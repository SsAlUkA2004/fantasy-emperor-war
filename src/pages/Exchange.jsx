import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { CHARACTERS, ELEMENTS, RARITIES, ROLES } from '../data/characters'
import { EMPTY_POOL, EXCHANGE_COST, DUPES_PER_UNIT, POOL_MARKS, POOL_NAMES } from '../data/exchange'
import { loadCollection } from '../lib/player'
import { convertShards, exchangeFor, missingByRarity } from '../lib/exchange'

export default function Exchange() {
  const { user, player, refresh } = usePlayer()
  const [owned, setOwned] = useState(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [won, setWon] = useState(null)
  const [converted, setConverted] = useState(null)

  useEffect(() => {
    loadCollection(user.uid).then(setOwned)
  }, [user.uid])

  const pool = { ...EMPTY_POOL, ...(player.shardPool ?? {}) }
  const missing = owned ? missingByRarity(owned) : null

  async function convert(entry) {
    setBusy(`c${entry.id}`)
    setError(null)
    setWon(null)
    try {
      const r = await convertShards({ ...player, uid: user.uid }, entry, entry.shards)
      setConverted(r)
      setOwned(await loadCollection(user.uid, { fresh: true }))
      await refresh()
    } catch (err) {
      setError(err.message || 'แปลงไม่สำเร็จ')
    }
    setBusy(null)
  }

  async function claim(charId) {
    setBusy(charId)
    setError(null)
    setWon(null)
    try {
      const r = await exchangeFor({ ...player, uid: user.uid }, charId, owned)
      setWon(r)
      setOwned(await loadCollection(user.uid))
      await refresh()
    } catch (err) {
      setError(err.message || 'แลกไม่สำเร็จ')
    }
    setBusy(null)
  }

  return (
    <main className="screen top">
      <div className="sheet">
        <div className="top-nav">
          <Link className="plain-link inline" to="/">
            ← หน้าหลัก
          </Link>
        </div>

        <h1>หอแลกเปลี่ยน</h1>
        <p className="meta">
          ตัวซ้ำจากกาชาให้เศษวิญญาณตามระดับหายาก สะสมครบเท่ากับตัวซ้ำ {DUPES_PER_UNIT} ตัว
          แลกตัวที่ยังไม่มีได้หนึ่งตัว
        </p>

        <div className="bag">
          {RARITIES.map((r) => (
            <div className="bag-cell" key={r}>
              <span className="bag-mark">{POOL_MARKS[r]}</span>
              <span className="bag-name">{POOL_NAMES[r]}</span>
              <strong className="bag-count">{(pool[r] ?? 0).toLocaleString('th-TH')}</strong>
              <span className="meta tiny">แลกละ {EXCHANGE_COST[r]}</span>
            </div>
          ))}
        </div>

        {error && <div className="trace">{error}</div>}
        {converted && (
          <p className="levelup center">
            ได้{POOL_NAMES[converted.rarity]} {converted.amount} ชิ้น
          </p>
        )}
        {won && (
          <p className="levelup center">
            ได้ {CHARACTERS[won.charId].name} มาร่วมทีมแล้ว
          </p>
        )}

        {owned === null && <p className="meta">กำลังเปิดกระเป๋า</p>}

        <h2 className="section-title">แปลงชิ้นส่วนที่ค้างอยู่</h2>
        <p className="meta">
          ชิ้นส่วนที่ติดมากับตัวซ้ำใช้ได้แค่หลอมดาวตัวนั้น พอครบห้าดาวแล้วก็กองอยู่เฉย ๆ
          แปลงเป็นเศษวิญญาณแล้วเอาไปแลกตัวที่ยังไม่มีได้ในอัตราหนึ่งต่อหนึ่ง
        </p>

        {owned?.filter((o) => (o.shards ?? 0) > 0).length === 0 && (
          <p className="meta">ยังไม่มีชิ้นส่วนค้างอยู่</p>
        )}

        {owned
          ?.filter((o) => (o.shards ?? 0) > 0)
          .sort((a, b) => b.shards - a.shards)
          .map((o) => {
            const c = CHARACTERS[o.id]
            if (!c) return null
            return (
              <div className="card shop-row" key={o.id}>
                <span className="card-mark">{ELEMENTS[c.element].mark}</span>
                <div className="card-body">
                  <h3>
                    {c.name}
                    <span className="rarity" data-rarity={c.rarity}>
                      {c.rarity}
                    </span>
                  </h3>
                  <p className="meta">
                    มีชิ้นส่วน {o.shards} · {'★'.repeat(o.star)} เลเวล {o.level}
                  </p>
                </div>
                <button
                  className="rune-link"
                  disabled={busy === `c${o.id}`}
                  onClick={() => convert(o)}
                >
                  แปลงทั้งหมด
                </button>
              </div>
            )
          })}

        {missing &&
          RARITIES.map((r) => (
            <section key={r}>
              <h2 className="section-title">
                ระดับ {r} · ยังไม่มี {missing[r].length} ตัว
              </h2>

              {missing[r].length === 0 ? (
                <p className="meta">มีครบทุกตัวในระดับนี้แล้ว</p>
              ) : (
                missing[r].map((id) => {
                  const c = CHARACTERS[id]
                  const poor = (pool[r] ?? 0) < EXCHANGE_COST[r]
                  return (
                    <div className="card shop-row" key={id}>
                      <span className="card-mark">{ELEMENTS[c.element].mark}</span>
                      <div className="card-body">
                        <h3>
                          {c.name}
                          <span className="rarity">{c.rarity}</span>
                        </h3>
                        <p className="meta">
                          {ROLES[c.role]} · ธาตุ{ELEMENTS[c.element].name}
                        </p>
                        <p className="meta tiny">{c.blurb}</p>
                      </div>
                      <button
                        className="rune-link"
                        disabled={busy === id || poor}
                        onClick={() => claim(id)}
                      >
                        {POOL_MARKS[r]} {EXCHANGE_COST[r]}
                      </button>
                    </div>
                  )
                })
              )}
            </section>
          ))}

        <div className="gate">
          <Link className="rune-link" to="/gacha">
            ไปกาชา
          </Link>
        </div>
      </div>
    </main>
  )
}
