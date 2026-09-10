import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { usePlayer } from '../context/PlayerContext'
import { CHARACTERS, ELEMENTS, ROLES } from '../data/characters'
import { loadCollection } from '../lib/player'
import { levelCap } from '../lib/leveling'

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

  return (
    <main className="screen top">
      <div className="sheet">
        <h1>จัดทีม</h1>
        <p className="meta">
          เลือกได้สูงสุด {TEAM_SIZE} ตัว ลำดับในสนามรบเรียงตามความเร็ว ไม่ใช่ลำดับที่เลือก
        </p>

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
          .sort((a, b) => {
            const order = { SSR: 0, SR: 1, R: 2 }
            const ra = order[CHARACTERS[a.id]?.rarity] ?? 3
            const rb = order[CHARACTERS[b.id]?.rarity] ?? 3
            return ra - rb || b.level - a.level
          })
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
