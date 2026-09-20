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
import UnitPeek from '../components/UnitPeek'

const fmt = (n) => Math.round(n ?? 0).toLocaleString('th-TH')

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
  const { user } = usePlayer()
  const [rows, setRows] = useState(null)
  const [tab, setTab] = useState('pvp')
  const [charFilter, setCharFilter] = useState('')
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [unitPeek, setUnitPeek] = useState(null)

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
              {['UR', ...RARITIES.slice().reverse()].map((rarity) => (
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
                      {r.guildTag && <span className="guild-tag">[{r.guildTag}]</span>}
                    </span>
                    <span className="meta">ผู้เล่น {r.username}</span>
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
            <div className="board-item" data-expanded={expanded === r.uid} key={r.uid}>
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
