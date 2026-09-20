import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import {
  DAILY_QUESTS,
  PERMANENT_QUESTS,
  WEEKLY_QUESTS,
  dailyQuestMailId,
  weeklyQuestMailId,
} from '../data/quests'
import { claimDailyQuest, claimPermanentQuest, claimWeeklyQuest, loadMail } from '../lib/mail'
import { todayKey, hoursUntilReset } from '../lib/dayclock'
import { weekIndex, weekEndsAt } from '../data/worldboss'

/** วันเวลาที่เหลือถึงสัปดาห์หน้า ใช้เลขเดียวกับที่บอสโลก/ศึกชิงธงใช้รีเซ็ต */
function daysUntilWeekReset() {
  const ms = weekEndsAt(weekIndex()) - new Date()
  return Math.max(1, Math.ceil(ms / 86400000))
}

/** การ์ดเควสหนึ่งใบ ใช้ร่วมกันทั้งรายวันและรายสัปดาห์ */
function QuestCard({ q, progress, claimedMail, busy, onClaim }) {
  const done = progress >= q.target
  const pct = Math.min(100, Math.round((progress / q.target) * 100))

  return (
    <div className="card quest-card" data-done={done}>
      <div className="card-body">
        <h3>{q.name}</h3>
        <p className="meta tiny">
          {Math.min(progress, q.target)}/{q.target} ครั้ง · ◆ {q.gems.toLocaleString('th-TH')}
        </p>
        <div className="bar thin wide">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="card-actions">
        {claimedMail ? (
          <span className="meta tiny">รับแล้ว</span>
        ) : (
          <button
            className="rune-link"
            disabled={!done || busy === q.id}
            onClick={() => onClaim(q)}
          >
            รับ
          </button>
        )}
      </div>
    </div>
  )
}

export default function Quests() {
  const { user, player, refresh } = usePlayer()
  const [mails, setMails] = useState(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [got, setGot] = useState(null)

  useEffect(() => {
    loadMail(user.uid)
      .then(setMails)
      .catch((e) => setError(explainError('อ่านสถานะเควสไม่สำเร็จ', e)))
  }, [user.uid])

  const day = todayKey()
  const week = weekIndex()
  const mailIds = new Set((mails ?? []).map((m) => m.id))

  async function claim(id, run, q) {
    setBusy(id)
    setError(null)
    setGot(null)
    try {
      await run()
      setGot(q)
      setMails(await loadMail(user.uid))
      await refresh()
    } catch (err) {
      setError(err.message || 'รับรางวัลไม่สำเร็จ')
    }
    setBusy(null)
  }

  return (
    <main className="screen top">
      <div className="sheet">
        <div className="top-nav">
          <Link className="plain-link inline" to="/">
            ← หน้าหลัก
          </Link>
          <Link className="plain-link inline" to="/mail">
            กล่องจดหมาย
          </Link>
        </div>

        <h1>เควส</h1>
        <p className="meta">ทำภารกิจให้ครบเป้า แล้วกดรับ รางวัลจะส่งเข้ากล่องจดหมายให้เปิดอีกที</p>

        {error && <div className="trace">{error}</div>}
        {got && (
          <p className="levelup center">
            ส่งรางวัลเข้ากล่องจดหมายแล้ว{got.title ? ` · ปลดล็อกฉายา "${got.title}"` : ''}
          </p>
        )}

        <div className="roster-head">
          <h2 className="section-title flush">รายวัน</h2>
          <span className="meta tiny">รีเซ็ตอีก {hoursUntilReset()} ชั่วโมง</span>
        </div>
        <div className="quest-list">
          {DAILY_QUESTS.map((q) => (
            <QuestCard
              key={q.id}
              q={q}
              progress={player[q.countField] ?? 0}
              claimedMail={mailIds.has(dailyQuestMailId(q.id, day))}
              busy={busy}
              onClaim={(quest) =>
                claim(quest.id, () => claimDailyQuest(player, quest.id), quest)
              }
            />
          ))}
        </div>

        <div className="roster-head">
          <h2 className="section-title flush">รายสัปดาห์</h2>
          <span className="meta tiny">รีเซ็ตอีก {daysUntilWeekReset()} วัน</span>
        </div>
        <div className="quest-list">
          {WEEKLY_QUESTS.map((q) => (
            <QuestCard
              key={q.id}
              q={q}
              progress={player[q.countField] ?? 0}
              claimedMail={mailIds.has(weeklyQuestMailId(q.id, week))}
              busy={busy}
              onClaim={(quest) =>
                claim(quest.id, () => claimWeeklyQuest(player, quest.id), quest)
              }
            />
          ))}
        </div>

        <h2 className="section-title">ถาวร</h2>
        <p className="meta tiny">ผูกกับเลเวลผู้เล่น ทำครั้งเดียวจบ ได้ทั้งเพชรและฉายาประจำเลเวลนั้น</p>
        <div className="quest-list">
          {PERMANENT_QUESTS.map((q) => {
            const claimedTitle = (player.levelTitles ?? []).includes(q.level)
            const progress = player.playerLevel ?? 1
            const done = progress >= q.level
            const pct = Math.min(100, Math.round((progress / q.level) * 100))
            return (
              <div className="card quest-card" data-done={done} key={q.level}>
                <div className="card-body">
                  <h3>
                    เลเวล {q.level} <span className="chip gold">{q.title}</span>
                  </h3>
                  <p className="meta tiny">
                    เลเวลผู้เล่น {Math.min(progress, q.level)}/{q.level} · ◆{' '}
                    {q.gems.toLocaleString('th-TH')}
                  </p>
                  <div className="bar thin wide">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="card-actions">
                  {claimedTitle ? (
                    <span className="meta tiny">รับแล้ว</span>
                  ) : (
                    <button
                      className="rune-link"
                      disabled={!done || busy === `perm-${q.level}`}
                      onClick={() =>
                        claim(`perm-${q.level}`, () => claimPermanentQuest(player, q.level), q)
                      }
                    >
                      รับ
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
