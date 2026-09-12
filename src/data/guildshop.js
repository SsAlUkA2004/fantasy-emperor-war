// ร้านค้ากิลด์ ซื้อด้วยเหรียญกิลด์ที่ได้จากกิลด์เรดเท่านั้น
// ของที่ขายจึงเป็นของที่หาทางอื่นไม่ได้ หรือได้ช้ากว่ามาก
export const GUILD_SHOP = [
  { id: 'gbox', kind: 'gear', name: 'หีบอุปกรณ์กิลด์', desc: 'อุปกรณ์สุ่มหนึ่งชิ้น ช่วงชำนาญถึงตำนาน', price: 400, ilvl: 4 },
  { id: 'gbox5', kind: 'gear', name: 'หีบอุปกรณ์กิลด์ชั้นสูง', desc: 'อุปกรณ์สุ่มหนึ่งชิ้น ระดับไอเทมสูงสุด', price: 900, ilvl: 5 },
  { id: 'gore', kind: 'material', material: 'ore', amount: 300, name: 'แร่เหล็กเวท ×300', desc: 'วัสดุพื้นฐานสำหรับอัปเกรดสกิลและยกระดับ', price: 150 },
  { id: 'gcrystal', kind: 'material', material: 'crystal', amount: 80, name: 'ผลึกธาตุ ×80', desc: 'วัสดุหายาก ใช้ปลุกร่างและยกระดับ', price: 320 },
  { id: 'gscroll', kind: 'material', material: 'scroll', amount: 60, name: 'คัมภีร์สกิล ×60', desc: 'ใช้ยกระดับสกิลตัวละคร', price: 280 },
  { id: 'gshard', kind: 'pool', rarity: 'SSR', amount: 40, name: 'เศษวิญญาณตำนาน ×40', desc: 'สะสมไว้แลกตัวละคร SSR ที่ยังไม่มี', price: 600 },
]
