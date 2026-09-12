import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { addFriend, findPlayer, loadFriends, removeFriend } from '../lib/friends'
import { STAGES } from '../data/stages'
import { PLAYER_MAX_LEVEL } from '../lib/leveling'
import { RANKS, rankLabel, titleName } from '../data/ranks'
import DefensePeek from '../components/DefensePeek'
import { defenseEntries } from '../lib/pvp'
import { entryPower, formatPower } from '../lib/power'

function furthestStage(progress = {}) {
  const cleared = STAGES.filter((s) => (progress[s.id] ?? 0) > 0)
  return cleared.length ? cleared[cleared.length - 1].id : 'ยังไม่ผ่านด่านใด'
}

/** บอกสาเหตุจริงออกมา ไม่ใช่ข้อความกว้าง ๆ ที่ตามต่อไม่ได้ */
function explain(what, err) {
  if (err?.code === 'permission-denied') {
    return `${what} เพราะกฎความปลอดภัยปฏิเสธคำขอ ให้เอาไฟล์ firestore.rules ล่าสุดไปวางใน Firebase Console แล้วกด Publish`
  }
  if (err?.code === 'unavailable') return `${what} เพราะต่ออินเทอร์เน็ตไม่ได้`
  return `${what} (${err?.code || 'ไม่ทราบสาเหตุ'})`
}

export default function Friends() {
  const { user, player } = usePlayer()
  const navigate = useNavigate()
  const [peek, setPeek] = useState(null)
  const [friends, setFriends] = useState(null)
  const [term, setTerm] = useState('')
  const [found, setFound] = useState(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadFriends(user.uid)
      .then(setFriends)
      .catch((err) => {
        setFriends([])
        setError(explain('อ่านรายชื่อเพื่อนไม่สำเร็จ', err))
      })
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

  // เดิมฟังก์ชันนี้ไม่มีการดักข้อผิดพลาดเลย
  // เวลากฎปฏิเสธคำขอ หน้าจอจึงเงียบสนิท กดแล้วไม่มีอะไรเกิดขึ้น
  // และไม่มีทางรู้ว่าติดตรงไหน ซึ่งคืออาการที่เจอ
  async function add(target) {
    if (target.uid === user.uid) {
      setError('เพิ่มตัวเองเป็นเพื่อนไม่ได้')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await addFriend(user.uid, target)
      setFound(undefined)
      setTerm('')
      setFriends(await loadFriends(user.uid))
    } catch (err) {
      setError(explain('เพิ่มเพื่อนไม่สำเร็จ', err))
    }
    setBusy(false)
  }

  async function drop(uid) {
    setBusy(true)
    setError(null)
    try {
      await removeFriend(user.uid, uid)
      setFriends(await loadFriends(user.uid))
    } catch (err) {
      setError(explain('ลบเพื่อนไม่สำเร็จ', err))
    }
    setBusy(false)
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
                เลเวล {found.playerLevel ?? 1} · {rankLabel(found.pvpPoints)}
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
              <h3>
                {f.username}
                <span className="board-title">{titleName(f.titleIndex ?? 0)}</span>
              </h3>
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
                <dd>{rankLabel(f.pvpPoints)}</dd>
              </div>
              <div className="ledger-row">
                <dt>แรงค์สูงสุด</dt>
                <dd>{RANKS[f.highestRank ?? 0]?.name ?? RANKS[0].name}</dd>
              </div>
              <div className="ledger-row">
                <dt>ค่าพลังทีมตั้งรับ</dt>
                <dd>
                  {defenseEntries(f).length
                    ? `⚔ ${formatPower(defenseEntries(f).reduce((s, e) => s + entryPower(e), 0))}`
                    : 'ยังไม่ได้ตั้ง'}
                </dd>
              </div>
            </dl>

            <div className="friend-actions">
              <button
                className="plain-link inline"
                disabled={!defenseEntries(f).length}
                onClick={() => setPeek(f)}
              >
                ดูตัวละคร
              </button>
              <button
                className="plain-link inline"
                disabled={!defenseEntries(f).length}
                onClick={() => navigate('/pvp', { state: { foe: f, friendly: true } })}
              >
                ประลองสนุก ๆ
              </button>
            </div>
          </article>
        ))}

        <p className="meta tiny">
          ประลองกับเพื่อนไม่นับแต้มและไม่ใช้โควตาประจำวัน
          ฝั่งเพื่อนให้บอทคุมทีมตั้งรับที่เขาบันทึกไว้
        </p>



        <div className="gate">
          <Link className="rune-link" to="/">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>

      {peek && (
        <DefensePeek
          foe={peek}
          title={`ตัวละครที่ ${peek.username} ใช้`}
          onClose={() => setPeek(null)}
        />
      )}
    </main>
  )
}
