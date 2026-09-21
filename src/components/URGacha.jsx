import { useEffect, useState } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import { CHARACTERS, ELEMENTS } from '../data/characters'
import { UR_BANNER_IDS, UR_RATES, ALL_UR_BANNER_IDS } from '../data/urbanner'
import { PULL_COST, TEN_PULL_COST } from '../lib/gacha'
import { UR_HARD_PITY, FIFTY_PULL_COST, isURRetired, pullUR } from '../lib/urgacha'
import { loadCollection } from '../lib/player'
import PullResult from './PullResult'

function costFor(count) {
  return count === 50 ? FIFTY_PULL_COST : count === 10 ? TEN_PULL_COST : PULL_COST
}

/**
 * การ์ดตู้ UR — ระดับความหายากสูงสุดของเกม
 *
 * แยกเป็นคอมโพเนนต์อิสระจากตู้เดิมและตู้ธาตุทั้งหมด ไม่แตะสถานะของตู้อื่นเลย
 * ใช้ราคาสุ่มเดียวกับตู้อื่นแต่ไม่มีส่วนลดวันแรก มีการันตีสองชั้น (ดู lib/urgacha.js):
 * สุ่มครบ 400 ครั้งการันตี UR แน่นอน และตัวละคร UR ตัวไหนเก็บครบแล้วจะไม่ออกซ้ำอีก
 */
export default function URGacha() {
  const { user, player, refresh } = usePlayer()
  const [owned, setOwned] = useState(null)
  const [showPool, setShowPool] = useState(false)
  const [results, setResults] = useState(null)
  const [lastCount, setLastCount] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadCollection(user.uid).then(setOwned)
  }, [user.uid])

  const hasChar = (id) => owned?.some((o) => o.id === id) ?? false
  const sinceUR = player.urPitySinceUR ?? 0
  const copyCount = player.urCopyCount ?? {}

  async function roll(count) {
    const cost = costFor(count)
    if (player.gems < cost) {
      setError('เพชรไม่พอ ไปเก็บจากด่านที่ยังไม่เคยผ่านก่อน')
      return
    }

    setBusy(true)
    setError(null)
    setResults(null)
    setLastCount(count)
    try {
      const r = await pullUR({ ...player, uid: user.uid }, count)
      setResults(r.summary)
      await refresh()
      loadCollection(user.uid).then(setOwned)
    } catch (err) {
      setError(err.message === 'เพชรไม่พอ' ? err.message : explainError('สุ่มไม่สำเร็จ', err))
    }
    setBusy(false)
  }

  return (
    <div className="sheet">
      <header className="lobby-head">
        <div>
          <h1>👑 ตู้ UR</h1>
          <p className="meta">
            โอกาสออกในตู้นี้ · SR {(UR_RATES.SR * 100).toFixed(0)}% · SSR{' '}
            {(UR_RATES.SSR * 100).toFixed(2)}% · UR {(UR_RATES.UR * 100).toFixed(2)}%
          </p>
        </div>
        <div className="purse">
          <span className="gem">◆</span>
          {player.gems.toLocaleString('th-TH')}
        </div>
      </header>

      <p className="meta">
        ตู้ใหม่ที่มีระดับความหายากสูงสุดของเกม (UR) ตัวละครในตู้นี้ทั้งสิบเอ็ดตัวเป็นตัวใหม่ทั้งหมด
        สุ่มอิสระตามอัตราด้านบน แต่การันตี UR แน่นอนถ้าสุ่มครบ {UR_HARD_PITY} ครั้งโดยไม่เคยได้เลย
      </p>
      <p className="meta tiny">
        ระดับ UR เพดานเลเวลตันที่ 100 และดันไปถึง 125 ได้เมื่อครบห้าดาว สูงกว่าระดับ SSR ทุกด้าน
        ตัวไหนเก็บชิ้นส่วนพอหลอมครบห้าดาวแล้วจะไม่ออกซ้ำอีก เปิดทางให้ตัวอื่นออกแทน
      </p>

      <section className="pity">
        <div className="pity-row">
          <span className="meta">อีก {Math.max(0, UR_HARD_PITY - sinceUR)} ครั้งได้ UR การันตีแน่นอน</span>
          <div className="bar thin wide">
            <span style={{ width: `${(sinceUR / UR_HARD_PITY) * 100}%` }} />
          </div>
        </div>
      </section>

      <div className="roster-head">
        <span className="meta">
          ในตู้นี้คุณมีแล้ว {ALL_UR_BANNER_IDS.filter((id) => hasChar(id)).length} จาก{' '}
          {ALL_UR_BANNER_IDS.length} ตัว
        </span>
        <button className="plain-link inline" onClick={() => setShowPool((v) => !v)}>
          {showPool ? 'ซ่อนรายชื่อ' : 'ดูรายชื่อในตู้'}
        </button>
      </div>

      {showPool && (
        <div className="pool-grid">
          {['UR', 'SSR', 'SR'].flatMap((rarity) =>
            UR_BANNER_IDS[rarity].map((id) => {
              const c = CHARACTERS[id]
              const mine = hasChar(id)
              const retired = rarity === 'UR' && isURRetired(copyCount[id] ?? 0)
              return (
                <span className="pool-chip" key={id} data-owned={mine} data-rarity={rarity}>
                  {mine ? ELEMENTS[c.element].mark : '❔'} {mine ? c.name : '???'}
                  <span className="pool-rarity">{rarity}</span>
                  {retired && <span className="pool-rarity">เก็บครบ · ไม่ออกซ้ำ</span>}
                </span>
              )
            })
          )}
        </div>
      )}

      {error && <div className="trace">{error}</div>}

      <div className="pull-row">
        <button className="rune-link" disabled={busy} onClick={() => roll(1)}>
          สุ่ม 1 ครั้ง · {PULL_COST}
        </button>
        <button className="rune-link" disabled={busy} onClick={() => roll(10)}>
          สุ่ม 10 ครั้ง · {TEN_PULL_COST}
        </button>
        <button className="rune-link" disabled={busy} onClick={() => roll(50)}>
          สุ่ม 50 ครั้ง · {FIFTY_PULL_COST}
        </button>
      </div>
      <p className="meta tiny center">
        สุ่มสิบครั้งถูกกว่าสุ่มทีละครั้งอยู่ 100 เพชร · สุ่มห้าสิบครั้งถูกกว่าอยู่ 500 เพชร
      </p>

      {busy && <p className="meta center">กำลังอัญเชิญ</p>}

      {results && (
        <PullResult
          results={results}
          count={lastCount}
          again={costFor(lastCount)}
          gems={player.gems}
          busy={busy}
          onAgain={() => roll(lastCount)}
          onClose={() => setResults(null)}
        />
      )}
    </div>
  )
}
