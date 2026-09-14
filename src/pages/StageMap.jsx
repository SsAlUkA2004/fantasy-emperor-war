import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CHAPTERS,
  DIFFICULTIES,
  stageAt,
  TARGET_LEVEL,
  STAGES,
  TRAINING,
  GEM_STAGES,
  GEM_RUNS_PER_DAY,
  ENEMIES,
} from '../data/stages'
import { ELEMENTS } from '../data/characters'
import { effectiveStats } from '../lib/stats'
import { stagePower, teamPower, matchup, formatPower, combatPower } from '../lib/power'
import { loadCollection } from '../lib/player'
import { runsLeft, hoursUntilReset } from '../lib/dayclock'
import {
  MATERIAL_STAGES,
  MATERIAL_RUNS_PER_DAY,
  MATERIALS,
  MATERIAL_IDS,
} from '../data/materials'
import { usePlayer } from '../context/PlayerContext'
import StatPeek from '../components/StatPeek'
import TeamStrip from '../components/TeamStrip'
import StageBrief from '../components/StageBrief'

/** ป้ายเทียบพลังทีมกับพลังศัตรูของด่านนั้น */
function PowerTag({ mine, stage, ready }) {
  if (!ready) return null
  const foe = stagePower(stage)
  const m = matchup(mine, foe)

  return (
    <span className="power-tag" data-level={m.level}>
      <span className="power-num">⚔ {formatPower(foe)}</span>
      <span className="power-label">{m.label}</span>
    </span>
  )
}

export default function StageMap() {
  const { user, player } = usePlayer()
  const [roster, setRoster] = useState(null)
  const [brief, setBrief] = useState(null)
  const [diff, setDiff] = useState('normal')

  useEffect(() => {
    loadCollection(user.uid).then(setRoster)
  }, [user.uid])

  // ค่าพลังของทีมที่จัดไว้ ใช้เทียบกับพลังศัตรูของแต่ละด่าน
  const myPower = roster
    ? teamPower(
        (player.team ?? []).map((id) => roster.find((o) => o.id === id)).filter(Boolean)
      )
    : 0
  const navigate = useNavigate()
  const progress = player.stageProgress ?? {}
  const left = runsLeft(player, GEM_RUNS_PER_DAY)
  const matLeft = runsLeft(player, MATERIAL_RUNS_PER_DAY, 'matRunAt', 'matRunCount')

  const cleared = (id) => (progress[id] ?? 0) > 0
  const suffix = DIFFICULTIES.find((d) => d.id === diff)?.suffix ?? ''

  /**
   * โหมดถัดไปเปิดเมื่อผ่านด่านสุดท้ายของโหมดก่อนหน้าแล้ว ไม่ใช่ทีละบท
   * เพราะแต่ละโหมดต้องไต่ใหม่ตั้งแต่บทที่ 1 เหมือนเริ่มเกมรอบใหม่
   */
  const lastId = STAGES[STAGES.length - 1].id

  function diffOpen(id) {
    if (id === 'normal') return true
    if (id === 'hard') return cleared(lastId)
    return cleared(`${lastId}@hard`)
  }

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

  /**
   * ด่านเปิดเมื่อผ่านด่านก่อนหน้าในโหมดเดียวกัน
   *
   * เดิมเช็คจากรหัสด่านพื้นฐานอย่างเดียว ผลคือพอผ่านโหมดปกติครบ
   * โหมดยากเปิดหมดทุกด่านพร้อมกัน ไม่ต้องไต่ใหม่เลย
   */
  function stageOpen(baseId, difficultyId) {
    const index = STAGES.findIndex((s) => s.id === baseId)
    if (index < 0) return false
    if (index === 0) return true
    const prev = STAGES[index - 1].id
    const sfx = DIFFICULTIES.find((d) => d.id === difficultyId)?.suffix ?? ''
    return cleared(prev + sfx)
  }

  const done = chapter.stages.filter((s) => cleared(s.id)).length

  return (
    <main className="screen top">
      <div className="sheet">
        <div className="top-nav">
          <Link className="plain-link inline" to="/">
            ← หน้าหลัก
          </Link>
        </div>

        <TeamStrip team={player.team} power={roster ? myPower : undefined} />

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

        <div className="mode-tabs diff-tabs">
          {DIFFICULTIES.map((d) => {
            const ok = diffOpen(d.id)
            return (
              <button
                key={d.id}
                className="mode-tab"
                data-active={diff === d.id}
                disabled={!ok}
                onClick={() => setDiff(d.id)}
              >
                {d.name}
                {!ok && <span className="mode-count">ล็อก</span>}
              </button>
            )
          })}
        </div>
        {diff !== 'normal' && (
          <p className="meta tiny">
            โหมดนี้เริ่มไต่ใหม่ตั้งแต่บทที่ 1 และบทแรกของโหมดนี้ยากเท่ากับบทสุดท้ายของโหมดก่อนหน้า ·
            รางวัลคูณ {DIFFICULTIES.find((d) => d.id === diff)?.reward} เท่า ·
            แนะนำทีมเลเวล {TARGET_LEVEL[diff][view - 1]} ขึ้นไปสำหรับบทนี้
          </p>
        )}
        {diff === 'normal' && (
          <p className="meta tiny">แนะนำทีมเลเวล {TARGET_LEVEL.normal[view - 1]} ขึ้นไปสำหรับบทนี้</p>
        )}
        {!diffOpen('hard') && (
          <p className="meta tiny">
            ผ่านด่าน {lastId} ให้จบเพื่อเปิดโหมดยาก · ผ่านโหมดยากจนจบเพื่อเปิดโหมดปีศาจ
          </p>
        )}

        {!open ? (
          <p className="meta center locked-note">
            ผ่านด่านสุดท้ายของบทที่ {view - 1} เพื่อเปิดบทนี้
          </p>
        ) : (
          <div className="stage-list">
            {chapter.stages.map((base) => {
              const stage = stageAt(base.id, diff) ?? base
              const stars = progress[stage.id] ?? 0
              const unlocked = stageOpen(base.id, diff) && diffOpen(diff)
              const boss = stage.enemies.some((x) => ENEMIES[x.id]?.boss)

              return (
                <button
                  key={stage.id}
                  className="stage-row"
                  data-locked={!unlocked}
                  data-boss={boss}
                  disabled={!unlocked}
                  onClick={() => setBrief(stage)}
                >
                  <span className="stage-id">{base.id}</span>
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
                                power={combatPower(st, 1)}
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
                  <span className="stage-right">
                    <PowerTag mine={myPower} stage={stage} ready={Boolean(roster)} />
                    <span className="stage-stars">{stars ? '★'.repeat(stars) : ''}</span>
                  </span>
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
                onClick={() => setBrief(g)}
              >
                <span className="stage-id gem">◆</span>
                <span className="stage-body">
                  <span className="stage-name">{g.name}</span>
                  <span className="meta">
                    {!unlocked
                      ? `ผ่านด่าน ${g.requires} เพื่อปลดล็อก`
                      : left === 0
                        ? 'ครบโควตาวันนี้แล้ว'
                        : `${g.gems} เพชร · ตัวละคร ${g.exp} exp · ผู้เล่น ${g.accountExp.toLocaleString('th-TH')} exp`}
                  </span>
                </span>
                <PowerTag mine={myPower} stage={g} ready={Boolean(roster) && unlocked} />
              </button>
            )
          })}
        </div>

        <h2 className="section-title">ด่านหาของ</h2>
        <p className="meta">
          ใช้โควตารวมกันวันละ {MATERIAL_RUNS_PER_DAY} ครั้ง วันนี้เหลือ {matLeft} ครั้ง
          {matLeft === 0 && ` · รีเซ็ตอีก ${hoursUntilReset()} ชั่วโมง`}
        </p>

        <div className="stage-list">
          {MATERIAL_STAGES.map((m) => {
            const unlocked = cleared(m.requires)
            return (
              <button
                key={m.id}
                className="stage-row"
                data-locked={!unlocked || matLeft === 0}
                disabled={!unlocked || matLeft === 0}
                onClick={() => setBrief(m)}
              >
                <span className="stage-id mat">⛏</span>
                <span className="stage-body">
                  <span className="stage-name">{m.name}</span>
                  <span className="meta">
                    {!unlocked
                      ? `ผ่านด่าน ${m.requires} เพื่อปลดล็อก`
                      : matLeft === 0
                        ? 'ครบโควตาวันนี้แล้ว'
                        : MATERIAL_IDS.filter((id) => m.drops[id] > 0)
                            .map((id) => `${MATERIALS[id].mark} ${m.drops[id]}`)
                            .join(' · ')}
                  </span>
                </span>
                <PowerTag mine={myPower} stage={m} ready={Boolean(roster) && unlocked} />
              </button>
            )
          })}
        </div>

        <h2 className="section-title">ลานฝึก</h2>
        <p className="meta">
          เล่นซ้ำได้ไม่จำกัด ให้ค่าประสบการณ์ตัวละครอย่างเดียว ไม่มีเพชร ไม่มีดาว
          และไม่ขึ้นเลเวลผู้เล่น
        </p>

        <div className="stage-list">
          {TRAINING.map((t) => {
            const unlocked = cleared(t.requires)
            return (
              <button
                key={t.id}
                className="stage-row"
                data-locked={!unlocked}
                disabled={!unlocked}
                onClick={() => setBrief(t)}
              >
                <span className="stage-id">exp</span>
                <span className="stage-body">
                  <span className="stage-name">{t.name}</span>
                  <span className="meta">
                    {unlocked ? `ได้ ${t.exp} หน่วยต่อรอบ` : `ผ่านด่าน ${t.requires} เพื่อปลดล็อก`}
                  </span>
                </span>
                <PowerTag mine={myPower} stage={t} ready={Boolean(roster) && unlocked} />
              </button>
            )
          })}
        </div>
      </div>

      {brief && (
        <StageBrief
          stage={brief}
          onStart={(helper) =>
            navigate(`/battle/${brief.id}`, { state: helper ? { helper } : undefined })
          }
          onClose={() => setBrief(null)}
        />
      )}
    </main>
  )
}
