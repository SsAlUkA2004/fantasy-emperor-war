import { Link, useNavigate } from 'react-router-dom'
import { STAGES, ENEMIES } from '../data/stages'
import { ELEMENTS } from '../data/characters'
import { usePlayer } from '../context/PlayerContext'

export default function StageMap() {
  const { player } = usePlayer()
  const navigate = useNavigate()
  const progress = player.stageProgress ?? {}

  // ปลดล็อกด่านถัดไปเมื่อผ่านด่านก่อนหน้า ด่านแรกเปิดเสมอ
  function unlocked(index) {
    if (index === 0) return true
    return (progress[STAGES[index - 1].id] ?? 0) > 0
  }

  return (
    <main className="screen top">
      <div className="sheet">
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
                        return (
                          <span className="foe" key={n}>
                            {ELEMENTS[foe.element].mark} {foe.name}
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

        <div className="gate">
          <Link className="rune-link" to="/">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  )
}
