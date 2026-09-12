import { useNavigate, Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { FLOORS, RUNS_PER_DAY, floorStage, ilvlForFloor, isGuardFloor } from '../data/dungeon'
import { ENEMIES } from '../data/stages'
import { ELEMENTS } from '../data/characters'
import { GRADES, SOURCE_RANGE } from '../data/gear'
import { runsLeft, hoursUntilReset } from '../lib/dayclock'
import { stagePower, formatPower } from '../lib/power'

export default function Dungeon() {
  const { player } = usePlayer()
  const navigate = useNavigate()

  const cleared = player.dungeonFloor ?? 0
  const left = runsLeft(player, RUNS_PER_DAY, 'dunRunAt', 'dunRunCount')
  const next = Math.min(FLOORS, cleared + 1)
  const [lo, hi] = SOURCE_RANGE.dungeon

  // แสดงชั้นที่เปิดแล้วย้อนหลังไม่เกินสิบชั้น เพื่อไม่ให้หน้ายาวเกินไป
  const from = Math.max(1, next - 9)
  const floors = Array.from({ length: next - from + 1 }, (_, i) => floorStage(from + i)).reverse()

  return (
    <main className="screen top">
      <div className="sheet">
        <h1>หอคอยดันเจี้ยน</h1>
        <p className="meta">
          ผ่านแล้ว {cleared} จาก {FLOORS} ชั้น · วันนี้เหลือ {left} ครั้ง
          {left === 0 && ` · รีเซ็ตอีก ${hoursUntilReset()} ชั่วโมง`}
        </p>
        <p className="meta tiny">
          ขึ้นได้ทีละชั้น ผ่านชั้นใหม่ครั้งแรกได้อุปกรณ์แน่นอนหนึ่งชิ้น
          เป็นแหล่งเดียวที่ได้ของสี{GRADES[hi].name} (ช่วง {GRADES[lo].name} ถึง {GRADES[hi].name})
        </p>

        {cleared >= FLOORS && (
          <p className="levelup center">พิชิตหอคอยครบทุกชั้นแล้ว</p>
        )}

        <div className="stage-list">
          {floors.map((f) => {
            const done = f.floor <= cleared
            const guard = isGuardFloor(f.floor)
            return (
              <button
                key={f.id}
                className="stage-row"
                data-boss={guard}
                disabled={left === 0}
                onClick={() => navigate(`/battle/${f.id}`)}
              >
                <span className="stage-id">{f.floor}</span>
                <span className="stage-body">
                  <span className="stage-name">{f.name}</span>
                  <span className="foe-line">
                    {f.enemies.map((e, i) => (
                      <span className="foe" key={i}>
                        {ELEMENTS[ENEMIES[e.id].element].mark} {ENEMIES[e.id].name}
                      </span>
                    ))}
                  </span>
                  <span className="meta tiny">
                    ระดับไอเทมที่ดรอป {ilvlForFloor(f.floor)} · เหรียญ {f.coins} · exp {f.exp}
                  </span>
                </span>
                <span className="stage-right">
                  <span className="power-num">⚔ {formatPower(stagePower(f))}</span>
                  <span className="power-label">{done ? 'ผ่านแล้ว' : 'ชั้นใหม่'}</span>
                </span>
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
