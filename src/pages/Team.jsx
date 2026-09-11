import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { usePlayer } from '../context/PlayerContext'
import { CHARACTERS, ELEMENTS, ROLES } from '../data/characters'
import { loadCollection } from '../lib/player'
import { levelCap } from '../lib/leveling'
import { heroPower, formatPower } from '../lib/power'

export const TEAM_SIZE = 3

export default function Team() {
  const { user, player, refresh } = usePlayer()
  const [owned, setOwned] = useState(null)
  const [team, setTeam] = useState(player.team ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadCollection(user.uid).then(setOwned)
  }, [user.uid])

  function toggle(id) {
    setError(null)
    setTeam((t) => {
      if (t.includes(id)) return t.filter((x) => x !== id)
      if (t.length >= TEAM_SIZE) return t
      return [...t, id]
    })
  }

  async function save() {
    if (!team.length) {
      setError('ต้องมีอย่างน้อยหนึ่งตัวในทีม')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await updateDoc(doc(db, 'users', user.uid), { team })
      await refresh()
    } catch {
      setError('บันทึกไม่สำเร็จ ตรวจว่าอัปโหลดกฎล่าสุดแล้วหรือยัง')
    }
    setSaving(false)
  }

  const dirty = JSON.stringify(team) !== JSON.stringify(player.team ?? [])

  const powerOf = (ids) =>
    ids.reduce((sum, id) => {
      const e = owned?.find((o) => o.id === id)
      return e ? sum + heroPower(e.id, e.level, e.star) : sum
    }, 0)

  const current = powerOf(team)
  const saved_ = powerOf(player.team ?? [])
  const delta = current - saved_

  return (
    <main className="screen top">
      <div className="sheet">
        <h1>จัดทีม</h1>
        <p className="meta">
          เลือกได้สูงสุด {TEAM_SIZE} ตัว ลำดับในสนามรบเรียงตามความเร็ว ไม่ใช่ลำดับที่เลือก
        </p>

        <div className="cp-banner">
          <span className="meta">ค่าพลังรวมของทีม</span>
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
            const id = team[i]
            const c = id ? CHARACTERS[id] : null
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
          <button className="rune-link block" onClick={save} disabled={saving}>
            {saving ? 'กำลังบันทึก' : 'บันทึกทีม'}
          </button>
        )}

        <h2 className="section-title">ตัวละครที่มี {owned ? `(${owned.length})` : ''}</h2>

        {owned === null && <p className="meta">กำลังเปิดกระเป๋า</p>}

        {owned
          ?.slice()
          .sort(
            (a, b) =>
              heroPower(b.id, b.level, b.star) - heroPower(a.id, a.level, a.star)
          )
          .map((entry) => {
            const c = CHARACTERS[entry.id]
            if (!c) return null
            const picked = team.includes(entry.id)

            return (
              <div className="card roster-card" key={entry.id} data-picked={picked}>
                <span className="card-mark">{ELEMENTS[c.element].mark}</span>
                <div className="card-body">
                  <h3>
                    {c.name}
                    <span className="rarity">{c.rarity}</span>
                  </h3>
                  <p className="meta">
                    {ROLES[c.role]} · เลเวล {entry.level}/{levelCap(c.rarity, entry.star)} ·{' '}
                    {'★'.repeat(entry.star)}
                  </p>
                  <p className="meta cp">⚔ {formatPower(heroPower(c.id, entry.level, entry.star))}</p>
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
