import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import { DAMAGE_TIERS, claimKey, tiersEarned, weekEndsAt } from '../data/worldboss'
import { ELEMENTS } from '../data/characters'
import { POOL_MARKS } from '../data/exchange'
import { claimTier, hitsLeft, loadBoss, loadMyDamage, loadRanking } from '../lib/worldboss'
import { hoursUntilReset } from '../lib/dayclock'
import { UNLOCKS, chapterCleared } from '../data/stages'
import Locked from '../components/Locked'
import StageBrief from '../components/StageBrief'
import { displayName } from '../lib/displayname'

const fmt = (n) => Math.round(n).toLocaleString('th-TH')

export default function WorldBoss() {
  const { player } = usePlayer()
  const unlocked = chapterCleared(player.stageProgress, UNLOCKS.worldboss.chapter)

  if (!unlocked) {
    return <Locked mode={UNLOCKS.worldboss} progress={player.stageProgress} />
  }

  return (
    <main className="screen top">
      <div className="top-nav sheet">
        <Link className="plain-link inline" to="/">
          ← หน้าหลัก
        </Link>
      </div>

      {/* บอสโลกสองตัวพร้อมกัน คนละก้อนเลือดคนละโควตาการโจมตี การ์ดแยกกันสนิท */}
      <WorldBossCard slot="current" />
      <WorldBossCard slot="current2" />
    </main>
  )
}

/**
 * การ์ดบอสโลกหนึ่งตัว รับ slot ('current' | 'current2') เป็นตัวกำหนดว่าจะอ่าน/เขียนที่ไหน
 *
 * แยกออกมาจากตัวหน้าเดิมเพื่อให้เพิ่มบอสตัวที่สองได้โดยไม่ต้องเขียนหน้าใหม่ทั้งหน้า
 * ทั้งสองการ์ดเป็นอิสระต่อกันสนิท คนละก้อนเลือด คนละโควตา คนละอันดับตาราง
 */
function WorldBossCard({ slot }) {
  const { user, player, refresh } = usePlayer()
  const navigate = useNavigate()

  const [boss, setBoss] = useState(null)
  const [mine, setMine] = useState(null)
  const [board, setBoard] = useState(null)
  const [busy, setBusy] = useState(null)
  const [brief, setBrief] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadBoss(slot)
      .then(async (b) => {
        setBoss(b)
        setMine(await loadMyDamage(user.uid, slot))
        setBoard(await loadRanking(30, slot))
      })
      .catch((e) => setError(explainError('อ่านข้อมูลบอสไม่สำเร็จ', e)))
  }, [user.uid, slot])

  if (!boss) {
    return (
      <div className="sheet">
        <p className="meta center">{error ?? 'กำลังตามหาบอส'}</p>
        {error && <div className="trace">{error}</div>}
      </div>
    )
  }

  const cfg = slot === 'current2' ? { runField: 'boss2RunAt', claimedField: 'claimedBoss2' } : { runField: 'bossRunAt', claimedField: 'claimedBoss' }
  const left = hitsLeft(player, slot)
  const myTotal = mine?.week === boss.week ? mine.total : 0
  const pct = Math.max(0, Math.round((boss.hp / boss.maxHp) * 100))
  const dead = boss.hp <= 0
  const claimed = player[cfg.claimedField] ?? []
  const earned = tiersEarned(myTotal)

  async function claim(tier) {
    setBusy(tier.id)
    setError(null)
    try {
      await claimTier({ ...player, uid: user.uid }, boss.week, tier.id, myTotal, slot)
      await refresh()
    } catch (err) {
      setError(err.message || 'รับรางวัลไม่สำเร็จ')
    }
    setBusy(null)
  }

  return (
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
      <div className="cp-banner">
        <span className="meta">ดาเมจสูงสุดในหนึ่งครั้ง</span>
        <strong>{fmt(mine?.week === boss.week ? mine.best ?? 0 : 0)}</strong>
      </div>
      <p className="meta tiny">
        โจมตีไปแล้ว {mine?.week === boss.week ? mine.hits ?? 0 : 0} ครั้งในสัปดาห์นี้
      </p>

      {dead ? (
        <p className="meta center locked-note">บอสสัปดาห์นี้ถูกปราบแล้ว รอตัวใหม่สัปดาห์หน้า</p>
      ) : (
        <>
          <button
            className="rune-link block primary"
            disabled={left === 0}
            onClick={() =>
              setBrief({
                id: 'worldboss',
                name: boss.spec.name,
                intro: boss.spec.intro,
                enemies: [{ id: `boss:${boss.spec.id}`, level: 1 }],
              })
            }
          >
            {left === 0 ? `ครบโควตาวันนี้ · รีเซ็ตอีก ${hoursUntilReset()} ชั่วโมง` : 'เข้าโจมตี'}
          </button>
          <p className="meta tiny center">
            วันนี้เหลือ {left} ครั้ง · โควตาแยกจากบอสโลกอีกตัว · ไม่ต้องรอคิว ตีพร้อมกันได้
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
                <button className="rune-link" disabled={busy === t.id} onClick={() => claim(t)}>
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
                <span className="board-name">{displayName(r)}</span>
                <span className="meta">
                  โจมตี {r.hits} ครั้ง · สูงสุด {fmt(r.best ?? 0)}
                </span>
              </span>
              <span className="board-points">{fmt(r.total)}</span>
            </div>
          ))}
      </div>

      {brief && (
        <StageBrief
          stage={brief}
          onStart={() => navigate('/boss/fight', { state: { week: boss.week, slot } })}
          onClose={() => setBrief(null)}
        />
      )}
    </div>
  )
}
