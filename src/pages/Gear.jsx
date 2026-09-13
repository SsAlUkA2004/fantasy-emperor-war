import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import { CHARACTERS, ELEMENTS } from '../data/characters'
import { GRADES, SLOTS, SLOT_IDS, enhanceCost, gearStat, maxPlus } from '../data/gear'
import { loadCollection } from '../lib/player'
import { enhance, equip, equipBest, loadGear, sell, sellAll, unequip } from '../lib/gear'
import { entryPower, formatPower } from '../lib/power'

export default function Gear() {
  const { user, player, refresh } = usePlayer()
  const [params, setParams] = useSearchParams()

  const [gear, setGear] = useState(null)
  const [roster, setRoster] = useState(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  const who = params.get('char') ?? null

  async function reload() {
    const [g, r] = await Promise.all([loadGear(user.uid), loadCollection(user.uid)])
    setGear(g)
    setRoster(r)
  }

  useEffect(() => {
    reload().catch((e) => setError(explainError('อ่านอุปกรณ์ไม่สำเร็จ', e)))
  }, [user.uid])

  const cap = maxPlus(player.playerLevel ?? 1)
  const target = roster?.find((c) => c.id === who) ?? null
  const wearing = gear?.filter((g) => g.equippedBy === who) ?? []

  const shown = (gear ?? [])
    .filter((g) => (filter === 'all' ? true : g.slot === filter))
    .sort(
      (a, b) =>
        GRADES[b.grade].order - GRADES[a.grade].order || (b.ilvl ?? 1) - (a.ilvl ?? 1)
    )

  async function run(label, fn) {
    setBusy(label)
    setError(null)
    try {
      await fn()
      await reload()
      await refresh()
    } catch (err) {
      setError(err.message || 'ทำไม่สำเร็จ')
    }
    setBusy(null)
  }

  return (
    <main className="screen top">
      <div className="sheet">
        <header className="lobby-head">
          <div>
            <h1>อุปกรณ์</h1>
            <p className="meta">มีทั้งหมด {gear?.length ?? 0} ชิ้น</p>
          </div>
          <div className="purse-stack">
            <div className="purse coin">
              <span className="coin-mark">⛁</span>
              {(player.coins ?? 0).toLocaleString('th-TH')}
            </div>
            <span className="meta tiny">ตีบวกได้ถึง +{cap}</span>
          </div>
        </header>

        {error && <div className="trace">{error}</div>}

        <h2 className="section-title">สวมให้ใคร</h2>
        <div className="wear-picker">
          {roster?.map((c) => {
            const ch = CHARACTERS[c.id]
            if (!ch) return null
            return (
              <button
                key={c.id}
                className="pick"
                data-active={who === c.id}
                onClick={() => setParams(who === c.id ? {} : { char: c.id })}
              >
                <span className="pick-mark">{ELEMENTS[ch.element].mark}</span>
                <span className="pick-name">{ch.name}</span>
                <span className="pick-role">⚔ {formatPower(entryPower(c))}</span>
              </button>
            )
          })}
        </div>

        {target && (
          <>
            <div className="roster-head">
              <h2 className="section-title flush">ช่องสวมใส่ของ {CHARACTERS[target.id].name}</h2>
              <button
                className="plain-link inline"
                disabled={busy === 'best'}
                onClick={() => run('best', () => equipBest(user.uid, who, gear ?? []))}
              >
                สวมของที่ดีที่สุด
              </button>
            </div>
            <p className="meta tiny">ไม่แย่งของที่ตัวอื่นใส่อยู่</p>
            <div className="slot-grid">
              {SLOT_IDS.map((sid) => {
                const worn = wearing.find((g) => g.slot === sid)
                return (
                  <div className="gear-slot" key={sid} data-filled={Boolean(worn)}>
                    <span className="gear-slot-mark">{SLOTS[sid].mark}</span>
                    <span className="meta tiny">{SLOTS[sid].name}</span>
                    {worn ? (
                      <>
                        <span
                          className="gear-grade"
                          style={{ color: GRADES[worn.grade].color }}
                        >
                          {GRADES[worn.grade].name}
                          {worn.plus > 0 && ` +${worn.plus}`}
                        </span>
                        <span className="meta tiny">
                          +{gearStat(worn)} {SLOTS[sid].stat}
                        </span>
                        <button
                          className="plain-link inline"
                          disabled={busy === worn.id}
                          onClick={() => run(worn.id, () => unequip(user.uid, worn.id))}
                        >
                          ถอด
                        </button>
                      </>
                    ) : (
                      <span className="meta tiny">ว่าง</span>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="roster-head">
          <h2 className="section-title flush">คลังอุปกรณ์</h2>
          <button
            className="plain-link inline"
            disabled={busy === 'sellall'}
            onClick={() =>
              run('sellall', () => sellAll({ ...player, uid: user.uid }, gear ?? []))
            }
          >
            ขายที่ไม่ได้ใส่ทั้งหมด
          </button>
        </div>

        <div className="qty-row">
          <button className="qty-chip" data-active={filter === 'all'} onClick={() => setFilter('all')}>
            ทั้งหมด
          </button>
          {SLOT_IDS.map((sid) => (
            <button
              key={sid}
              className="qty-chip"
              data-active={filter === sid}
              onClick={() => setFilter(sid)}
            >
              {SLOTS[sid].mark}
            </button>
          ))}
        </div>

        {gear === null && <p className="meta">กำลังเปิดคลัง</p>}
        {gear?.length === 0 && <p className="meta">ยังไม่มีอุปกรณ์ ลองไปผ่านด่านดู</p>}

        <div className="gear-list">
          {shown.map((g) => {
            const owner = g.equippedBy ? CHARACTERS[g.equippedBy] : null
            return (
              <div className="gear-row" key={g.id} data-worn={Boolean(g.equippedBy)}>
                <span className="gear-mark">{SLOTS[g.slot].mark}</span>
                <div className="gear-body">
                  <h3 style={{ color: GRADES[g.grade].color }}>
                    {SLOTS[g.slot].name}
                    {GRADES[g.grade].name}
                    {g.plus > 0 && ` +${g.plus}`}
                  </h3>
                  <p className="meta">
                    +{gearStat(g)} {SLOTS[g.slot].stat} · ระดับไอเทม {g.ilvl}
                  </p>
                  {owner && <p className="meta cp">สวมอยู่กับ {owner.name}</p>}
                </div>
                <div className="card-actions">
                  <button
                    className="plain-link inline"
                    disabled={
                      busy === g.id ||
                      (g.plus ?? 0) >= cap ||
                      (player.coins ?? 0) < enhanceCost(g)
                    }
                    onClick={() => run(g.id, () => enhance({ ...player, uid: user.uid }, g))}
                  >
                    {(g.plus ?? 0) >= cap
                      ? `สุด +${cap}`
                      : `+1 · ⛁${enhanceCost(g).toLocaleString('th-TH')}`}
                  </button>
                  {who && !g.equippedBy && (
                    <button
                      className="plain-link inline"
                      disabled={busy === g.id}
                      onClick={() => run(g.id, () => equip(user.uid, g, who, gear))}
                    >
                      สวม
                    </button>
                  )}
                  {g.equippedBy ? (
                    <button
                      className="plain-link inline"
                      disabled={busy === g.id}
                      onClick={() => run(g.id, () => unequip(user.uid, g.id))}
                    >
                      ถอด
                    </button>
                  ) : (
                    <button
                      className="plain-link inline"
                      disabled={busy === g.id}
                      onClick={() => run(g.id, () => sell({ ...player, uid: user.uid }, g))}
                    >
                      ขาย ⛁{GRADES[g.grade].sell}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="gate">
          <Link className="rune-link" to="/">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  )
}
