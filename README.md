# Lab Inventory System — Capstone Project 2

**Stack:** Node.js (Express) + Pug + MySQL.

## Prasyarat

- [Node.js](https://nodejs.org/) (v18+)
- MySQL 8 (mis. via [Laragon](https://laragon.org/) — sudah bundle MySQL)
- Git

## Setup (clone & run)

```bash
# 1. Clone
git clone https://github.com/DheandraGhassani/CP2-Digitalisasi-Inventory.git
cd CP2-Digitalisasi-Inventory

# 2. Install dependencies
npm install

# 3. Buat file .env dari template, lalu sesuaikan
cp .env.example .env      # Windows: copy .env.example .env

# 4. Pastikan MySQL berjalan

# 5. Import skema -> otomatis membuat database + tabel
mysql -u root < "sql/schema_capstone2 updated.sql"

# 6. Seed user (5 role) + ruangan contoh
node seed.js

# 7. Jalankan
npm run dev        # auto-reload (nodemon); atau: npm start
```

Buka <http://localhost:3000>.

**Login default** (dari `seed.js`): `admin@lab.test` / `admin123` (admin), `kalab@lab.test` / `kalab123`, `kaprodi@lab.test` / `kaprodi123`, `stafadmin@lab.test` / `staf123`, `staflab@lab.test` / `staf123` — ganti setelah login pertama.

## Peran (roles)

`admin`, `kalab` (Kepala Lab), `kaprodi` (Ketua Prodi), `staff_admin` (Staf Administrasi), `staff_lab` (Staf Lab).