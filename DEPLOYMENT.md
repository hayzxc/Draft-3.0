# Panduan Deployment: Vercel + Neon / Supabase

Aplikasi ini dibangun menggunakan **Next.js 15 (App Router)**, **Prisma ORM**, dan **PostgreSQL**.
Berikut adalah panduan langkah demi langkah untuk melakukan deployment ke **Vercel** dengan database serverless (**Neon** atau **Supabase**).

---

## 1. Buat Database PostgreSQL (Neon / Supabase)

### Opsi A: Menggunakan Neon (Sangat Direkomendasikan - Cepat & Serverless)
1. Kunjungi [neon.tech](https://neon.tech) dan login / daftar (gratis).
2. Klik **Create Project**, beri nama project (misal: `fumigation-drafts`).
3. Di Dashboard Neon, salin **Connection string** pada bagian `Direct connection` atau `Connection pooling`:
   ```
   postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
   ```

### Opsi B: Menggunakan Supabase
1. Kunjungi [supabase.com](https://supabase.com) dan buat project baru.
2. Buka **Project Settings** > **Database** > **Connection string** (URI mode `Transaction` atau `Session`).

---

## 2. Inisialisasi Database (Push Schema)

Sebelum aplikasi aktif, buat tabel di database baru Anda:
1. Di komputer lokal Anda, buka file `.env` dan ganti `DATABASE_URL` dengan connection string dari Neon/Supabase di atas.
2. Jalankan perintah:
   ```bash
   npx prisma db push
   ```
3. *(Opsional)* Jika ingin mengisi data demo awal (contoh sertifikat & user demo):
   ```bash
   npm run prisma:generate
   npx tsx prisma/seed.ts
   ```

---

## 3. Push Kode ke GitHub

Repository lokal sudah siap dan ter-commit (`branch main`). Sekarang cukup hubungkan ke akun GitHub Anda:

1. Buka [github.com/new](https://github.com/new).
2. Buat repository baru (misal: `fumigation-draft-generator`), biarkan kosong (jangan centang README / gitignore).
3. Jalankan perintah berikut di terminal:
   ```bash
   git remote add origin https://github.com/<USERNAME_GITHUB_ANDA>/fumigation-draft-generator.git
   git push -u origin main
   ```

---

## 4. Deploy di Vercel

1. Buka [vercel.com](https://vercel.com) dan klik **Add New...** > **Project**.
2. Pilih repository `fumigation-draft-generator` dari GitHub Anda dan klik **Import**.
3. Di pengaturan proyek:
   - **Framework Preset**: `Next.js` (terdeteksi otomatis)
   - **Root Directory**: `./`
   - **Build Command**: `prisma generate && next build` (otomatis dari `package.json`)
4. Buka menu accordion **Environment Variables** dan tambahkan:
   - `DATABASE_URL` = *(Connection string Neon / Supabase Anda)*
   - `NEXTAUTH_SECRET` = *(Ketik string acak minimal 32 karakter, contoh: `k3y_s3cr3t_fum1g4t10n_pr4n4_2026!`)*
   - `NEXTAUTH_URL` = `https://<nama-proyek-anda>.vercel.app` *(atau URL domain kustom Anda)*
5. Klik **Deploy**!

---

## 5. Verifikasi & Checklist Pasca Deploy

- [ ] Halaman login & dashboard draft terbuka sempurna di URL Vercel.
- [ ] Buat draft Gas Clearance baru dan unduh PDF (`.pdf`) serta Word (`.docx`).
- [ ] Buat draft Treatment Certificate baru dan unduh bundel PDF (2 halaman) serta Word (`.docx`).
- [ ] Fitur Typewriter Live Audio dan input formulir berfungsi lancar tanpa kedipan (*flicker-free*).
