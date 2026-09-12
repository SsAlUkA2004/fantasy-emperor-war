import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { usePlayer } from '../context/PlayerContext'
import { CHARACTERS, ELEMENTS, ROLES, TEAM_SIZE } from '../data/characters'
import { effectiveRarity, awakenName } from '../data/ascension'
import { loadCollection } from '../lib/player'
import { entryLevelCap } from '../lib/stats'
import { entryPower, formatPower } from '../lib/power'

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
    } catch {
      setError('บันทึกไม่สำเร็จ ตรวจว่าอัปโหลดกฎล่าสุดแล้วหรือยัง')
    }
    setSaving(false)
  }

  const powerOf = (ids) =>
    ids.reduce((sum, id) => {
      const e = owned?.find((o) => o.id === id)
      return e ? sum + entryPower(e) : sum
    }, 0)

  const current = powerOf(picks)
  const delta = current - powerOf(savedIds(mode))
  const dirty = JSON.stringify(picks) !== JSON.stringify(savedIds(mode))

  return (
    <main className="screen top">
      <div className="sheet">
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

        <p className="meta">{config.note}</p>

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

        {dirty && (
          <button className="rune-link block primary" onClick={save} disabled={saving}>
            {saving ? 'กำลังบันทึก' : `บันทึกทีม${config.label}`}
          </button>
        )}

        <h2 className="section-title">ตัวละครที่มี {owned ? `(${owned.length})` : ''}</h2>

        {owned === null && <p className="meta">กำลังเปิดกระเป๋า</p>}

        {owned
          ?.slice()
          .sort((a, b) => entryPower(b) - entryPower(a))
          .map((entry) => {
            const c = CHARACTERS[entry.id]
            if (!c) return null
            const picked = picks.includes(entry.id)

            return (
              <div className="card roster-card" key={entry.id} data-picked={picked}>
                <span className="card-mark">{ELEMENTS[c.element].mark}</span>
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

        <div className="gate">
          <Link className="rune-link" to="/">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  )
}
