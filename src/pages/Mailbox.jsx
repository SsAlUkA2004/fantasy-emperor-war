import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { explainError } from '../lib/errors'
import { MAIL_KINDS } from '../data/mail'
import { POOL_MARKS } from '../data/exchange'
import { claimAll, claimMail, issueDailyMail, loadMail, removeMail } from '../lib/mail'

export default function Mailbox() {
  const { user, player, refresh } = usePlayer()
  const [mails, setMails] = useState(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [got, setGot] = useState(null)

  async function reload() {
    setMails(await loadMail(user.uid))
  }

  useEffect(() => {
    // ออกจดหมายรายวันให้ก่อนถ้ายังไม่มีของวันนี้ แล้วค่อยอ่านทั้งกล่อง
    issueDailyMail({ ...player, uid: user.uid })
      .then(reload)
      .catch((e) => setError(explainError('อ่านกล่องจดหมายไม่สำเร็จ', e)))
  }, [user.uid])

  const unread = mails?.filter((m) => !m.claimed) ?? []

  async function open(mail) {
    setBusy(mail.id)
    setError(null)
    setGot(null)
    try {
      const r = await claimMail({ ...player, uid: user.uid }, mail)
      setGot(r)
      await reload()
      await refresh()
    } catch (err) {
      setError(err.message || 'เปิดจดหมายไม่สำเร็จ')
    }
    setBusy(null)
  }

  async function openAll() {
    setBusy('all')
    setError(null)
    setGot(null)
    try {
      const r = await claimAll({ ...player, uid: user.uid }, mails)
      setGot({ gems: r.gems, pool: {}, count: r.count })
      await reload()
      await refresh()
    } catch (err) {
      setError(err.message || 'เปิดทั้งหมดไม่สำเร็จ')
    }
    setBusy(null)
  }

  return (
    <main className="screen top">
      <div className="sheet">
        <header className="lobby-head">
          <div>
            <h1>กล่องจดหมาย</h1>
            <p className="meta">
              {unread.length ? `มีจดหมายที่ยังไม่ได้เปิด ${unread.length} ฉบับ` : 'เปิดครบทุกฉบับแล้ว'}
            </p>
          </div>
          <div className="purse">
            <span className="gem">◆</span>
            {player.gems.toLocaleString('th-TH')}
          </div>
        </header>

        {error && <div className="trace">{error}</div>}
        {got && (
          <p className="levelup center">
            ได้เพชร {got.gems.toLocaleString('th-TH')} เม็ด
            {got.count ? ` จาก ${got.count} ฉบับ` : ''}
          </p>
        )}

        {unread.length > 1 && (
          <button className="rune-link block primary" onClick={openAll} disabled={busy === 'all'}>
            เปิดทั้งหมด {unread.length} ฉบับ
          </button>
        )}

        {mails === null && <p className="meta">กำลังเปิดกล่อง</p>}
        {mails?.length === 0 && <p className="meta">ยังไม่มีจดหมาย</p>}

        <div className="mail-list">
          {mails?.map((m) => (
            <article className="mail-row" key={m.id} data-read={m.claimed}>
              <div className="mail-body">
                <h3>{m.title}</h3>
                <p className="meta">{m.body}</p>
                <p className="meta tiny">
                  {MAIL_KINDS[m.kind] ?? 'จากระบบ'}
                  {m.day && ` · ${m.day}`}
                </p>
                <p className="meta cp">
                  ◆ {(m.gems ?? 0).toLocaleString('th-TH')}
                  {Object.entries(m.pool ?? {}).map(([k, n]) => (
                    <span key={k}>
                      {' '}
                      · {POOL_MARKS[k]} {n}
                    </span>
                  ))}
                </p>
              </div>

              {m.claimed ? (
                <button
                  className="plain-link inline"
                  onClick={async () => {
                    await removeMail(user.uid, m.id)
                    await reload()
                  }}
                >
                  ลบ
                </button>
              ) : (
                <button className="rune-link" disabled={busy === m.id} onClick={() => open(m)}>
                  เปิด
                </button>
              )}
            </article>
          ))}
        </div>

        <p className="meta tiny">
          รางวัลประจำวันออกให้อัตโนมัติเมื่อเปิดหน้านี้ในแต่ละวัน ยิ่งแรงค์สูงยิ่งได้มาก
        </p>

        <div className="gate">
          <Link className="rune-link" to="/">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  )
}
