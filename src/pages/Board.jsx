import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { usePlayer } from '../context/PlayerContext'
import { rankLabel, rankOf, titleName } from '../data/ranks'
import { CHAPTERS, DIFFICULTIES } from '../data/stages'
import { ALL_IDS, CHARACTERS, ELEMENTS, RARITIES } from '../data/characters'
import { effectiveRarity } from '../data/ascension'
import { entryPower, formatPower } from '../lib/power'
import { explainError } from '../lib/errors'
import { defenseEntries } from '../lib/pvp'
import { nameFor } from '../lib/displayname'
import { acceptRequest, friendStatusOf, loadFriendStatus, sendFriendRequest } from '../lib/friends'
import { boardSlot, msUntilNextSlot, slotStart } from '../lib/boardclock'
import UnitPeek from '../components/UnitPeek'

const fmt = (n) => Math.round(n ?? 0).toLocaleString('th-TH')

/** ข้อมูลบอร์ดของรอบล่าสุดที่อ่านมา เก็บไว้ระดับโมดูลให้อยู่รอดตอนออกจากหน้านี้แล้วกลับมาใหม่ */
let boardCache = null

const clock = (ms) =>
  new Date(ms).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })

// ─────────────────────────────────────────────────────────────
// บอร์ดอันดับรวม
//
// อ่านเอกสารผู้เล่นชุดเดียวแล้วจัดอันดับสี่แบบในเครื่อง
// ไม่ได้ยิงหลายคำขอแยกกัน เพราะทุกอันดับใช้ข้อมูลจากเอกสารเดียวกันทั้งหมด
// และโควตาอ่านของ Firestore คิดเป็นรายเอกสาร ไม่ใช่รายคำขอ
//
// อันดับตัวละคร (แท็บ 'character') ต่างจากสามแท็บแรกตรงที่ไม่ได้เทียบตัวเลขบนเอกสารผู้เล่นตรง ๆ
// แต่ไล่ดู player.roster ของแต่ละคน (สรุปตัวละครทุกตัวที่มี ไม่ใช่แค่ทีมตั้งรับ ดู buildRoster
// ใน lib/power.js) หาว่ามีตัวละครที่เลือกอยู่ไหม ถ้ามีถึงจะเข้าอันดับ ไม่ต้องตั้งไว้ในทีมไหนเลย
// roster เป็นสรุปที่จดไว้บนเอกสารผู้เล่นเอง (อัปเดตตอนเปิดหน้าหลัก เหมือน rosterPower)
// เพื่อให้คนอื่นเห็นสถานะตัวละคร (เลเวล ดาว ยกระดับ ปลุกร่าง อุปกรณ์) ได้โดยไม่ต้องเปิดสิทธิ์
// อ่านกระเป๋าตัวละครส่วนตัวโดยตรง
// ข้อจำกัดคือเห็นเฉพาะคนที่ติดร้อยอันดับแต้มประลองบนสุดเท่านั้น เหมือนกับแท็บ "ค่าพลังสูงสุด"
// ที่ใช้กลุ่มตัวอย่างเดียวกันอยู่แล้ว ไม่ใช่ข้อจำกัดใหม่ที่เพิ่มมาเฉพาะแท็บนี้
// ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'pvp', name: 'แต้มประลอง', unit: 'แต้ม' },
  { id: 'power', name: 'ค่าพลังสูงสุด', unit: '⚔' },
  { id: 'story', name: 'ผ่านด่านเร็วสุด', unit: 'ด่าน' },
  { id: 'character', name: 'จัดอันดับตัวละคร', unit: '⚔' },
]

/** จำนวนด่านเนื้อเรื่องที่ผ่านแล้ว นับรวมทุกระดับความยาก */
function storyScore(user) {
  const progress = user.stageProgress ?? {}
  const ids = CHAPTERS.flatMap((c) => c.stages.map((s) => s.id))
  let count = 0
  ids.forEach((id) => {
    DIFFICULTIES.forEach((d) => {
      if ((progress[id + d.suffix] ?? 0) > 0) count += 1
    })
  })
  return count
}

/**
 * ด่านล่าสุดที่ผ่าน นับรวมทุกโหมด
 *
 * เดิมดูแต่โหมดปกติ ผลคือคนที่ไต่ไปถึงปีศาจ 5-4 แล้วยังขึ้นว่า 7-6 อยู่
 * ซึ่งต่ำกว่าความจริงมาก และทำให้บอร์ดเรียงคนที่เก่งกว่าไว้ต่ำกว่า
 */
function furthest(user) {
  const progress = user.stageProgress ?? {}
  const all = CHAPTERS.flatMap((c) => c.stages)

  for (const d of [...DIFFICULTIES].reverse()) {
    const cleared = all.filter((s) => (progress[s.id + d.suffix] ?? 0) > 0)
    if (cleared.length) {
      const last = cleared[cleared.length - 1].id
      return d.id === 'normal' ? last : `${d.name} ${last}`
    }
  }
  return '—'
}

export default function Board() {
  const { user, player } = usePlayer()
  const [rows, setRows] = useState(null)
  const [tab, setTab] = useState('pvp')
  const [charFilter, setCharFilter] = useState('')
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [unitPeek, setUnitPeek] = useState(null)
  const [boardSlotShown, setBoardSlotShown] = useState(null)
  const [friendStatus, setFriendStatus] = useState(null)
  const [adding, setAdding] = useState(null)
  const [friendError, setFriendError] = useState(null)

  useEffect(() => {
    loadFriendStatus(user.uid)
      .then(setFriendStatus)
      .catch(() => setFriendStatus({ friends: new Set(), sent: new Set(), incoming: new Set() }))
  }, [user.uid])

  async function add(row) {
    setAdding(row.uid)
    setFriendError(null)
    try {
      // ถ้าอีกฝั่งส่งคำขอมาหาเราอยู่แล้ว การกดครั้งนี้คือการรับ ไม่ใช่ส่งคำขอใหม่
      if (friendStatus.incoming.has(row.uid)) {
        await acceptRequest(user.uid, row)
        setFriendStatus((s) => ({ ...s, friends: new Set(s.friends).add(row.uid) }))
      } else {
        const outcome = await sendFriendRequest(
          { uid: user.uid, username: player.username, nickname: player.nickname },
          row
        )
        setFriendStatus((s) =>
          outcome === 'accepted'
            ? { ...s, friends: new Set(s.friends).add(row.uid) }
            : { ...s, sent: new Set(s.sent).add(row.uid) }
        )
      }
    } catch (e) {
      setFriendError(e?.code ? explainError('ส่งคำขอเป็นเพื่อนไม่สำเร็จ', e) : e.message)
    }
    setAdding(null)
  }

  // ปุ่มอยู่ข้างในแถวที่เป็น <button> อยู่แล้ว จึงใช้ span role="button" แทน (ซ้อน <button> ใน <button> ไม่ได้)
  // และกัน stopPropagation ไม่ให้การกดปุ่มไปสลับเปิด/ปิดรายละเอียดของแถว
  function friendMark(row) {
    if (row.uid === user.uid || friendStatus === null) return null
    const status = friendStatusOf(user.uid, row.uid, friendStatus)
    if (status === 'friend') return <span className="friend-badge">เพื่อน</span>
    if (status === 'sent') return <span className="friend-badge">ส่งคำขอแล้ว</span>

    const busy = adding === row.uid
    const run = (e) => {
      e.stopPropagation()
      if (!busy) add(row)
    }
    return (
      <span
        className="friend-add"
        role="button"
        tabIndex={0}
        aria-disabled={busy}
        onClick={run}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            run(e)
          }
        }}
      >
        {busy ? 'กำลังส่ง' : status === 'incoming' ? '＋ รับเป็นเพื่อน' : '＋ เพิ่มเพื่อน'}
      </span>
    )
  }

  // อ่านบอร์ดใหม่ตามรอบ 15 นาที (ดู lib/boardclock.js) ไม่ใช่ทุกครั้งที่เปิดหน้า
  // ข้อมูลรอบเดียวกันใช้ซ้ำจาก boardCache ได้แม้ออกไปแล้วกลับมาใหม่ โดยไม่อ่านฐานข้อมูลซ้ำ
  // ค้างหน้านี้ไว้ก็อัปเดตเองเมื่อถึงรอบ ไม่ต้องกดอะไร (แถวเดิมยังอยู่ระหว่างรอข้อมูลใหม่ จอไม่กระพริบ)
  useEffect(() => {
    let alive = true
    let timer = null
    let loadedSlot = null

    async function sync() {
      const slot = boardSlot()
      if (boardCache?.slot === slot) {
        setRows(boardCache.rows)
        setBoardSlotShown(slot)
        loadedSlot = slot
      } else {
        try {
          const snap = await getDocs(
            query(collection(db, 'users'), orderBy('pvpPoints', 'desc'), limit(100))
          )
          const data = snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
          boardCache = { slot, rows: data }
          if (!alive) return
          setRows(data)
          setBoardSlotShown(slot)
          setError(null)
          loadedSlot = slot
        } catch (e) {
          // ถ้ามีข้อมูลรอบก่อนอยู่ ให้คงไว้ ไม่ล้างบอร์ดทิ้งเพราะอ่านรอบนี้พลาด
          if (alive) setError(explainError('อ่านบอร์ดไม่สำเร็จ', e))
        }
      }
      if (alive) schedule()
    }

    // เผื่อ 1 วินาทีกันตัวจับเวลาของเบราว์เซอร์ตื่นก่อนถึงรอบจริงเล็กน้อย และสุ่มหน่วงไม่เกิน 20 วินาที
    // ไม่ให้ทุกเครื่องที่เปิดค้างไว้ยิงอ่านพร้อมกันตรงขอบรอบพอดี
    function schedule() {
      clearTimeout(timer)
      timer = setTimeout(sync, msUntilNextSlot() + 1000 + Math.floor(Math.random() * 20000))
    }

    // แท็บที่ซ่อนอยู่ตัวจับเวลาจะถูกหน่วง พอกลับมาดูให้เช็คว่าข้ามรอบไปแล้วหรือยัง
    function onVisible() {
      if (document.visibilityState === 'visible' && boardSlot() !== loadedSlot) sync()
    }

    sync()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const sorted = (rows ?? [])
    .filter((r) => r.starterChosen)
    .map((r) => ({
      ...r,
      score:
        tab === 'pvp' ? r.pvpPoints ?? 0 : tab === 'power' ? r.rosterPower ?? 0 : storyScore(r),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)

  // อันดับตัวละคร — หาว่าใครมีตัวละครที่เลือกอยู่ในกระเป๋าบ้าง (ไม่ต้องตั้งทีมไหนเลย) แล้วเรียงตามค่าพลัง
  const charRanking = charFilter
    ? (rows ?? [])
        .flatMap((r) => {
          const entry = r.roster?.[charFilter]
          return entry ? [{ ...r, entry }] : []
        })
        .sort((a, b) => entryPower(b.entry) - entryPower(a.entry))
        .slice(0, 50)
    : []

  const myPlace = sorted.findIndex((r) => r.uid === user.uid)
  const myCharPlace = charRanking.findIndex((r) => r.uid === user.uid)
  const unit = TABS.find((t) => t.id === tab)?.unit ?? ''

  return (
    <main className="screen top">
      <div className="sheet">
        <div className="top-nav">
          <Link className="plain-link inline" to="/">
            ← หน้าหลัก
          </Link>
          <Link className="plain-link inline" to="/arena">
            ประลอง
          </Link>
        </div>

        <h1>บอร์ดอันดับ</h1>
        <p className="meta">
          {tab === 'character'
            ? charFilter
              ? myCharPlace >= 0
                ? `ตอนนี้คุณอยู่อันดับ ${myCharPlace + 1}`
                : 'คุณยังไม่ติดห้าสิบอันดับแรกของตัวนี้ (หรือยังไม่มีตัวนี้)'
              : 'เลือกตัวละครด้านล่างเพื่อดูอันดับ'
            : myPlace >= 0
              ? `ตอนนี้คุณอยู่อันดับ ${myPlace + 1}`
              : 'ตอนนี้คุณอยู่นอกห้าสิบอันดับแรก'}
        </p>

        {boardSlotShown !== null && (
          <p className="meta tiny">
            บอร์ดอัปเดตทุก 15 นาที · ข้อมูลรอบ {clock(slotStart(boardSlotShown))} · รอบถัดไป{' '}
            {clock(slotStart(boardSlotShown + 1))}
          </p>
        )}

        <div className="mode-tabs board-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className="mode-tab"
              data-active={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>

        {tab === 'power' && (
          <p className="meta tiny">
            ค่าพลังอัปเดตเมื่อเจ้าตัวเปิดหน้าหลัก คนที่ไม่ได้เข้าเกมนานตัวเลขจะเป็นค่าเก่า
          </p>
        )}
        {tab === 'story' && (
          <p className="meta tiny">นับรวมทุกระดับความยาก ผ่านด่านเดียวกันสามโหมดนับเป็นสาม</p>
        )}
        {tab === 'character' && (
          <>
            <select
              className="filter-select"
              value={charFilter}
              onChange={(e) => setCharFilter(e.target.value)}
            >
              <option value="">เลือกตัวละครที่ต้องการดูอันดับ</option>
              {['UR+', 'UR', ...RARITIES.slice().reverse()].map((rarity) => (
                  <optgroup key={rarity} label={`ระดับ ${rarity}`}>
                    {ALL_IDS.filter((id) => CHARACTERS[id].rarity === rarity).map((id) => (
                      <option key={id} value={id}>
                        {CHARACTERS[id].name}
                      </option>
                    ))}
                  </optgroup>
                ))}
            </select>
            <p className="meta tiny">
              นับทุกตัวที่มี ไม่ต้องตั้งไว้ในทีมตั้งรับก็ติดอันดับได้ แต่ดูเฉพาะคนที่ติดร้อยอันดับ
              แต้มประลองบนสุดเท่านั้น และค่าพลังอัปเดตเมื่อเจ้าตัวเปิดหน้าหลัก คนที่ไม่ได้เข้าเกมนาน
              ตัวเลขจะเป็นค่าเก่า
            </p>
          </>
        )}

        {error && <div className="trace">{error}</div>}
        {friendError && <div className="trace">{friendError}</div>}
        {rows === null && !error && <p className="meta">กำลังอ่านบอร์ด</p>}

        {tab === 'character' ? (
          <div className="board">
            {charFilter && charRanking.length === 0 && (
              <p className="meta">ยังไม่มีใครในร้อยอันดับแต้มประลองบนสุดมีตัวละครนี้</p>
            )}
            {charRanking.map((r, i) => (
              <div className="board-item" key={r.uid}>
                <button
                  className="board-row board-row-btn"
                  data-me={r.uid === user.uid}
                  onClick={() => setUnitPeek(r.entry)}
                >
                  <span className="board-place" data-top={i < 3}>
                    {i + 1}
                  </span>
                  <span className="board-body">
                    <span className="board-name">
                      {CHARACTERS[charFilter]?.name}
                      {r.guildTag && (
                        <span className="guild-tag" title={r.guildName || undefined}>
                          [{r.guildTag}]
                        </span>
                      )}
                    </span>
                    <span className="meta">
                      ผู้เล่น {nameFor(r, user.uid)}
                      {r.guildName && ` · กิลด์${r.guildName}`}
                    </span>
                    {friendMark(r)}
                  </span>
                  <span className="board-points">⚔ {formatPower(entryPower(r.entry))}</span>
                  <span className="board-caret label">ดูรายละเอียด</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
        <div className="board">
          {sorted.map((r, i) => (
            <div className="board-item" key={r.uid}>
              <button
                className="board-row board-row-btn"
                data-me={r.uid === user.uid}
                onClick={() => setExpanded(expanded === r.uid ? null : r.uid)}
              >
                <span className="board-place" data-top={i < 3}>
                  {i + 1}
                </span>
                <span className="board-body">
                  <span className="board-name">
                    {nameFor(r, user.uid)}
                    {r.guildTag && (
                      <span className="guild-tag" title={r.guildName || undefined}>
                        [{r.guildTag}]
                      </span>
                    )}
                    {r.titleIndex > 0 && (
                      <span className="board-title">{titleName(r.titleIndex)}</span>
                    )}
                  </span>
                  <span className="meta">
                    {tab === 'story'
                      ? `ล่าสุดด่าน ${furthest(r)} · เลเวล ${r.playerLevel ?? 1}`
                      : `${rankOf(r.pvpPoints ?? 0).mark} ${rankLabel(r.pvpPoints ?? 0)} · เลเวล ${r.playerLevel ?? 1}`}
                    {r.guildName && ` · ${r.guildName}`}
                  </span>
                  {friendMark(r)}
                </span>
                <span className="board-points">
                  {tab === 'power' ? `⚔ ${formatPower(r.score)}` : `${fmt(r.score)} ${unit}`}
                </span>
                <span className="board-caret">{expanded === r.uid ? '▲' : '▼'}</span>
              </button>

              {expanded === r.uid && (
                <div className="board-detail">
                  {defenseEntries(r).length === 0 && (
                    <p className="meta tiny">ยังไม่ได้ตั้งทีมตั้งรับ</p>
                  )}
                  <div className="unit-row-list">
                    {defenseEntries(r).map((e, idx) => {
                      const c = CHARACTERS[e.id]
                      if (!c) return null
                      return (
                        <button
                          className="unit-row"
                          key={idx}
                          onClick={() => setUnitPeek(e)}
                        >
                          <span className="unit-row-head">
                            <span className="unit-row-mark">{ELEMENTS[c.element].mark}</span>
                            <span className="unit-row-name">{c.name}</span>
                          </span>
                          <span className="unit-row-meta">
                            {effectiveRarity(e.id, e.tier)} · เลเวล {e.level}
                          </span>
                          <span className="unit-row-power">
                            ⚔ {formatPower(entryPower(e))}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
          {sorted.length === 0 && rows && <p className="meta">ยังไม่มีข้อมูล</p>}
        </div>
        )}
      </div>

      {unitPeek && <UnitPeek entry={unitPeek} onClose={() => setUnitPeek(null)} />}
    </main>
  )
}
