import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import { CHARACTERS, ELEMENTS, RARITIES, ROLES, TEAM_SIZE } from '../data/characters'
import {
  awakenBlockers,
  awakenCost,
  effectiveRarity,
  awakenName,
  tierBlockers,
  tierCost,
} from '../data/ascension'
import { canAfford, EMPTY_BAG } from '../data/materials'
import { loadCollection } from '../lib/player'
import { entryLevelCap } from '../lib/stats'
import { entryPower, formatPower } from '../lib/power'
import { nextStarCost } from '../lib/gacha'

// ─────────────────────────────────────────────────────────────
// ตัวจัดทีมตัวเดียว ใช้ได้กับสามโหมด
//
// ผจญภัย / บุก — เก็บแค่รหัสตัวละคร เพราะอ่านค่าสถานะสดจากกระเป๋าตอนเข้าด่านได้
// ตั้งรับ      — เก็บสำเนาค่าสถานะทั้งก้อน เพราะคนอื่นต้องอ่านทีมนี้ได้
//                โดยไม่ต้องเปิดสิทธิ์ให้อ่านกระเป๋าตัวละครของเรา
// ─────────────────────────────────────────────────────────────

const MODES = {
  adventure: { key: 'team', label: 'ผจญภัย', note: 'ทีมที่ใช้ลงด่านเนื้อเรื่อง เหมือง ลานฝึก และด่านหาของ' },
  attack: { key: 'pvpTeam', label: 'บุกประลอง', note: 'ทีมที่ใช้ท้าคนอื่นในสนามประลอง แยกจากทีมผจญภัย' },
  defense: { key: 'defense', label: 'ตั้งรับ', note: 'ทีมที่คนอื่นต้องเจอเมื่อมาท้าคุณ เก็บเป็นสำเนา ณ ตอนบันทึก' },
}

export default function Team() {
  const { user, player, refresh } = usePlayer()
  const [params, setParams] = useSearchParams()
  const mode = MODES[params.get('mode')] ? params.get('mode') : 'adventure'
  const config = MODES[mode]

  const [owned, setOwned] = useState(null)
  const [picks, setPicks] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [filterElement, setFilterElement] = useState('all')
  const [filterRarity, setFilterRarity] = useState('all')

  useEffect(() => {
    loadCollection(user.uid).then(setOwned)
  }, [user.uid])

  // ทีมตั้งรับเก็บเป็นสำเนา จึงต้องดึงรหัสออกมาก่อน
  function savedIds(m) {
    const raw = player[MODES[m].key]
    if (!Array.isArray(raw)) return []
    return raw.map((x) => (typeof x === 'string' ? x : x.id)).filter(Boolean)
  }

  useEffect(() => {
    setPicks(savedIds(mode))
    setError(null)
  }, [mode, player])

  function toggle(id) {
    setError(null)
    setPicks((t) => {
      if (t.includes(id)) return t.filter((x) => x !== id)
      if (t.length >= TEAM_SIZE) return t
      return [...t, id]
    })
  }

  async function save() {
    if (!picks.length) {
      setError('ต้องมีอย่างน้อยหนึ่งตัวในทีม')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const entries = picks.map((id) => owned.find((o) => o.id === id)).filter(Boolean)
      const value = mode === 'defense' ? entries : picks
      await updateDoc(doc(db, 'users', user.uid), { [config.key]: value })
      await refresh()
    } catch (e) {
      setError(explainError('บันทึกไม่สำเร็จ', e))
    }
    setSaving(false)
  }

  const powerOf = (ids) =>
    ids.reduce((sum, id) => {
      const e = owned?.find((o) => o.id === id)
      return e ? sum + entryPower(e) : sum
    }, 0)

  /**
   * ตัวละครตัวนี้พร้อมอัปเกรดอะไรสักอย่างอยู่ไหม (อัปดาว ยกระดับ หรือปลุกร่าง)
   *
   * เช็คแค่ "ทำได้เลยตอนนี้" (มีชิ้นส่วน/วัสดุพอ และผ่านเงื่อนไขอื่นแล้ว) ไม่ใช่แค่ "ยังไม่เต็ม"
   * ไม่งั้นตัวที่ยังห่างไกลจากเงื่อนไขจะติดจุดค้างไว้ทั้งที่กดอัปอะไรตอนนี้ไม่ได้จริง
   */
  function canUpgrade(entry) {
    const c = CHARACTERS[entry.id]
    if (!c) return false

    const rarity = effectiveRarity(entry.id, entry.tier ?? 0)
    const starCost = nextStarCost(entry.star ?? 1, rarity)
    if (starCost !== null && (entry.shards ?? 0) >= starCost) return true

    const bag = { ...EMPTY_BAG, ...(player.materials ?? {}) }
    const cap = entryLevelCap(entry.id, entry)

    if (tierBlockers(entry.id, entry, cap).length === 0) {
      const cost = tierCost(entry.tier ?? 0)
      if (cost && canAfford(bag, cost)) return true
    }

    if (awakenBlockers(entry.id, entry).length === 0) {
      const cost = awakenCost(entry.awaken ?? 0)
      if (cost && canAfford(bag, cost)) return true
    }

    return false
  }

  const current = powerOf(picks)
  const delta = current - powerOf(savedIds(mode))
  const dirty = JSON.stringify(picks) !== JSON.stringify(savedIds(mode))

  // ทีมตั้งรับเก็บเป็นสำเนา ณ ตอนบันทึก ถ้าตัวละครในทีมได้อุปกรณ์ใหม่/เลเวลขึ้นหลังจากนั้น
  // สำเนาเก่าจะไม่ขยับตาม ต้องกดบันทึกซ้ำเพื่อดันค่าล่าสุดขึ้นบอร์ด แม้รายชื่อทีมจะไม่เปลี่ยนก็ตาม
  const stale =
    mode === 'defense' &&
    (player.defense ?? []).some((stored) => {
      const live = owned?.find((o) => o.id === stored.id)
      return live && entryPower(live) !== entryPower(stored)
    })

  return (
    <main className="screen top">
      <div className="sheet">
        <div className="top-nav">
          <Link className="plain-link inline" to="/">
            ← หน้าหลัก
          </Link>
          <Link className="plain-link inline" to="/gear">
            อุปกรณ์
          </Link>
        </div>

        <h1>จัดทีม</h1>

        <div className="mode-tabs">
          {Object.entries(MODES).map(([key, m]) => (
            <button
              key={key}
              className="mode-tab"
              data-active={key === mode}
              onClick={() => setParams({ mode: key })}
            >
              {m.label}
              <span className="mode-count">{savedIds(key).length}</span>
            </button>
          ))}
        </div>

        <div className="roster-head">
          <span className="meta">{config.note}</span>
          <button
            className="plain-link inline"
            disabled={!owned?.length}
            onClick={() => {
              // เรียงตามค่าพลังแล้วหยิบห้าตัวแรก
              // ไม่ได้ดูธาตุหรือบทบาท เพราะปุ่มนี้มีไว้สำหรับคนที่ยังไม่อยากคิดมาก
              const best = [...owned]
                .sort((a, b) => entryPower(b) - entryPower(a))
                .slice(0, TEAM_SIZE)
                .map((o) => o.id)
              setPicks(best)
            }}
          >
            ใส่ตัวที่แรงที่สุด
          </button>
        </div>

        <div className="cp-banner">
          <span className="meta">ค่าพลังรวม</span>
          <strong>
            ⚔ {formatPower(current)}
            {dirty && delta !== 0 && (
              <span className={delta > 0 ? 'delta up' : 'delta down'}>
                {delta > 0 ? '+' : ''}
                {formatPower(delta)}
              </span>
            )}
          </strong>
        </div>

        <div className="team-slots">
          {[...Array(TEAM_SIZE)].map((_, i) => {
            const c = picks[i] ? CHARACTERS[picks[i]] : null
            return (
              <div className="slot" key={i} data-filled={Boolean(c)}>
                {c ? (
                  <>
                    <span className="slot-mark">{ELEMENTS[c.element].mark}</span>
                    <span className="slot-name">{c.name}</span>
                  </>
                ) : (
                  <span className="meta tiny">ว่าง</span>
                )}
              </div>
            )
          })}
        </div>

        {error && <div className="trace">{error}</div>}

        {!dirty && stale && (
          <p className="meta tiny">
            ตัวละครในทีมตั้งรับมีค่าพลังเปลี่ยนไปจากตอนที่บันทึกไว้ (เช่น ได้อุปกรณ์ใหม่) กดบันทึกซ้ำเพื่ออัปเดตค่าที่คนอื่นเห็น
          </p>
        )}

        {(dirty || stale) && (
          <button className="rune-link block primary" onClick={save} disabled={saving}>
            {saving ? 'กำลังบันทึก' : `บันทึกทีม${config.label}`}
          </button>
        )}

        <h2 className="section-title">ตัวละครที่มี {owned ? `(${owned.length})` : ''}</h2>

        <div className="filter-row">
          <select
            className="filter-select"
            value={filterElement}
            onChange={(e) => setFilterElement(e.target.value)}
          >
            <option value="all">ทุกธาตุ</option>
            {Object.entries(ELEMENTS).map(([id, el]) => (
              <option key={id} value={id}>
                {el.mark} {el.name}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value)}
          >
            <option value="all">ทุกระดับ</option>
            {[...RARITIES, 'UR'].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {owned === null && <p className="meta">กำลังเปิดกระเป๋า</p>}

        <div className="roster-grid">
        {owned
          ?.filter((entry) => {
            const c = CHARACTERS[entry.id]
            if (!c) return false
            if (filterElement !== 'all' && c.element !== filterElement) return false
            // อ้างอิงระดับเก่า (c.rarity) ไม่ใช่ระดับที่ยกระดับแล้ว เพื่อกรองตามที่สุ่มได้จริง
            if (filterRarity !== 'all' && c.rarity !== filterRarity) return false
            return true
          })
          .sort((a, b) => entryPower(b) - entryPower(a))
          .map((entry) => {
            const c = CHARACTERS[entry.id]
            if (!c) return null
            const picked = picks.includes(entry.id)

            return (
              <div className="card roster-card" key={entry.id} data-picked={picked}>
                <span className="card-mark">
                  {ELEMENTS[c.element].mark}
                  {canUpgrade(entry) && <span className="upgrade-dot" title="พร้อมอัปเกรด" />}
                </span>
                <div className="card-body">
                  <h3>
                    {c.name}
                    <span
                      className="rarity"
                      data-rarity={effectiveRarity(entry.id, entry.tier)}
                      data-upgraded={(entry.tier ?? 0) > 0}
                      title={
                        (entry.tier ?? 0) > 0
                          ? `ยกระดับมาจาก ${c.rarity}`
                          : 'ระดับตั้งต้นจากกาชา'
                      }
                    >
                      {effectiveRarity(entry.id, entry.tier)}
                      {(entry.tier ?? 0) > 0 && <span className="up-mark">↑</span>}
                    </span>
                    {(entry.awaken ?? 0) > 0 && (
                      <span className="awaken-tag">{awakenName(entry.awaken)}</span>
                    )}
                  </h3>
                  <p className="meta">
                    {ROLES[c.role]} · เลเวล {entry.level}/{entryLevelCap(entry.id, entry)} ·{' '}
                    {'★'.repeat(entry.star)}
                  </p>
                  <p className="meta cp">⚔ {formatPower(entryPower(entry))}</p>
                </div>
                <div className="card-actions">
                  <button className="plain-link inline" onClick={() => toggle(entry.id)}>
                    {picked ? 'เอาออก' : 'ใส่ทีม'}
                  </button>
                  <Link className="plain-link inline" to={`/hero/${entry.id}`}>
                    ดู
                  </Link>
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
    </main>
  )
}
