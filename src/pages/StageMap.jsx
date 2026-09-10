import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CHAPTERS,
  STAGES,
  TRAINING,
  GEM_STAGES,
  GEM_RUNS_PER_DAY,
  ENEMIES,
} from '../data/stages'
import { ELEMENTS } from '../data/characters'
import { effectiveStats } from '../lib/stats'
import { runsLeft, hoursUntilReset } from '../lib/dayclock'
import { usePlayer } from '../context/PlayerContext'
import StatPeek from '../components/StatPeek'
import TeamStrip from '../components/TeamStrip'

export default function StageMap() {
  const { player } = usePlayer()
  const navigate = useNavigate()
  const progress = player.stageProgress ?? {}
  const left = runsLeft(player, GEM_RUNS_PER_DAY)

  const cleared = (id) => (progress[id] ?? 0) > 0

  // บทถัดไปเปิดเมื่อผ่านด่านสุดท้ายของบทก่อนหน้า
  function chapterOpen(number) {
    if (number === 1) return true
    const prev = CHAPTERS[number - 2]
    return cleared(prev.stages[prev.stages.length - 1].id)
  }

  // เปิดที่บทล่าสุดที่เล่นได้ ไม่ใช่บทที่ 1 เสมอ
  const latest = CHAPTERS.filter((c) => chapterOpen(c.number)).pop()?.number ?? 1
  const [view, setView] = useState(latest)
  const chapter = CHAPTERS[view - 1]
  const open = chapterOpen(view)

  // ด่านเปิดเมื่อผ่านด่านก่อนหน้าในลำดับรวมทั้งเกม
  function stageOpen(stageId) {
    const index = STAGES.findIndex((s) => s.id === stageId)
    if (index === 0) return true
    return cleared(STAGES[index - 1].id)
  }

  const done = chapter.stages.filter((s) => cleared(s.id)).length

  return (
    <main className="screen top">
      <div className="sheet">
        <TeamStrip team={player.team} />

        <div className="chapter-bar">
          <button
            className="arrow"
            onClick={() => setView((v) => v - 1)}
            disabled={view === 1}
            aria-label="บทก่อนหน้า"
          >
            ‹
          </button>

          <div className="chapter-title">
            <span className="meta tiny">บทที่ {chapter.number}</span>
            <h1>{chapter.name}</h1>
            <p className="meta">{open ? `${chapter.subtitle} · ผ่านแล้ว ${done}/6` : 'ยังไม่ปลดล็อก'}</p>
          </div>

          <button
            className="arrow"
            onClick={() => setView((v) => v + 1)}
            disabled={view === CHAPTERS.length}
            aria-label="บทถัดไป"
          >
            ›
          </button>
        </div>

        <div className="chapter-dots">
          {CHAPTERS.map((c) => (
            <button
              key={c.number}
              className="dot"
              data-active={c.number === view}
              data-locked={!chapterOpen(c.number)}
              onClick={() => setView(c.number)}
              aria-label={`บทที่ ${c.number}`}
            />
          ))}
        </div>

        {!open ? (
          <p className="meta center locked-note">
            ผ่านด่านสุดท้ายของบทที่ {view - 1} เพื่อเปิดบทนี้
          </p>
        ) : (
          <div className="stage-list">
            {chapter.stages.map((stage) => {
              const stars = progress[stage.id] ?? 0
              const unlocked = stageOpen(stage.id)
              const boss = stage.enemies.some((x) => ENEMIES[x.id]?.boss)

              return (
                <button
                  key={stage.id}
                  className="stage-row"
                  data-locked={!unlocked}
                  data-boss={boss}
                  disabled={!unlocked}
                  onClick={() => navigate(`/battle/${stage.id}`)}
                >
                  <span className="stage-id">{stage.id}</span>
                  <span className="stage-body">
                    <span className="stage-name">{stage.name}</span>
                    {unlocked ? (
                      <span className="foe-line">
                        {stage.enemies.map((x, n) => {
                          const foe = ENEMIES[x.id]
                          const st = effectiveStats(foe.stats, x.level, 1)
                          return (
                            <span className="foe peek-host" key={n}>
                              {ELEMENTS[foe.element].mark} {foe.name}
                              <StatPeek
                                title={foe.name}
                                subtitle={foe.boss ? 'บอส' : `เลเวล ${x.level}`}
                                element={foe.element}
                                stats={[
                                  ['พลังชีวิต', st.hp],
                                  ['โจมตี', st.atk],
                                  ['ป้องกัน', st.def],
                                  ['ความเร็ว', st.spd],
                                ]}
                                note={foe.skill ? `มีสกิล ${foe.skill.name}` : null}
                              />
                            </span>
                          )
                        })}
                      </span>
                    ) : (
                      <span className="meta">ผ่านด่านก่อนหน้าเพื่อปลดล็อก</span>
                    )}
                  </span>
                  <span className="stage-stars">{stars ? '★'.repeat(stars) : ''}</span>
                </button>
              )
            })}
          </div>
        )}

        <h2 className="section-title">เหมืองคริสตัล</h2>
        <p className="meta">
          ทุกเหมืองใช้โควตารวมกันวันละ {GEM_RUNS_PER_DAY} ครั้ง วันนี้เหลือ {left} ครั้ง
          {left === 0 && ` · รีเซ็ตอีก ${hoursUntilReset()} ชั่วโมง`}
        </p>

        <div className="stage-list">
          {GEM_STAGES.map((g) => {
            const unlocked = cleared(g.requires)
            return (
              <button
                key={g.id}
                className="stage-row"
                data-locked={!unlocked || left === 0}
                disabled={!unlocked || left === 0}
                onClick={() => navigate(`/battle/${g.id}`)}
              >
                <span className="stage-id gem">◆</span>
                <span className="stage-body">
                  <span className="stage-name">{g.name}</span>
                  <span className="meta">
                    {!unlocked
                      ? `ผ่านด่าน ${g.requires} เพื่อปลดล็อก`
                      : left === 0
                        ? 'ครบโควตาวันนี้แล้ว'
                        : `ได้ ${g.gems} เพชร และ ${g.exp} exp ต่อรอบ`}
                  </span>
                </span>
                <span className="stage-stars" />
              </button>
            )
          })}
        </div>

        <h2 className="section-title">ลานฝึก</h2>
        <p className="meta">เล่นซ้ำได้ไม่จำกัด ได้ค่าประสบการณ์อย่างเดียว ไม่มีเพชรและไม่มีดาว</p>

        <div className="stage-list">
          {TRAINING.map((t) => {
            const unlocked = cleared(t.requires)
            return (
              <button
                key={t.id}
                className="stage-row"
                data-locked={!unlocked}
                disabled={!unlocked}
                onClick={() => navigate(`/battle/${t.id}`)}
              >
                <span className="stage-id">exp</span>
                <span className="stage-body">
                  <span className="stage-name">{t.name}</span>
                  <span className="meta">
                    {unlocked ? `ได้ ${t.exp} หน่วยต่อรอบ` : `ผ่านด่าน ${t.requires} เพื่อปลดล็อก`}
                  </span>
                </span>
                <span className="stage-stars" />
              </button>
            )
          })}
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
