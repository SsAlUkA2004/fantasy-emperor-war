import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import {
  DAMAGE_TIERS,
  HITS_PER_DAY,
  claimKey,
  tiersEarned,
  weekEndsAt,
} from '../data/worldboss'
import { ELEMENTS } from '../data/characters'
import { POOL_MARKS } from '../data/exchange'
import { claimTier, hitsLeft, loadBoss, loadMyDamage, loadRanking } from '../lib/worldboss'
import { hoursUntilReset } from '../lib/dayclock'
import { UNLOCKS, chapterCleared } from '../data/stages'
import Locked from '../components/Locked'

const fmt = (n) => Math.round(n).toLocaleString('th-TH')

export default function WorldBoss() {
  const { user, player, refresh } = usePlayer()
  const navigate = useNavigate()

  const [boss, setBoss] = useState(null)
  const [mine, setMine] = useState(null)
  const [board, setBoard] = useState(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const unlocked = chapterCleared(player.stageProgress, UNLOCKS.worldboss.chapter)

  useEffect(() => {
    if (!unlocked) return
    loadBoss()
      .then(async (b) => {
        setBoss(b)
        setMine(await loadMyDamage(user.uid))
        setBoard(await loadRanking(30))
      })
      .catch(() => setError('อ่านข้อมูลบอสไม่สำเร็จ ตรวจว่าอัปโหลดกฎล่าสุดแล้วหรือยัง'))
  }, [user.uid, unlocked])

  if (!unlocked) {
    return <Locked mode={UNLOCKS.worldboss} progress={player.stageProgress} />
  }

  if (!boss) {
    return (
      <main className="screen">
        <div className="stage">
          <p className="meta center">{error ?? 'กำลังตามหาบอส'}</p>
          {error && <div className="trace">{error}</div>}
          <Link className="rune-link block" to="/">
            กลับหน้าหลัก
          </Link>
        </div>
      </main>
    )
  }

  const left = hitsLeft(player)
  const myTotal = mine?.week === boss.week ? mine.total : 0
  const pct = Math.max(0, Math.round((boss.hp / boss.maxHp) * 100))
  const dead = boss.hp <= 0
  const claimed = player.claimedBoss ?? []
  const earned = tiersEarned(myTotal)

  async function claim(tier) {
    setBusy(tier.id)
    setError(null)
    try {
      await claimTier({ ...player, uid: user.uid }, boss.week, tier.id, myTotal)
      await refresh()
    } catch (err) {
      setError(err.message || 'รับรางวัลไม่สำเร็จ')
    }
    setBusy(null)
  }

  return (
    <main className="screen top">
      <div className="sheet">
        <header className="boss-head">
          <span className="boss-mark">{boss.spec.mark}</span>
          <div>
            <h1>{boss.spec.name}</h1>
            <p className="meta">
              ธาตุ{ELEMENTS[boss.spec.element].name} · สัปดาห์ที่ {boss.week}
            </p>
          </div>
        </header>

        <p className="meta">{boss.spec.intro}</p>

        <div className="boss-hp">
          <div className="boss-hp-line">
            <span className="hero-level">{dead ? 'ถูกปราบแล้ว' : `${pct}%`}</span>
            <span className="meta">
              {fmt(Math.max(0, boss.hp))} / {fmt(boss.maxHp)}
            </span>
          </div>
          <div className="bar big">
            <span style={{ width: `${pct}%` }} />
          </div>
          <p className="meta tiny">
            ทุกคนช่วยกันตีก้อนเดียวกัน · โจมตีไปแล้วรวม {fmt(boss.hits ?? 0)} ครั้ง · หมดเวลา{' '}
            {weekEndsAt(boss.week).toLocaleDateString('th-TH')}
          </p>
        </div>

        {error && <div className="trace">{error}</div>}

        <div className="cp-banner">
          <span className="meta">ดาเมจสะสมของคุณ</span>
          <strong>{fmt(myTotal)}</strong>
        </div>

        {dead ? (
          <p className="meta center locked-note">บอสสัปดาห์นี้ถูกปราบแล้ว รอตัวใหม่สัปดาห์หน้า</p>
        ) : (
          <>
            <button
              className="rune-link block primary"
              disabled={left === 0}
              onClick={() => navigate('/boss/fight', { state: { week: boss.week } })}
            >
              {left === 0 ? `ครบโควตาวันนี้ · รีเซ็ตอีก ${hoursUntilReset()} ชั่วโมง` : 'เข้าโจมตี'}
            </button>
            <p className="meta tiny center">
              วันนี้เหลือ {left} จาก {HITS_PER_DAY} ครั้ง · ไม่ต้องรอคิว ตีพร้อมกันได้
            </p>
          </>
        )}

        <h2 className="section-title">รางวัลตามดาเมจสะสม</h2>
        <div className="tier-list">
          {DAMAGE_TIERS.map((t) => {
            const got = earned.some((e) => e.id === t.id)
            const done = claimed.includes(claimKey(boss.week, t.id))
            return (
              <div className="tier-row" key={t.id} data-open={got}>
                <div className="tier-body">
                  <span className="tier-need">{fmt(t.need)} ดาเมจ</span>
                  <span className="meta">
                    ◆ {fmt(t.gems)}
                    {Object.entries(t.pool).map(([k, n]) => (
                      <span key={k}>
                        {' '}
                        · {POOL_MARKS[k]} {n}
                      </span>
                    ))}
                  </span>
                </div>
                {done ? (
                  <span className="meta tiny">รับแล้ว</span>
                ) : got ? (
                  <button
                    className="rune-link"
                    disabled={busy === t.id}
                    onClick={() => claim(t)}
                  >
                    รับ
                  </button>
                ) : (
                  <span className="meta tiny">ยังไม่ถึง</span>
                )}
              </div>
            )
          })}
        </div>

        <h2 className="section-title">อันดับดาเมจ</h2>
        {board === null && <p className="meta">กำลังอ่านอันดับ</p>}
        {board?.length === 0 && <p className="meta">ยังไม่มีใครลงมือ เป็นคนแรกเลยไหม</p>}

        <div className="board">
          {board
            ?.filter((r) => r.week === boss.week)
            .map((r, i) => (
              <div className="board-row" key={r.uid} data-me={r.uid === user.uid}>
                <span className="board-place" data-top={i < 3}>
                  {i + 1}
                </span>
                <span className="board-body">
                  <span className="board-name">{r.username}</span>
                  <span className="meta">โจมตี {r.hits} ครั้ง</span>
                </span>
                <span className="board-points">{fmt(r.total)}</span>
              </div>
            ))}
        </div>

        <div className="gate">
          <Link className="rune-link" to="/">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  )
}
