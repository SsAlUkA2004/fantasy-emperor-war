import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { BANNERS, CHARACTERS, ELEMENTS, FOCUS, RARITIES, ROLES } from '../data/characters'
import { sourcesFor } from '../data/obtain'
import { effectiveRarity } from '../data/ascension'
import { loadCollection } from '../lib/player'
import { entryPower, formatPower } from '../lib/power'
import { explainError } from '../lib/errors'

export default function Collection() {
  const { user, player } = usePlayer()
  const [owned, setOwned] = useState(null)
  const [open, setOpen] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadCollection(user.uid)
      .then(setOwned)
      .catch((e) => setError(explainError('อ่านกระเป๋าตัวละครไม่สำเร็จ', e)))
  }, [user.uid])

  const have = (id) => owned?.find((o) => o.id === id) ?? null
  const total = Object.keys(CHARACTERS).length
  const got = owned?.length ?? 0

  return (
    <main className="screen top">
      <div className="sheet">
        <div className="top-nav">
          <Link className="plain-link inline" to="/">
            ← หน้าหลัก
          </Link>
        </div>

        <div className="roster-head">
          <h1>หอสะสมฮีโร่</h1>
          <Link className="plain-link inline" to="/">
            หน้าหลัก
          </Link>
        </div>

        <p className="meta">
          สะสมแล้ว {got} จาก {total} ตัว
        </p>
        <div className="bar thin wide">
          <span style={{ width: `${Math.round((got / total) * 100)}%` }} />
        </div>

        {error && <div className="trace">{error}</div>}

        {['UR+', 'UR', ...RARITIES.slice().reverse()]
          .map((rarity) => {
            const ids = Object.keys(CHARACTERS).filter((id) => CHARACTERS[id].rarity === rarity)
            const mine = ids.filter((id) => have(id)).length
            return (
              <section key={rarity}>
                <h2 className="section-title">
                  ระดับ {rarity} · {mine}/{ids.length}
                </h2>

                <div className="collect-grid">
                  {ids.map((id) => {
                    const c = CHARACTERS[id]
                    const entry = have(id)
                    return (
                      <button
                        key={id}
                        className="collect-cell"
                        data-owned={Boolean(entry)}
                        data-rarity={rarity}
                        onClick={() => setOpen(open === id ? null : id)}
                      >
                        <span className="collect-mark">
                          {entry ? ELEMENTS[c.element].mark : '❔'}
                        </span>
                        <span className="collect-name">{entry ? c.name : '???'}</span>
                        <span className="meta tiny">
                          {entry ? `เลเวล ${entry.level}` : 'ยังไม่มี'}
                        </span>
                      </button>
                    )
                  })}
                </div>

              </section>
            )
          })}

        {open && (
          <div className="veil" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
            <div onClick={(e) => e.stopPropagation()} className="collect-modal">
              <Detail id={open} entry={have(open)} onClose={() => setOpen(null)} />
            </div>
          </div>
        )}

        <div className="gate">
          <Link className="rune-link" to="/gacha">
            ไปกาชา
          </Link>
          <Link className="rune-link" to="/hunt">
            ดันเจี้ยนรอยอดีต
          </Link>
        </div>
      </div>
    </main>
  )
}

function Detail({ id, entry, onClose }) {
  const c = CHARACTERS[id]
  const sources = sourcesFor(id)

  return (
    <article className="collect-detail">
      <header className="hero-head">
        <span className="hero-mark">{entry ? ELEMENTS[c.element].mark : '❔'}</span>
        <div>
          <h3 className="rank-title-h">{entry ? c.name : '???'}</h3>
          <p className="meta">
            {entry
              ? `${c.epithet} · ธาตุ${ELEMENTS[c.element].name} · ${ROLES[c.role]}`
              : `ระดับ ${c.rarity} · ยังไม่เคยได้ตัวนี้`}
          </p>
        </div>
        <button className="plain-link inline" onClick={onClose}>
          ปิด
        </button>
      </header>

      {entry ? (
        <>
          <p className="meta cp">
            ⚔ {formatPower(entryPower(entry))} · ระดับจริง{' '}
            {effectiveRarity(id, entry.tier)} · {'★'.repeat(entry.star)}
          </p>
          <p className="blurb">{c.blurb}</p>
          <Link className="rune-link block" to={`/hero/${id}`}>
            ดูรายละเอียดเต็ม
          </Link>
        </>
      ) : (
        <>
          <p className="meta">
            {c.focus && FOCUS[c.focus]
              ? `ถนัดสนาม ${FOCUS[c.focus].name}`
              : 'ตัวละครรุ่นแรกของเกม'}
          </p>

          <h4 className="section-title">หาได้จากที่ไหน</h4>
          <ul className="source-list">
            {sources.map((s, i) => (
              <li key={i}>
                {s.to ? <Link to={s.to}>{s.label}</Link> : s.label}
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  )
}
