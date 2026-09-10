import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { addFriend, findPlayer, loadFriends, removeFriend } from '../lib/friends'
import { STAGES } from '../data/stages'
import { PLAYER_MAX_LEVEL } from '../lib/leveling'

const RANKS = [
  { name: 'ผู้ฝึกหัด', min: 0 },
  { name: 'นักผจญภัย', min: 600 },
  { name: 'อัศวิน', min: 1200 },
  { name: 'แชมเปี้ยน', min: 1800 },
  { name: 'จอมทัพ', min: 2400 },
  { name: 'ราชันย์', min: 3000 },
  { name: 'กึ่งเทพ', min: 3600 },
]

export function rankOf(points = 0) {
  return [...RANKS].reverse().find((r) => points >= r.min)?.name ?? RANKS[0].name
}

function furthestStage(progress = {}) {
  const cleared = STAGES.filter((s) => (progress[s.id] ?? 0) > 0)
  return cleared.length ? cleared[cleared.length - 1].id : 'ยังไม่ผ่านด่านใด'
}

export default function Friends() {
  const { user, player } = usePlayer()
  const [friends, setFriends] = useState(null)
  const [term, setTerm] = useState('')
  const [found, setFound] = useState(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadFriends(user.uid).then(setFriends)
  }, [user.uid])

  async function search() {
    setError(null)
    setBusy(true)
    try {
      const result = await findPlayer(term)
      setFound(result)
    } catch {
      setError('ค้นหาไม่สำเร็จ ตรวจว่าอัปโหลด Security Rules ล่าสุดแล้วหรือยัง')
    }
    setBusy(false)
  }

  async function add(target) {
    if (target.uid === user.uid) {
      setError('เพิ่มตัวเองเป็นเพื่อนไม่ได้')
      return
    }
    await addFriend(user.uid, target)
    setFound(undefined)
    setTerm('')
    setFriends(await loadFriends(user.uid))
  }

  async function drop(uid) {
    await removeFriend(user.uid, uid)
    setFriends(await loadFriends(user.uid))
  }

  const already = (uid) => friends?.some((f) => f.uid === uid)

  return (
    <main className="screen top">
      <div className="sheet">
        <h1>เพื่อน</h1>
        <p className="meta">ค้นหาจากชื่อผู้ใช้ ต้องพิมพ์ให้ตรงทั้งหมด</p>

        <div className="search-row">
          <input
            value={term}
            autoCapitalize="none"
            spellCheck="false"
            placeholder="ชื่อผู้ใช้"
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
          <button className="rune-link" onClick={search} disabled={busy || !term.trim()}>
            ค้นหา
          </button>
        </div>

        {error && <div className="trace">{error}</div>}

        {found === null && <p className="meta">ไม่พบผู้เล่นชื่อนี้</p>}

        {found && (
          <div className="card found">
            <div className="card-body">
              <h3>{found.username}</h3>
              <p className="meta">
                เลเวล {found.playerLevel ?? 1} · {rankOf(found.pvpPoints)}
              </p>
            </div>
            {already(found.uid) ? (
              <span className="meta">เป็นเพื่อนแล้ว</span>
            ) : (
              <button className="rune-link" onClick={() => add(found)}>
                เพิ่ม
              </button>
            )}
          </div>
        )}

        <h2 className="section-title">รายชื่อเพื่อน</h2>

        {friends === null && <p className="meta">กำลังอ่านรายชื่อ</p>}
        {friends?.length === 0 && <p className="meta">ยังไม่มีเพื่อน ลองค้นหาชื่อที่รู้จักดู</p>}

        {friends?.map((f) => (
          <article className="friend" key={f.uid}>
            <header className="friend-head">
              <h3>{f.username}</h3>
              <button className="plain-link inline" onClick={() => drop(f.uid)}>
                ลบ
              </button>
            </header>

            <dl className="ledger">
              <div className="ledger-row">
                <dt>เลเวลผู้เล่น</dt>
                <dd>
                  {f.playerLevel ?? 1}
                  {(f.playerLevel ?? 1) >= PLAYER_MAX_LEVEL && ' (สูงสุด)'}
                </dd>
              </div>
              <div className="ledger-row">
                <dt>ผ่านถึงด่าน</dt>
                <dd>{furthestStage(f.stageProgress)}</dd>
              </div>
              <div className="ledger-row">
                <dt>แรงค์ปัจจุบัน</dt>
                <dd>{rankOf(f.pvpPoints)}</dd>
              </div>
              <div className="ledger-row">
                <dt>แรงค์สูงสุด</dt>
                <dd>{f.highestRank ?? rankOf(f.pvpPoints)}</dd>
              </div>
            </dl>
          </article>
        ))}

        <p className="meta tiny">แรงค์จะเริ่มขยับจริงเมื่อเปิดระบบประลองในเฟสถัดไป</p>

        <div className="gate">
          <Link className="rune-link" to="/">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  )
}
