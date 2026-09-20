import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import { CHARACTERS, ELEMENTS, ROLES } from '../data/characters'
import { UR_BANNER_IDS, UR_RATES, ALL_UR_BANNER_IDS } from '../data/urbanner'
import { PULL_COST, TEN_PULL_COST } from '../lib/gacha'
import { pullUR } from '../lib/urgacha'
import { loadCollection } from '../lib/player'

const RARITY_ORDER = { UR: 0, SSR: 1, SR: 2 }

/**
 * การ์ดตู้ UR — ระดับความหายากสูงสุดของเกม ไม่มีการันตีเลย
 *
 * แยกเป็นคอมโพเนนต์อิสระจากตู้เดิมและตู้ธาตุทั้งหมด ไม่แตะสถานะของตู้อื่นเลย
 * ใช้ราคาสุ่มเดียวกับตู้อื่นแต่ไม่มีส่วนลดวันแรกและไม่มีตัวนับการันตี ตามที่ตั้งใจไว้
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

  async function roll(count) {
    const cost = count === 10 ? TEN_PULL_COST : PULL_COST
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
        ไม่มีตัวนับการันตีใด ๆ แม้แต่ระดับ UR เอง — สุ่มอิสระตามอัตราด้านบนตรง ๆ ทุกครั้ง
      </p>
      <p className="meta tiny">
        ระดับ UR เพดานเลเวลตันที่ 100 และดันไปถึง 125 ได้เมื่อครบห้าดาว สูงกว่าระดับ SSR ทุกด้าน
      </p>

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
              return (
                <span className="pool-chip" key={id} data-owned={mine} data-rarity={rarity}>
                  {mine ? ELEMENTS[c.element].mark : '❔'} {mine ? c.name : '???'}
                  <span className="pool-rarity">{rarity}</span>
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
      </div>
      <p className="meta tiny center">สุ่มสิบครั้งถูกกว่าสุ่มทีละครั้งอยู่ 100 เพชร</p>

      {busy && <p className="meta center">กำลังอัญเชิญ</p>}

      {results && (
        <URPullResult
          results={results}
          count={lastCount}
          gems={player.gems}
          busy={busy}
          onAgain={() => roll(lastCount)}
          onClose={() => setResults(null)}
        />
      )}
    </div>
  )
}

function URPullResult({ results, count, gems, busy, onAgain, onClose }) {
  const sorted = [...results].sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity])
  const best = sorted[0]?.rarity ?? 'SR'
  const tally = results.reduce((acc, r) => {
    acc[r.rarity] = (acc[r.rarity] ?? 0) + 1
    return acc
  }, {})
  const again = count === 10 ? TEN_PULL_COST : PULL_COST

  return (
    <div className="veil" role="dialog" aria-modal="true">
      <section className="panel popup pull-popup" data-best={best}>
        <div className="panel-head">
          {best === 'UR' ? 'ได้ตัวระดับสูงสุด' : best === 'SSR' ? 'ได้ตัวระดับตำนาน' : 'ผลการอัญเชิญ'}
        </div>

        <p className="meta tally">
          {['UR', 'SSR', 'SR'].filter((r) => tally[r]).map((r) => `${r} ${tally[r]} ตัว`).join(' · ')}
        </p>

        <div className="pull-grid">
          {sorted.map((r, i) => {
            const c = CHARACTERS[r.id]
            return (
              <Link
                className="pull-card reveal"
                to={`/hero/${r.id}`}
                data-rarity={r.rarity}
                style={{ animationDelay: `${i * 90}ms` }}
                key={i}
              >
                <span className="pull-mark">{ELEMENTS[c.element].mark}</span>
                <span className="pull-name">{c.name}</span>
                <span className="pull-role">{ROLES[c.role]}</span>
                <span className="pull-tag">{r.isNew ? 'ตัวใหม่' : `ซ้ำ +${r.shards} ชิ้นส่วน`}</span>
              </Link>
            )
          })}
        </div>

        <p className="meta tiny">แตะการ์ดเพื่อดูรายละเอียดตัวละคร</p>

        <button className="rune-link block primary" onClick={onAgain} disabled={busy || gems < again}>
          {gems < again ? 'เพชรไม่พอสุ่มอีก' : `สุ่มอีก ${count} ครั้ง · ${again}`}
        </button>
        <button className="plain-link" onClick={onClose}>
          ปิด
        </button>
      </section>
    </div>
  )
}
