import { useEffect, useState } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import { CHARACTERS, ELEMENTS } from '../data/characters'
import {
  activeElement,
  elementalHourIndex,
  elementalMinutesLeft,
  elementalPool,
  elementalSchedule,
} from '../data/elemental'
import { PITY_SR, PITY_SSR, PULL_COST, TEN_PULL_COST, effectiveRates } from '../lib/gacha'
import { SHARDS_PER_DUPE } from '../data/exchange'
import {
  elementalDiscountAvailable,
  elementalDiscountedPullCost,
  exchangeElemental,
  pullElemental,
} from '../lib/elementalgacha'
import { loadCollection } from '../lib/player'
import PullResult from './PullResult'

/**
 * การ์ดตู้ธาตุหมุนเวียน — เปิดทีละธาตุ วนตามลำดับเพลิง วารี พายุ ปฐพี แสง มืด ทุกชั่วโมง
 *
 * แยกเป็นคอมโพเนนต์อิสระจากหน้า Gacha หลัก ใช้ตัวนับการันตี ตัวสุ่มส่วนลด และเพชร
 * แยกชุดกันหมด (ยกเว้นกระเป๋าเพชรซึ่งใช้ร่วมกันทั้งเกม) เพื่อไม่ให้ไปยุ่งกับสถานะของตู้เดิม
 */
export default function ElementalGacha() {
  const { user, player, refresh } = usePlayer()
  const [owned, setOwned] = useState(null)
  const [showPool, setShowPool] = useState(false)
  const [results, setResults] = useState(null)
  const [lastCount, setLastCount] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  // ตัวนับไว้บังคับเรนเดอร์ใหม่ทุกนาที ให้นาฬิกาถอยหลังเดินจริง ไม่ใช่ค้างค่าตอนโหลดหน้า
  const [, setTick] = useState(0)

  useEffect(() => {
    loadCollection(user.uid).then(setOwned)
  }, [user.uid])

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  const hour = elementalHourIndex()
  const element = activeElement(hour)
  const info = ELEMENTS[element]
  const pool = elementalPool(element)
  const ids = [...pool.R, ...pool.SR, ...pool.SSR]
  const rates = effectiveRates(pool)
  const minutesLeft = elementalMinutesLeft(hour)
  const hoursLeft = Math.floor(minutesLeft / 60)
  const upcoming = elementalSchedule(5, hour + 1)

  const hasChar = (id) => owned?.some((o) => o.id === id) ?? false

  const discount = elementalDiscountAvailable(player)
  const singleCost = discount ? elementalDiscountedPullCost() : PULL_COST

  const sinceSR = player.elemPitySR ?? 0
  const sinceSSR = player.elemPitySSR ?? 0

  async function roll(count) {
    const cost = count === 10 ? TEN_PULL_COST : singleCost
    if (player.gems < cost) {
      setError('เพชรไม่พอ ไปเก็บจากด่านที่ยังไม่เคยผ่านก่อน')
      return
    }

    setBusy(true)
    setError(null)
    setResults(null)
    setLastCount(count)
    try {
      const r = await pullElemental({ ...player, uid: user.uid }, count)
      setResults(r.summary)
      await refresh()
      loadCollection(user.uid).then(setOwned)
    } catch (err) {
      setError(err.message === 'เพชรไม่พอ' ? err.message : explainError('สุ่มไม่สำเร็จ', err))
    }
    setBusy(false)
  }

  const elemShards = player.elemShardPool?.[element] ?? { R: 0, SR: 0, SSR: 0 }

  async function redeem(charId) {
    setBusy(true)
    setError(null)
    try {
      await exchangeElemental({ ...player, uid: user.uid }, charId, owned ?? [])
      await refresh()
      loadCollection(user.uid).then(setOwned)
    } catch (err) {
      setError(explainError('แลกไม่สำเร็จ', err))
    }
    setBusy(false)
  }

  return (
    <div className="sheet">
      <header className="lobby-head">
        <div>
          <h1>
            {info.mark} ตู้ธาตุ{info.name}
          </h1>
          <p className="meta">
            โอกาสออกในตู้นี้ ·{' '}
            {['R', 'SR', 'SSR']
              .filter((r) => rates[r] > 0)
              .map((r) => `${r} ${(rates[r] * 100).toFixed(0)}%`)
              .join(' · ')}
          </p>
        </div>
        <div className="purse">
          <span className="gem">◆</span>
          {player.gems.toLocaleString('th-TH')}
        </div>
      </header>

      <p className="meta">
        ตู้นี้เปิดหมุนเวียนทีละธาตุ ไล่ตามลำดับ เพลิง → วารี → พายุ → ปฐพี → แสง → มืด แล้ววนใหม่
        ทุกหนึ่งชั่วโมง
      </p>
      <p className="meta tiny">
        ธาตุ{info.name}เหลืออีก {hoursLeft > 0 ? `${hoursLeft} ชั่วโมง ` : ''}
        {minutesLeft % 60} นาทีก่อนเปลี่ยนเป็นธาตุถัดไป
      </p>

      <div className="pool-grid">
        {upcoming.map(({ hour: h, element: el }, i) => (
          <span className="pool-chip" key={h} data-owned={i === 0}>
            {ELEMENTS[el].mark} {ELEMENTS[el].name}
          </span>
        ))}
      </div>

      <p className="meta tiny">
        ตู้นี้มี SSR {pool.SSR.length} ตัว · SR {pool.SR.length} ตัว · R {pool.R.length} ตัว ·
        ตัวนับการันตีแยกจากตู้เริ่มต้นกับตู้ทัพหน้าโดยเฉพาะ
      </p>

      <div className="roster-head">
        <span className="meta">
          ในธาตุนี้คุณมีแล้ว {ids.filter((id) => hasChar(id)).length} จาก {ids.length} ตัว
        </span>
        <button className="plain-link inline" onClick={() => setShowPool((v) => !v)}>
          {showPool ? 'ซ่อนรายชื่อ' : 'ดูรายชื่อในตู้'}
        </button>
      </div>

      {showPool && (
        <div className="pool-grid">
          {ids.map((id) => {
            const c = CHARACTERS[id]
            const mine = hasChar(id)
            return (
              <span className="pool-chip" key={id} data-owned={mine} data-rarity={c.rarity}>
                {mine ? ELEMENTS[c.element].mark : '❔'} {mine ? c.name : '???'}
                <span className="pool-rarity">{c.rarity}</span>
              </span>
            )
          })}
        </div>
      )}

      <section className="pity">
        <div className="pity-row">
          <span className="meta">อีก {Math.max(0, PITY_SR - sinceSR)} ครั้งได้ SR ขึ้นไปแน่นอน</span>
          <div className="bar thin wide">
            <span style={{ width: `${(sinceSR / PITY_SR) * 100}%` }} />
          </div>
        </div>
        <div className="pity-row">
          <span className="meta">อีก {Math.max(0, PITY_SSR - sinceSSR)} ครั้งได้ SSR แน่นอน</span>
          <div className="bar thin wide">
            <span style={{ width: `${(sinceSSR / PITY_SSR) * 100}%` }} />
          </div>
        </div>
      </section>

      <section className="pity">
        <h2 className="section-title flush">แลกชิ้นส่วนธาตุ</h2>
        <p className="meta tiny">
          ตัวซ้ำจากตู้ธาตุให้ชิ้นส่วนธาตุแทนเศษวิญญาณกลาง เอาไปแลกตัวละครธาตุ{info.name}ตัวไหนก็ได้
          แลกตัวที่ยังไม่มีเพื่อรับตัวใหม่ หรือแลกตัวที่มีแล้วเพื่อรับชิ้นส่วนไปหลอมดาวต่อ (เหมือนหอแลกเปลี่ยนเดิม
          แต่ใช้ชิ้นส่วนธาตุแทนเศษวิญญาณกลาง) แลกได้ทันทีไม่ต้องรอรอบหมุนเวียน
        </p>
        <p className="meta tiny">
          มีอยู่ · R {elemShards.R ?? 0} · SR {elemShards.SR ?? 0} · SSR {elemShards.SSR ?? 0}
        </p>

        <div className="shard-grid">
          {ids.map((id) => {
            const c = CHARACTERS[id]
            const mine = hasChar(id)
            const cost = SHARDS_PER_DUPE[c.rarity] * 3
            const canAfford = (elemShards[c.rarity] ?? 0) >= cost
            return (
              <button
                key={id}
                className="shard-chip"
                data-rarity={c.rarity}
                data-owned={mine}
                data-affordable={canAfford}
                disabled={busy || !canAfford}
                onClick={() => redeem(id)}
              >
                <span className="shard-chip-name">
                  {ELEMENTS[c.element].mark} {c.name}
                  {mine && <span className="shard-chip-owned">มีแล้ว</span>}
                </span>
                <span className="shard-chip-cost">
                  {c.rarity} · {cost} ชิ้น
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {error && <div className="trace">{error}</div>}

      <div className="pull-row">
        <button className="rune-link" disabled={busy} onClick={() => roll(1)} data-deal={discount}>
          สุ่ม 1 ครั้ง · {singleCost}
          {discount && <span className="deal-tag">ครั้งแรกของวัน ลด 50%</span>}
        </button>
        <button className="rune-link" disabled={busy} onClick={() => roll(10)}>
          สุ่ม 10 ครั้ง · {TEN_PULL_COST}
        </button>
      </div>
      <p className="meta tiny center">สุ่มสิบครั้งถูกกว่าสุ่มทีละครั้งอยู่ 100 เพชร</p>

      {busy && <p className="meta center">กำลังอัญเชิญ</p>}

      {results && (
        <PullResult
          results={results}
          count={lastCount}
          again={lastCount === 10 ? TEN_PULL_COST : PULL_COST}
          gems={player.gems}
          busy={busy}
          onAgain={() => roll(lastCount)}
          onClose={() => setResults(null)}
        />
      )}
    </div>
  )
}
