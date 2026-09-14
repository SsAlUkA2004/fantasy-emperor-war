import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { usePlayer } from '../context/PlayerContext'
import { rankLabel, rankOf, titleName } from '../data/ranks'
import { CHAPTERS, DIFFICULTIES } from '../data/stages'
import { formatPower } from '../lib/power'
import { explainError } from '../lib/errors'

const fmt = (n) => Math.round(n ?? 0).toLocaleString('th-TH')

// ─────────────────────────────────────────────────────────────
// บอร์ดอันดับรวม
//
// อ่านเอกสารผู้เล่นชุดเดียวแล้วจัดอันดับสามแบบในเครื่อง
// ไม่ได้ยิงสามคำขอแยกกัน เพราะสามอันดับใช้ข้อมูลจากเอกสารเดียวกันทั้งหมด
// และโควตาอ่านของ Firestore คิดเป็นรายเอกสาร ไม่ใช่รายคำขอ
// ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'pvp', name: 'แต้มประลอง', unit: 'แต้ม' },
  { id: 'power', name: 'ค่าพลังสูงสุด', unit: '⚔' },
  { id: 'story', name: 'ผ่านด่านเร็วสุด', unit: 'ด่าน' },
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
  const { user } = usePlayer()
  const [rows, setRows] = useState(null)
  const [tab, setTab] = useState('pvp')
  const [error, setError] = useState(null)

  useEffect(() => {
    getDocs(query(collection(db, 'users'), orderBy('pvpPoints', 'desc'), limit(100)))
      .then((snap) => setRows(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))))
      .catch((e) => setError(explainError('อ่านบอร์ดไม่สำเร็จ', e)))
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

  const myPlace = sorted.findIndex((r) => r.uid === user.uid)
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
          {myPlace >= 0 ? `ตอนนี้คุณอยู่อันดับ ${myPlace + 1}` : 'ตอนนี้คุณอยู่นอกห้าสิบอันดับแรก'}
        </p>

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

        {error && <div className="trace">{error}</div>}
        {rows === null && !error && <p className="meta">กำลังอ่านบอร์ด</p>}

        <div className="board">
          {sorted.map((r, i) => (
            <div className="board-row" key={r.uid} data-me={r.uid === user.uid}>
              <span className="board-place" data-top={i < 3}>
                {i + 1}
              </span>
              <span className="board-body">
                <span className="board-name">
                  {r.username}
                  {r.guildTag && <span className="guild-tag">[{r.guildTag}]</span>}
                  {r.titleIndex > 0 && (
                    <span className="board-title">{titleName(r.titleIndex)}</span>
                  )}
                </span>
                <span className="meta">
                  {tab === 'story'
                    ? `ล่าสุดด่าน ${furthest(r)} · เลเวล ${r.playerLevel ?? 1}`
                    : `${rankOf(r.pvpPoints ?? 0).mark} ${rankLabel(r.pvpPoints ?? 0)} · เลเวล ${r.playerLevel ?? 1}`}
                </span>
              </span>
              <span className="board-points">
                {tab === 'power' ? `⚔ ${formatPower(r.score)}` : `${fmt(r.score)} ${unit}`}
              </span>
            </div>
          ))}
          {sorted.length === 0 && rows && <p className="meta">ยังไม่มีข้อมูล</p>}
        </div>
      </div>
    </main>
  )
}
