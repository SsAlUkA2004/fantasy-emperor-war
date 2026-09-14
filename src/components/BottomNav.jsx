import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { claimableRanks } from '../data/ranks'
import { chapterCleared, UNLOCKS, GEM_RUNS_PER_DAY } from '../data/stages'
import { RUNS_PER_DAY as DUNGEON_RUNS } from '../data/dungeon'
import { MATERIAL_RUNS_PER_DAY } from '../data/materials'
import { runsLeft } from '../lib/dayclock'
import { discountAvailable } from '../lib/gacha'
import { matchesLeft } from '../lib/pvp'
import { signOut } from '../lib/auth'

// ─────────────────────────────────────────────────────────────
// แถบนำทางล่างจอ
//
// เกมโตจนมียี่สิบเจ็ดหน้า แต่ทางเข้าเดียวคือหน้าหลัก
// ทุกครั้งที่อยากเปลี่ยนโหมดต้องกดกลับหน้าหลักก่อนเสมอ
//
// จุดสีบนแท็บคำนวณจากเอกสารผู้เล่นที่โหลดมาอยู่แล้วทั้งหมด
// ไม่มีการอ่านฐานข้อมูลเพิ่มแม้แต่ครั้งเดียว
// ─────────────────────────────────────────────────────────────

const HIDE_ON = ['/battle/', '/pvp', '/boss/fight']

const GROUPS = [
  {
    name: 'ออกรบ',
    items: [
      { to: '/dungeon', label: 'ดันเจี้ยน', mark: '🏯' },
      { to: '/hunt', label: 'รอยอดีต', mark: '🕯️' },
      { to: '/boss', label: 'บอสโลก', mark: '🐲' },
    ],
  },
  {
    name: 'สะสม',
    items: [
      { to: '/gacha', label: 'อัญเชิญ', mark: '🔮' },
      { to: '/exchange', label: 'แลกเปลี่ยน', mark: '🔶' },
      { to: '/gear', label: 'อุปกรณ์', mark: '⚔️' },
      { to: '/collection', label: 'หอสะสม', mark: '📖' },
    ],
  },
  {
    name: 'สังคม',
    items: [
      { to: '/guild', label: 'กิลด์', mark: '🏰' },
      { to: '/friends', label: 'เพื่อน', mark: '🤝' },
      { to: '/board', label: 'บอร์ด', mark: '🏆' },
      { to: '/ranks', label: 'แรงค์', mark: '👑' },
    ],
  },
  {
    name: 'อื่น ๆ',
    items: [
      { to: '/shop', label: 'ร้านค้า', mark: '🏪' },
      { to: '/mail', label: 'กล่องจดหมาย', mark: '✉️' },
      { to: '/redeem', label: 'แลกโค้ด', mark: '🎟️' },
      { to: '/status', label: 'ระบบ', mark: '⚙️' },
    ],
  },
]

export default function BottomNav() {
  const { player } = usePlayer()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null

  const progress = player?.stageProgress ?? {}
  const arenaOpen = chapterCleared(progress, UNLOCKS.arena.chapter)

  // จุดเตือนบนแท็บ คำนวณจากข้อมูลที่มีอยู่แล้ว ไม่ต้องอ่านเพิ่ม
  const dots = {
    stages:
      runsLeft(player, GEM_RUNS_PER_DAY) > 0 ||
      runsLeft(player, MATERIAL_RUNS_PER_DAY, 'matRunAt', 'matRunCount') > 0,
    arena: arenaOpen && matchesLeft(player) > 0,
    more:
      claimableRanks(player?.highestRank ?? 0, player?.claimedRanks ?? []).length > 0 ||
      discountAvailable(player) ||
      runsLeft(player, DUNGEON_RUNS, 'dunRunAt', 'dunRunCount') > 0,
  }

  const tabs = [
    { to: '/', label: 'หน้าหลัก', mark: '🏠' },
    { to: '/stages', label: 'ผจญภัย', mark: '🗺️', dot: dots.stages },
    { to: '/team', label: 'จัดทีม', mark: '👥' },
    { to: '/arena', label: 'ประลอง', mark: '⚡', dot: dots.arena, locked: !arenaOpen },
  ]

  return (
    <>
      {open && (
        <div className="nav-sheet" role="dialog" onClick={() => setOpen(false)}>
          <section className="nav-panel" onClick={(e) => e.stopPropagation()}>
            {GROUPS.map((g) => (
              <div className="nav-group" key={g.name}>
                <h3>{g.name}</h3>
                <div className="nav-grid">
                  {g.items.map((it) => (
                    <Link
                      key={it.to}
                      to={it.to}
                      className="nav-item"
                      onClick={() => setOpen(false)}
                    >
                      <span className="nav-item-mark">{it.mark}</span>
                      <span>{it.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="nav-foot">
              <button className="plain-link inline" onClick={() => setOpen(false)}>
                ปิด
              </button>
              <button className="plain-link inline logout" onClick={signOut}>
                ออกจากระบบ
              </button>
            </div>
          </section>
        </div>
      )}

      <nav className="bottom-nav">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="nav-tab"
            data-active={pathname === t.to}
            data-locked={t.locked}
          >
            <span className="nav-mark">
              {t.mark}
              {t.dot && <span className="nav-dot" />}
            </span>
            <span className="nav-label">{t.label}</span>
          </Link>
        ))}
        <button className="nav-tab" data-active={open} onClick={() => setOpen((v) => !v)}>
          <span className="nav-mark">
            ☰{dots.more && <span className="nav-dot" />}
          </span>
          <span className="nav-label">เมนู</span>
        </button>
      </nav>
    </>
  )
}
