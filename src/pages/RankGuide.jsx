import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import {
  DIVISION_SIZE,
  RANKS,
  TITLES,
  claimableRanks,
  rankLabel,
  rankOf,
  rewardFor,
} from '../data/ranks'
import { POOL_MARKS, POOL_NAMES } from '../data/exchange'
import { SEASON_DAYS, daysLeft, seasonIndex, seasonRewardFor } from '../data/season'
import { claimRankReward } from '../lib/rankrewards'

export default function RankGuide() {
  const { user, player, refresh } = usePlayer()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [got, setGot] = useState(null)

  const points = player.pvpPoints ?? 0
  const highest = player.highestRank ?? 0
  const claimed = player.claimedRanks ?? []
  const pending = claimableRanks(highest, claimed)
  const current = rankOf(points)

  async function claim(index) {
    setBusy(index)
    setError(null)
    setGot(null)
    try {
      const r = await claimRankReward({ ...player, uid: user.uid }, index)
      setGot({ index, ...r })
      await refresh()
    } catch (err) {
      setError(err.message || 'รับรางวัลไม่สำเร็จ')
    }
    setBusy(null)
  }

  return (
    <main className="screen top">
      <div className="sheet">
        <h1>แรงค์และรางวัล</h1>
        <p className="meta">
          ตอนนี้คุณอยู่ {current.mark} {rankLabel(points)} · สูงสุดที่เคยไปถึงคือ{' '}
          {RANKS[highest].name}
        </p>

        {pending.length > 0 && (
          <p className="levelup">มีรางวัลรอรับอยู่ {pending.length} ขั้น</p>
        )}
        {error && <div className="trace">{error}</div>}
        {got && (
          <p className="levelup center">
            ได้เพชร {got.gems.toLocaleString('th-TH')} เม็ด
            {Object.entries(got.pool).map(([r, n]) => ` · ${POOL_NAMES[r]} ${n}`)}
          </p>
        )}

        <div className="rank-list">
          {RANKS.map((r) => {
            const reward = rewardFor(r.index)
            const reached = highest >= r.index
            const isNow = current.index === r.index
            const done = claimed.includes(r.index)
            const top = r.index === RANKS.length - 1

            return (
              <article className="rank-row" key={r.index} data-now={isNow} data-locked={!reached}>
                <header className="rank-head">
                  <span className="rank-mark">{r.mark}</span>
                  <div className="rank-title">
                    <h3>{r.name}</h3>
                    <p className="meta">
                      {top ? `${r.min.toLocaleString('th-TH')} แต้มขึ้นไป` : `${r.min.toLocaleString('th-TH')}–${(r.min + DIVISION_SIZE * 5 - 1).toLocaleString('th-TH')} แต้ม`}
                      {!top && ` · ดิวิชัน 5 ถึง 1`}
                    </p>
                  </div>
                  {isNow && <span className="chip good">อยู่ตรงนี้</span>}
                </header>

                <dl className="ledger rank-ledger">
                  <div className="ledger-row">
                    <dt>ชนะได้ / แพ้เสีย</dt>
                    <dd>
                      +{r.gain} / −{r.loss}
                    </dd>
                  </div>
                  <div className="ledger-row">
                    <dt>ฉายาที่ปลดล็อก</dt>
                    <dd>{TITLES.find((t) => t.requires === r.index)?.name ?? '—'}</dd>
                  </div>
                  <div className="ledger-row">
                    <dt>รางวัลปลายฤดูกาล</dt>
                    <dd>
                      ◆ {seasonRewardFor(r.index).gems.toLocaleString('th-TH')}
                      {Object.entries(seasonRewardFor(r.index).pool).map(([k, n]) => (
                        <span key={k}> · {POOL_MARKS[k]} {n}</span>
                      ))}
                    </dd>
                  </div>
                  <div className="ledger-row">
                    <dt>รางวัลครั้งแรกที่ไปถึง</dt>
                    <dd>
                      {reward ? (
                        <>
                          ◆ {reward.gems.toLocaleString('th-TH')}
                          {Object.entries(reward.pool).map(([k, n]) => (
                            <span key={k}> · {POOL_MARKS[k]} {n}</span>
                          ))}
                        </>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                </dl>

                {reward &&
                  (done ? (
                    <p className="meta tiny">รับรางวัลไปแล้ว</p>
                  ) : reached ? (
                    <button
                      className="rune-link block primary"
                      disabled={busy === r.index}
                      onClick={() => claim(r.index)}
                    >
                      รับรางวัล
                    </button>
                  ) : (
                    <p className="meta tiny">ไต่ถึงแรงค์นี้เพื่อรับรางวัล</p>
                  ))}
              </article>
            )
          })}
        </div>

        <p className="meta">
          ฤดูกาลที่ {seasonIndex()} · เหลืออีก {daysLeft()} วันจาก {SEASON_DAYS} ·
          จบแล้วแต้มจะเหลือ 45% ของเดิม และรางวัลปลายฤดูกาลส่งเข้ากล่องจดหมายตามแรงค์สูงสุดที่ไปถึง
        </p>

        <p className="meta tiny">
          แต่ละแรงค์มีพื้นกันตก ร่วงต่ำกว่าพื้นของแรงค์ตัวเองไม่ได้
          และชนะคนแรงค์สูงกว่าได้แต้มเพิ่มขั้นละ 5
        </p>

        <div className="gate">
          <Link className="rune-link" to="/arena">
            กลับไปประลอง
          </Link>
          <Link className="rune-link" to="/">
            หน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  )
}
