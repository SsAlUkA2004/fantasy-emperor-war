import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import {
  RAID_TIERS,
  RUNS_PER_BOSS,
  furthestChapter,
  hourIndex,
  ilvlForChapter,
  meetsRequirement,
  minutesLeft,
  raidBossStage,
} from '../data/raiddungeon'
import { runsLeftFor, totalRunsLeftForTier } from '../lib/raiddungeon'
import { ENEMIES } from '../data/stages'
import { ELEMENTS } from '../data/characters'
import { GRADES } from '../data/gear'
import { loadCollection } from '../lib/player'
import StageBrief from '../components/StageBrief'

export default function RaidDungeon() {
  const { user, player } = usePlayer()
  const navigate = useNavigate()
  const [owned, setOwned] = useState(null)
  const [hour, setHour] = useState(hourIndex())
  const [brief, setBrief] = useState(null)

  useEffect(() => {
    loadCollection(user.uid).then(setOwned)
  }, [user.uid])

  // ข้ามชั่วโมงแล้วรีเฟรชโควตาเอง ไม่ต้องให้ผู้เล่นกดโหลดใหม่
  useEffect(() => {
    const t = setInterval(() => setHour(hourIndex()), 30000)
    return () => clearInterval(t)
  }, [])

  const chapter = furthestChapter(player.stageProgress)
  const ilvl = ilvlForChapter(chapter)

  return (
    <main className="screen top">
      <div className="sheet">
        <div className="top-nav">
          <Link className="plain-link inline" to="/">
            ← หน้าหลัก
          </Link>
        </div>

        <h1>ดันเจี้ยนเหรด</h1>
        <p className="meta">
          เก้าผู้เฝ้าคลัง สามระดับความยาก · ตีได้ตัวละ {RUNS_PER_BOSS} ครั้งต่อชั่วโมง · รอบนี้เหลืออีก{' '}
          {minutesLeft(hour)} นาที
        </p>
        <p className="meta tiny">
          ระดับไอเทมของที่ดรอปยึดตามบทไกลสุดที่ผ่านมาแล้ว ตอนนี้ระดับไอเทม {ilvl}
          {chapter > 0 ? ` (ผ่านบทที่ ${chapter} แล้ว)` : ' (ยังไม่ผ่านบทแรกครบ)'}
        </p>

        {RAID_TIERS.map((tier) => {
          const [lo, hi] = tier.gradeRange
          const unlocked = owned ? meetsRequirement(owned, tier.need) : false
          const left = totalRunsLeftForTier(player, tier, hour)

          return (
            <section className="pity" key={tier.id}>
              <h2 className="section-title">ระดับ{tier.name}</h2>
              <p className="meta tiny">
                ดรอปของสี{GRADES[lo].name}ถึง{GRADES[hi].name} · ต้องมีตัวละครระดับ SSR ขึ้นไปเลเวล{' '}
                {tier.need.level} อย่างน้อย {tier.need.count} ตัวจึงจะเข้าได้ · รวมเหลือ {left} ครั้งในชั่วโมงนี้
              </p>

              {owned && !unlocked && (
                <p className="meta">
                  ยังไม่ปลดล็อก ต้องปั้นตัวละครระดับ SSR ขึ้นไปเลเวล {tier.need.level} ให้ได้{' '}
                  {tier.need.count} ตัวก่อน
                </p>
              )}

              <div className="stage-list">
                {tier.bosses.map((bossId, i) => {
                  const boss = ENEMIES[bossId]
                  const runsLeft = runsLeftFor(player, bossId, hour)
                  const locked = !unlocked || runsLeft === 0
                  return (
                    <button
                      key={bossId}
                      className="stage-row"
                      data-boss="true"
                      data-locked={locked}
                      disabled={locked}
                      onClick={() => setBrief(raidBossStage(tier.id, i))}
                    >
                      <span className="stage-id">{ELEMENTS[boss.element].mark}</span>
                      <span className="stage-body">
                        <span className="stage-name">{boss.name}</span>
                        <span className="meta tiny">
                          เหลือ {runsLeft} จาก {RUNS_PER_BOSS} ครั้ง · เหรียญ{' '}
                          {tier.reward.coins.toLocaleString('th-TH')} · exp{' '}
                          {tier.reward.exp.toLocaleString('th-TH')}
                        </span>
                      </span>
                      <span className="stage-right">
                        {!unlocked ? 'ล็อกอยู่' : runsLeft === 0 ? 'ครบแล้ว' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {brief && (
        <StageBrief
          stage={brief}
          onStart={() => navigate(`/battle/${brief.id}`)}
          onClose={() => setBrief(null)}
        />
      )}
    </main>
  )
}
