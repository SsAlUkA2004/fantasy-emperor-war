# ศึกจอมจักรพรรดิ — Fantasy Emperor War

เกมเทิร์นเบทแฟนตาซี พร้อมระบบกาชา ตัวละคร และการประลองแบบมีฤดูกาล
React + Vite บน GitHub Pages ใช้ Firebase Auth และ Firestore เป็นฐานข้อมูล

**สถานะ: เฟส 0** — วางโครงโปรเจกต์ ต่อ Firebase และทำให้ดีพลอยขึ้น GitHub Pages ได้สำเร็จ

---

## ขั้นตอนติดตั้ง

### 1. เอาโค้ดขึ้น repo

สร้าง repo ชื่อ `fantasy-emperor-war` บน GitHub (แบบ public) แล้ว

```bash
git init
git add .
git commit -m "เฟส 0: วางโครงโปรเจกต์"
git branch -M main
git remote add origin https://github.com/<ชื่อผู้ใช้>/fantasy-emperor-war.git
git push -u origin main
```

### 2. สร้างโปรเจกต์ Firebase

1. เข้า [console.firebase.google.com](https://console.firebase.google.com) → Add project
2. เมนู **Build → Firestore Database** → Create database → เลือก **Production mode**
   (โหมดนี้ปิดทุกอย่างไว้ก่อน ซึ่งคือสิ่งที่เราต้องการ)
   Location เลือก `asia-southeast1` (สิงคโปร์) เพราะใกล้ไทยที่สุด — **เลือกแล้วเปลี่ยนไม่ได้**
3. เมนู **Build → Authentication** → Get started → เปิด **Email/Password** ไว้รอเฟส 1

### 3. เอาค่า config มาใส่

Project settings (ไอคอนเฟือง) → เลื่อนลงถึง **Your apps** → กดไอคอน `</>` เพื่อสร้าง Web app
คัดลอกค่าในก้อน `firebaseConfig` แล้ววางลงใน **`src/firebaseConfig.js`**

ค่าพวกนี้จะติดไปกับไฟล์ JS ที่ผู้เล่นโหลด ซึ่งเป็นเรื่องปกติของ Firebase ทุกเว็บ
สิ่งที่กันคนอื่นแก้ข้อมูลคือ Security Rules ไม่ใช่การซ่อนค่าเหล่านี้

### 4. อัปโหลดกฎความปลอดภัย

ใน Console → Firestore Database → แท็บ **Rules** → วางเนื้อหาจากไฟล์ `firestore.rules` → Publish

### 5. เปิด GitHub Pages

ใน repo → **Settings → Pages → Build and deployment → Source** เลือก **GitHub Actions**

จากนั้น push โค้ดขึ้น main อีกครั้ง workflow จะรันเองและได้ลิงก์

```
https://<ชื่อผู้ใช้>.github.io/fantasy-emperor-war/
```

---

## รันบนเครื่องตัวเอง

```bash
npm install
npm run dev
```

---

## เฟส 0 ถือว่าผ่านเมื่อ

- [ ] เปิดลิงก์ GitHub Pages แล้วเห็นหน้าไตเติลพร้อมตราเวทหมุน ไม่ใช่หน้าขาวหรือ 404
- [ ] แผงสถานะขึ้นว่า **เชื่อมต่อสำเร็จ** พร้อมข้อความว่าถูก Security Rules ปฏิเสธ
- [ ] กด "ดูรายละเอียดระบบ" แล้วเปลี่ยนหน้าได้ และกดรีเฟรชตรงหน้านั้นแล้วยังอยู่ที่เดิม ไม่ขึ้น 404

ข้อสุดท้ายสำคัญที่สุด เพราะเป็นการพิสูจน์ว่า HashRouter ทำงานถูกต้องบนโฮสต์ไฟล์นิ่ง

---

## ถ้าเจอปัญหา

| อาการ | สาเหตุที่พบบ่อย |
|---|---|
| หน้าขาวสนิท ไม่มีอะไรเลย | `base` ใน `vite.config.js` ไม่ตรงกับชื่อ repo เปิด Console จะเห็น 404 ของไฟล์ JS |
| แผงสถานะขึ้นว่ายังไม่ได้ตั้งค่า | ยังไม่ได้วางค่าใน `src/firebaseConfig.js` หรือวางไม่ครบทุกช่อง |
| ขึ้น "ติดต่อไม่สำเร็จ" | `projectId` พิมพ์ผิด หรือยังไม่ได้กด Create database ใน Firestore |
| Actions ขึ้นสีแดง | ไปดูแท็บ Actions ส่วนใหญ่คือลืมตั้ง Source เป็น GitHub Actions ในหน้า Pages |

---

## ต่อไปคือเฟส 1

สมัครสมาชิก เข้าสู่ระบบ และหน้าเลือกตัวละครเริ่มต้น 3 ตัว
