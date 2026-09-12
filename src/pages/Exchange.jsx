import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { CHARACTERS, ELEMENTS, RARITIES, ROLES } from '../data/characters'
import { EMPTY_POOL, EXCHANGE_COST, DUPES_PER_UNIT, POOL_MARKS, POOL_NAMES } from '../data/exchange'
import { loadCollection } from '../lib/player'
import { exchangeFor, missingByRarity } from '../lib/exchange'

export default function Exchange() {
  const { user, player, refresh } = usePlayer()
  const [owned, setOwned] = useState(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [won, setWon] = useState(null)

  useEffect(() => {
    loadCollection(user.uid).then(setOwned)
  }, [user.uid])

  const pool = { ...EMPTY_POOL, ...(player.shardPool ?? {}) }
  const missing = owned ? missingByRarity(owned) : null

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
        {won && (
          <p className="levelup center">
            ได้ {CHARACTERS[won.charId].name} มาร่วมทีมแล้ว
          </p>
        )}

        {owned === null && <p className="meta">กำลังเปิดกระเป๋า</p>}

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
          <Link className="rune-link" to="/">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  )
}
