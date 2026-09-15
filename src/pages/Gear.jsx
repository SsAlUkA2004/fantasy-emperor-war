import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import { CHARACTERS, ELEMENTS } from '../data/characters'
import {
  GRADES,
  GRADE_IDS,
  SLOTS,
  SLOT_IDS,
  enhanceCost,
  gearStat,
  gearSubstatLines,
  maxPlus,
} from '../data/gear'
import { loadCollection } from '../lib/player'
import {
  enhance,
  enhanceCostFor,
  equip,
  equipBest,
  loadGear,
  sell,
  sellAll,
  toggleLock,
  unequip,
  unequipAll,
} from '../lib/gear'
import { entryPower, formatPower } from '../lib/power'

export default function Gear() {
  const { user, player, refresh } = usePlayer()
  const [params, setParams] = useSearchParams()

  const [gear, setGear] = useState(null)
  const [roster, setRoster] = useState(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sellGrades, setSellGrades] = useState([])
  const [sort, setSort] = useState('value')
  const [bulk, setBulk] = useState(1)
  const [hideWorn, setHideWorn] = useState(false)

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
  const sellCount = (gear ?? []).filter(
    (g) => !g.equippedBy && !g.locked && sellGrades.includes(g.grade)
  ).length
  const target = roster?.find((c) => c.id === who) ?? null
  const wearing = gear?.filter((g) => g.equippedBy === who) ?? []

  // ของที่ตัวละครที่เลือกใส่อยู่ ขึ้นก่อนเสมอไม่ว่าจะเรียงแบบไหน
  // เพราะพอของเยอะ สิ่งที่อยากรู้ที่สุดคือชิ้นไหนใส่อยู่
  const order = {
    value: (a, b) => gearStat(b) - gearStat(a),
    grade: (a, b) =>
      GRADES[b.grade].order - GRADES[a.grade].order || (b.ilvl ?? 1) - (a.ilvl ?? 1),
    slot: (a, b) => SLOT_IDS.indexOf(a.slot) - SLOT_IDS.indexOf(b.slot) || gearStat(b) - gearStat(a),
  }

  const shown = (gear ?? [])
    .filter((g) => (filter === 'all' ? true : g.slot === filter))
    .filter((g) => !hideWorn || !g.equippedBy)
    .sort((a, b) => {
      const aMine = a.equippedBy === who ? 1 : 0
      const bMine = b.equippedBy === who ? 1 : 0
      if (aMine !== bMine) return bMine - aMine
      return (order[sort] ?? order.value)(a, b)
    })

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
        <div className="top-nav">
          <Link className="plain-link inline" to="/">
            ← หน้าหลัก
          </Link>
          <Link className="plain-link inline" to="/team">
            จัดทีม
          </Link>
        </div>

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
              <div className="head-actions">
                <button
                  className="plain-link inline"
                  disabled={busy === 'best'}
                  onClick={() => run('best', () => equipBest(user.uid, who, gear ?? []))}
                >
                  สวมของที่ดีที่สุด
                </button>
                <button
                  className="plain-link inline"
                  disabled={busy === 'off' || !wearing.length}
                  onClick={() => run('off', () => unequipAll(user.uid, who, gear ?? []))}
                >
                  ถอดทั้งหมด
                </button>
              </div>
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
                        {gearSubstatLines(worn).map((s) => (
                          <span className="meta tiny substat" key={s.key}>
                            +{s.value}
                            {s.isPercent ? '%' : ''} {s.label}
                          </span>
                        ))}
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
            disabled={busy === 'sellall' || !sellGrades.length}
            onClick={() =>
              run('sellall', () =>
                sellAll({ ...player, uid: user.uid }, gear ?? [], sellGrades)
              )
            }
          >
            {sellGrades.length ? `ขายสีที่เลือก (${sellCount})` : 'เลือกสีที่จะขาย'}
          </button>
        </div>

        <div className="qty-row sell-row">
          {GRADE_IDS.map((g) => {
            const n = (gear ?? []).filter(
              (x) => x.grade === g && !x.equippedBy && !x.locked
            ).length
            return (
              <button
                key={g}
                className="qty-chip"
                data-active={sellGrades.includes(g)}
                style={{ color: sellGrades.includes(g) ? GRADES[g].color : undefined }}
                onClick={() =>
                  setSellGrades((v) =>
                    v.includes(g) ? v.filter((x) => x !== g) : [...v, g]
                  )
                }
              >
                {GRADES[g].name} {n}
              </button>
            )
          })}
        </div>
        <p className="meta tiny">ของที่สวมอยู่และของที่ล็อกไว้จะถูกข้ามเสมอ</p>

        <div className="sticky-bar">
          <div className="qty-row">
            <button
              className="qty-chip"
              data-active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
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

          <div className="qty-row">
            <span className="meta tiny">เรียงตาม</span>
            {[
              ['value', 'ค่าที่ให้'],
              ['grade', 'ระดับสี'],
              ['slot', 'ช่อง'],
            ].map(([k, label]) => (
              <button
                key={k}
                className="qty-chip"
                data-active={sort === k}
                onClick={() => setSort(k)}
              >
                {label}
              </button>
            ))}
            <button
              className="qty-chip"
              data-active={hideWorn}
              onClick={() => setHideWorn((v) => !v)}
            >
              ซ่อนของที่สวมอยู่
            </button>
            <span className="meta tiny count-note">แสดง {shown.length} ชิ้น</span>
          </div>

          <div className="qty-row">
            <span className="meta tiny">ตีบวกครั้งละ</span>
            {[1, 5, 10].map((n) => (
              <button
                key={n}
                className="qty-chip"
                data-active={bulk === n}
                onClick={() => setBulk(n)}
              >
                +{n}
              </button>
            ))}
          </div>
        </div>

        {gear === null && <p className="meta">กำลังเปิดคลัง</p>}
        {gear?.length === 0 && <p className="meta">ยังไม่มีอุปกรณ์ ลองไปผ่านด่านดู</p>}

        <div className="gear-list">
          {shown.map((g) => {
            const owner = g.equippedBy ? CHARACTERS[g.equippedBy] : null
            return (
              <div
              className="gear-row"
              key={g.id}
              data-worn={Boolean(g.equippedBy)}
              data-mine={g.equippedBy === who}
            >
                <span className="gear-mark">{SLOTS[g.slot].mark}</span>
                <div className="gear-body">
                  <h3 style={{ color: GRADES[g.grade].color }}>
                    {g.locked && '🔒 '}
                    {SLOTS[g.slot].name}
                    {GRADES[g.grade].name}
                    {g.plus > 0 && ` +${g.plus}`}
                  </h3>
                  <p className="meta">
                    +{gearStat(g)} {SLOTS[g.slot].stat} · ระดับไอเทม {g.ilvl}
                  </p>
                  {gearSubstatLines(g).length > 0 && (
                    <p className="meta tiny substat">
                      {gearSubstatLines(g)
                        .map((s) => `+${s.value}${s.isPercent ? '%' : ''} ${s.label}`)
                        .join(' · ')}
                    </p>
                  )}
                  {owner && <p className="meta cp">สวมอยู่กับ {owner.name}</p>}
                </div>
                <div className="card-actions">
                  <button
                    className="plain-link inline lock-btn"
                    data-on={Boolean(g.locked)}
                    disabled={busy === g.id}
                    onClick={() => run(g.id, () => toggleLock(user.uid, g))}
                  >
                    {g.locked ? '🔒 ล็อกอยู่' : '🔓 ล็อก'}
                  </button>
                  <EnhanceButton
                    gear={g}
                    cap={cap}
                    bulk={bulk}
                    coins={player.coins ?? 0}
                    busy={busy === g.id}
                    onRun={(times) =>
                      run(g.id, () => enhance({ ...player, uid: user.uid }, g, times))
                    }
                  />
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
                      disabled={busy === g.id || g.locked}
                      onClick={() => run(g.id, () => sell({ ...player, uid: user.uid }, g))}
                    >
                      {g.locked ? 'ล็อกอยู่' : `ขาย ⛁${GRADES[g.grade].sell}`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="gate">
          <button
            className="rune-link"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ↑ กลับขึ้นบน
          </button>
        </div>
      </div>

      <button
        className="to-top"
        aria-label="กลับขึ้นบน"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>
    </main>
  )
}

/**
 * ปุ่มตีบวก แสดงค่าใช้จ่ายรวมของจำนวนขั้นที่เลือก
 *
 * ถ้าเหรียญไม่พอครบจำนวน จะลดจำนวนขั้นลงให้เท่าที่จ่ายไหว
 * แทนที่จะปิดปุ่มไปเลย เพราะตีได้สามขั้นก็ยังดีกว่าไม่ได้เลย
 */
function EnhanceButton({ gear, cap, bulk, coins, busy, onRun }) {
  const now = gear.plus ?? 0
  if (now >= cap) {
    return <span className="meta tiny">สุด +{cap}</span>
  }

  const wanted = enhanceCostFor(gear, bulk, cap)
  let times = wanted.steps
  let cost = wanted.total
  while (times > 1 && cost > coins) {
    times -= 1
    cost = enhanceCostFor(gear, times, cap).total
  }

  const afford = cost <= coins
  return (
    <button className="plain-link inline" disabled={busy || !afford} onClick={() => onRun(times)}>
      {afford ? `+${times} · ⛁${cost.toLocaleString('th-TH')}` : 'เหรียญไม่พอ'}
    </button>
  )
}
