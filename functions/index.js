// ─────────────────────────────────────────────────────────────
// โค้ดฝั่งเซิร์ฟเวอร์ เตรียมไว้แล้วแต่ยังไม่ได้ใช้
//
// ตอนนี้เกมสุ่มกาชาในเบราว์เซอร์ ซึ่งแปลว่าคนที่แก้โค้ดเป็น
// บังคับให้ตัวเองออก SSR ทุกครั้งได้ (แต่ยังจำกัดด้วยเพชรที่มี)
//
// วิธีเปิดใช้
//   1. อัปเกรดโปรเจกต์ Firebase เป็นแผน Blaze (ต้องผูกบัตร แต่โควตาฟรีครอบคลุม)
//   2. npm install -g firebase-tools && firebase login && firebase init functions
//   3. คัดลอกไฟล์นี้ทับ functions/index.js แล้ว firebase deploy --only functions
//   4. ในไฟล์ src/lib/gacha.js เปลี่ยนฟังก์ชัน pull ให้เรียก httpsCallable('pullGacha')
//      แทนการสุ่มในเครื่อง ส่วนที่เหลือของเกมไม่ต้องแก้เลย
//   5. ในกฎ Firestore เปลี่ยน collection ให้ allow create, update: if false
//      เพราะ Admin SDK ข้ามกฎอยู่แล้ว ฝั่งเบราว์เซอร์จึงไม่ต้องเขียนอีกต่อไป
// ─────────────────────────────────────────────────────────────

const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

const RATES = { SSR: 0.03, SR: 0.18 }
const PITY_SR = 10
const PITY_SSR = 60
const PULL_COST = 100
const TEN_PULL_COST = 900
const SHARDS_PER_DUPE = { R: 5, SR: 20, SSR: 50 }

// ต้องตรงกับ src/data/characters.js
const POOL = {
  R: ['bren', 'moss', 'torg', 'neria', 'corvin'],
  SR: ['athen', 'galen', 'lumina', 'zephyr', 'iris', 'velka'],
  SSR: ['solaris', 'drakos', 'umbra'],
}

function rollOne(pity) {
  let rarity
  if (pity.sinceSSR + 1 >= PITY_SSR) rarity = 'SSR'
  else if (pity.sinceSR + 1 >= PITY_SR)
    rarity = Math.random() < RATES.SSR / (RATES.SR + RATES.SSR) ? 'SSR' : 'SR'
  else {
    const r = Math.random()
    rarity = r < RATES.SSR ? 'SSR' : r < RATES.SSR + RATES.SR ? 'SR' : 'R'
  }

  if (rarity === 'SSR') {
    pity.sinceSSR = 0
    pity.sinceSR = 0
  } else if (rarity === 'SR') {
    pity.sinceSR = 0
    pity.sinceSSR += 1
  } else {
    pity.sinceSR += 1
    pity.sinceSSR += 1
  }

  const pool = POOL[rarity]
  return { id: pool[Math.floor(Math.random() * pool.length)], rarity }
}

exports.pullGacha = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'ต้องเข้าสู่ระบบก่อน')

  const count = request.data?.count === 10 ? 10 : 1
  const cost = count === 10 ? TEN_PULL_COST : PULL_COST

  return db.runTransaction(async (tx) => {
    const userRef = db.collection('users').doc(uid)
    const userSnap = await tx.get(userRef)
    if (!userSnap.exists) throw new HttpsError('not-found', 'ไม่พบผู้เล่น')

    const user = userSnap.data()
    if ((user.gems ?? 0) < cost) throw new HttpsError('failed-precondition', 'เพชรไม่พอ')

    const pity = { sinceSR: user.pitySR ?? 0, sinceSSR: user.pitySSR ?? 0 }
    const results = []
    for (let i = 0; i < count; i++) results.push(rollOne(pity))

    const ids = [...new Set(results.map((r) => r.id))]
    const owned = {}
    await Promise.all(
      ids.map(async (id) => {
        const snap = await tx.get(userRef.collection('collection').doc(id))
        owned[id] = snap.exists ? snap.data() : null
      })
    )

    const summary = []
    results.forEach(({ id, rarity }) => {
      const ref = userRef.collection('collection').doc(id)
      if (!owned[id]) {
        owned[id] = { level: 1, exp: 0, star: 1, shards: 0 }
        tx.set(ref, { ...owned[id], obtainedAt: admin.firestore.FieldValue.serverTimestamp() })
        summary.push({ id, rarity, isNew: true })
      } else {
        const gain = SHARDS_PER_DUPE[rarity]
        owned[id].shards = (owned[id].shards ?? 0) + gain
        tx.update(ref, { shards: owned[id].shards })
        summary.push({ id, rarity, isNew: false, shards: gain })
      }
    })

    tx.update(userRef, {
      gems: user.gems - cost,
      pitySR: pity.sinceSR,
      pitySSR: pity.sinceSSR,
    })

    return { summary, spent: cost }
  })
})
