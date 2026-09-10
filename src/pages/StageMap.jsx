import { Link, useNavigate } from 'react-router-dom'
import { STAGES, TRAINING, GEM_STAGES, GEM_RUNS_PER_DAY, ENEMIES } from '../data/stages'
import { runsLeft, hoursUntilReset } from '../lib/dayclock'
import TeamStrip from '../components/TeamStrip'
import { ELEMENTS } from '../data/characters'
import { effectiveStats } from '../lib/stats'
import StatPeek from '../components/StatPeek'
import { usePlayer } from '../context/PlayerContext'

export default function StageMap() {
  const { player } = usePlayer()
  const navigate = useNavigate()
  const progress = player.stageProgress ?? {}
  const left = runsLeft(player, GEM_RUNS_PER_DAY)

  // ปลดล็อกด่านถัดไปเมื่อผ่านด่านก่อนหน้า ด่านแรกเปิดเสมอ
  function unlocked(index) {
    if (index === 0) return true
    return (progress[STAGES[index - 1].id] ?? 0) > 0
  }

  return (
    <main className="screen top">
      <div className="sheet">
        <TeamStrip team={player.team} />

        <h1>บทที่ 1 — ชายแดนตะวันออก</h1>
        <p className="meta">ผ่านด่านครั้งแรกได้เพชร 30 เม็ด เล่นซ้ำได้แต่ไม่ได้เพชรอีก</p>

        <div className="stage-list">
          {STAGES.map((stage, i) => {
            const stars = progress[stage.id] ?? 0
            const open = unlocked(i)
            const boss = stage.enemies.some((e) => ENEMIES[e.id]?.boss)

            return (
              <button
                key={stage.id}
                className="stage-row"
                data-locked={!open}
                data-boss={boss}
                disabled={!open}
                onClick={() => navigate(`/battle/${stage.id}`)}
              >
                <span className="stage-id">{stage.id}</span>
                <span className="stage-body">
                  <span className="stage-name">{stage.name}</span>
                  {open ? (
                    <span className="foe-line">
                      {stage.enemies.map((e, n) => {
                        const foe = ENEMIES[e.id]
                        const st = effectiveStats(foe.stats, e.level, 1)
                        return (
                          <span className="foe peek-host" key={n}>
                            {ELEMENTS[foe.element].mark} {foe.name}
                            <StatPeek
                              title={foe.name}
                              subtitle={foe.boss ? 'บอส' : null}
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

        <h2 className="section-title">เหมืองคริสตัล</h2>
        <p className="meta">
          เก็บเพชรได้วันละ {GEM_RUNS_PER_DAY} ครั้ง วันนี้เหลือ {left} ครั้ง
          {left === 0 && ` · รีเซ็ตอีก ${hoursUntilReset()} ชั่วโมง`}
        </p>

        <div className="stage-list">
          {GEM_STAGES.map((g) => {
            const open = (progress[g.requires] ?? 0) > 0
            return (
              <button
                key={g.id}
                className="stage-row"
                data-locked={!open || left === 0}
                data-boss
                disabled={!open || left === 0}
                onClick={() => navigate(`/battle/${g.id}`)}
              >
                <span className="stage-id gem">◆</span>
                <span className="stage-body">
                  <span className="stage-name">{g.name}</span>
                  <span className="meta">
                    {!open
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
            const open = (progress[t.requires] ?? 0) > 0
            return (
              <button
                key={t.id}
                className="stage-row"
                data-locked={!open}
                disabled={!open}
                onClick={() => navigate(`/battle/${t.id}`)}
              >
                <span className="stage-id">exp</span>
                <span className="stage-body">
                  <span className="stage-name">{t.name}</span>
                  <span className="meta">
                    {open ? `ได้ ${t.exp} หน่วยต่อรอบ` : `ผ่านด่าน ${t.requires} เพื่อปลดล็อก`}
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
