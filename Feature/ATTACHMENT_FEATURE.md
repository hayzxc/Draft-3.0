# ATTACHMENT_FEATURE.md

> Spesifikasi fitur tambahan: **Attachment** pada GC Certificate Generator.
> Dokumen ini bersifat **additive-only**. Agent dilarang mengubah fitur, perilaku, styling, atau kode lain yang sudah ada di luar titik integrasi yang tercantum di Bagian 9.

---

## 1. Tujuan

Ketika **Nama komoditas/media pembawa** (Commodity/article) terlalu panjang untuk muat di halaman 1 sertifikat, sistem otomatis:

1. Memotong tampilan komoditas di halaman 1 dan menambahkan penanda `(see Attachment)`.
2. Menambahkan **halaman 2 (Attachment — Consignment Details)** yang memuat teks komoditas lengkap dan tabel kontainer.
3. Memperbarui penomoran halaman menjadi `Page 1 of 2`, `Page 2 of 2`.

Jika komoditas **tidak** panjang, seluruh output **identik** dengan perilaku saat ini (tidak ada halaman 2, tidak ada penanda, tidak ada perubahan teks lain).

Referensi visual: `EGC_EXPO_COMMODITIES_524.pdf` (halaman 1 dan 2).

---

## 2. Aturan Keras (Non-Goals)

- DILARANG mengubah logika, field, validasi, layout, font, ukuran, atau teks pada fitur yang sudah ada.
- DILARANG me-refactor file yang ada selain penambahan minimal di titik integrasi (Bagian 9).
- DILARANG menambah input field baru di form. Fitur ini hanya membaca data yang **sudah ada**.
- DILARANG mengubah konstanta tetap (`registrationNumber = ID0018MB`, fumigant = Methyl Bromide).
- DILARANG mengubah ukuran kertas dan margin halaman 1 yang sudah ada.
- Jika sebuah nama field di dokumen ini tidak cocok dengan nama di kode, agent **mencari field yang setara di kode yang ada** dan memakainya. Jangan membuat field baru.

---

## 3. Kondisi Pemicu (Trigger)

Attachment aktif jika dan hanya jika teks komoditas melebihi batas baris di halaman 1.

### 3.1 Konstanta (file baru, mudah disetel)

```ts
export const ATTACHMENT_CONFIG = {
  MAX_COMMODITY_LINES: 9,      // total baris yang muat di kotak komoditas halaman 1
  CHARS_PER_LINE: 60,          // estimasi karakter per baris (font bold, lebar kolom nilai)
  TRUNCATE_PREVIEW_CHARS: 8,   // jumlah karakter yang ditampilkan sebelum "..."
  ATTACHMENT_MARKER: "(see Attachment)",
  MAX_ROWS_PER_COLUMN_PER_PAGE: 25, // untuk tabel kontainer jika sangat banyak
} as const;
```

> Nilai `CHARS_PER_LINE` adalah estimasi karena `@react-pdf/renderer` tidak menyediakan pengukuran teks sebelum render. Agent wajib mengkalibrasi nilai ini agar hasilnya sesuai referensi: contoh di PDF referensi (11 baris) harus memicu attachment, dan komoditas yang pas 9 baris tidak boleh memicu.

### 3.2 Perhitungan jumlah baris

1. Pisahkan teks komoditas dengan `\n` menjadi `rawLines`.
2. Untuk tiap `rawLine`, jumlah baris visual = `max(1, ceil(rawLine.length / CHARS_PER_LINE))`.
3. `totalLines` = jumlah dari semua baris visual.
4. `needsAttachment = totalLines > MAX_COMMODITY_LINES`.

---

## 4. Perilaku Halaman 1 saat Attachment Aktif

Hanya tiga area yang berubah, dan **hanya** saat `needsAttachment === true`.

### 4.1 Kotak komoditas (Nama komoditas/media pembawa)

- Tampilkan `MAX_COMMODITY_LINES - 1` baris pertama **utuh** (8 baris).
- Baris ke-9 = 8 karakter pertama dari baris berikutnya + `...` + spasi + `(see Attachment)`.

Contoh hasil (sesuai referensi):

```
1 X 40 CONTAINER STC:
25MT (500 PP BAGS) OF INDONESIA ORIGIN CLOVES
(PACKED IN 50 KG PP BAGS)
TOTAL NET WEIGHT: 25,000.00 KGS
TOTAL GROSS WEIGHT: 25,500.00 KGS
TOTAL PACKAGES: 500 BAGS
LC NO : 161826020316 DATE: 2026 Oct 14
IRC NO : 260381120000319 H.S. CODE : 0907.10.90
APPLICAN... (see Attachment)
```

### 4.2 Nomor peti kemas / Container number

Tampilkan ringkasan: `{N} containers (see Attachment)` (N = jumlah kontainer). Di referensi: `1 containers (see Attachment)`.

### 4.3 Konsentrasi gas setelah penganginan / Gas levels after fumigation

Tampilkan: `{N} containers — {minTLV}–{maxTLV} ppm (see Attachment)`.
Di referensi: `1 containers — 0–0 ppm (see Attachment)`. Teks ini memakai warna biru yang sama dengan gaya yang sudah ada untuk nilai gas level, bila sudah ada. Jika belum ada, pakai bold biasa.

### 4.4 Nomor halaman

Footer kanan bawah: `Page 1 of 2`.

> Seluruh bagian lain halaman 1 (kop, nomor serial, QR, tanda tangan, footer Fumi Trust, dll.) **tidak boleh berubah**.

---

## 5. Halaman 2: Attachment

Halaman baru, ukuran kertas dan margin **sama** dengan halaman 1. Tanpa kop surat, tanpa QR, tanpa tanda tangan.

### 5.1 Header

| Elemen | Isi |
|---|---|
| Judul (bold) | `ATTACHMENT — Consignment Details` |
| Baris info (kecil) | `GC No. {gcNumber}  \|  Ref. Notice: {noticeRef}  \|  Date issued: {dd/mm/yyyy}` |

Contoh: `GC No. 00092/GC/MB/LYFBWKURMT/ID0018MB/XI/2026  |  Ref. Notice: LYFBWKURMT  |  Date issued: 03/11/2026`

### 5.2 Tabel kontainer (dua kolom berdampingan)

Header tabel (diulang di dua grup kolom):

```
No. | Container No. | Seal No. | TLV (ppm)   ||   No. | Container No. | Seal No. | TLV (ppm)
```

Aturan pengisian:

- Total kontainer = `n`. Baris per sisi = `ceil(n / 2)`.
- Kontainer ke-1 sampai ke-`ceil(n/2)` mengisi **grup kiri**; sisanya mengisi **grup kanan**.
- Kolom `No.` berisi nomor urut global (1, 2, 3, ...).
- Jika `n = 1` (seperti referensi), grup kanan kosong tetapi header tetap tampil.
- Sel kosong dibiarkan kosong, tanpa tanda strip.
- Data tiap baris: nomor kontainer, nomor segel, dan nilai TLV yang **sudah ada** di data form/state.

Contoh referensi:

| No. | Container No. | Seal No. | TLV (ppm) | No. | Container No. | Seal No. | TLV (ppm) |
|---|---|---|---|---|---|---|---|
| 1 | MRSU6854744 | ML-ID1012590 | 0 | | | | |

### 5.3 Blok Commodity / Article

- Label `Commodity / Article` (bold).
- Di bawahnya tampil **teks komoditas lengkap**, tanpa pemotongan, mempertahankan line break asli dan huruf bold seperti di referensi.
- Pada referensi, teks lengkap sudah berisi baris tambahan seperti `APPLICANT TIN NO.`, `APPLICANT BIN/VAT REGISTRATION NO`, dan `GW / NW / MEAS`. Semua itu berasal dari teks komoditas yang sudah diinput user, jadi tidak perlu field baru.

### 5.4 Catatan kaki

Teks kecil miring di bagian bawah blok:

```
This attachment is an integral part of certificate {gcNumber} and is issued because the details do not fit on the main page.
```

### 5.5 Footer

Kanan bawah: `Page 2 of 2`.

---

## 6. Edge Cases

| Kasus | Perilaku |
|---|---|
| Komoditas ≤ 9 baris | Tidak ada attachment, output sama persis seperti sekarang. |
| Komoditas tepat 9 baris | Tidak ada attachment. |
| Komoditas 10 baris atau lebih | Attachment aktif. |
| Baris ke-9 kurang dari 8 karakter | Tampilkan apa adanya + `...` + ` (see Attachment)`. |
| Kontainer > `2 × MAX_ROWS_PER_COLUMN_PER_PAGE` | Tabel lanjut ke halaman attachment berikutnya, header tabel diulang, penomoran menjadi `Page X of Y`. Teks komoditas lengkap hanya tampil di halaman attachment pertama. |
| Teks komoditas sangat panjang di halaman attachment | Biarkan wrap otomatis, boleh lanjut ke halaman berikutnya. `Y` dihitung dari total halaman. |
| User mengedit komoditas dari panjang ke pendek | Attachment hilang otomatis, halaman kembali satu, teks kembali normal. |
| Komoditas kosong | Tidak ada attachment. |

---

## 7. Live Preview dan PDF Export

- Live preview dan PDF export memakai komponen `@react-pdf/renderer` yang sama, jadi attachment otomatis tampil di keduanya.
- Preview menampilkan halaman 2 di bawah halaman 1 dengan mekanisme multi-halaman yang sudah dipakai preview (bila belum mendukung multi-halaman, tambahkan hanya sebatas yang dibutuhkan agar halaman 2 terlihat, tanpa mengubah tampilan halaman 1).
- Nama file export mengikuti aturan yang sudah ada, tidak berubah.

---

## 8. Struktur File Baru

Hanya file baru berikut yang boleh ditambahkan (sesuaikan folder dengan struktur proyek yang ada):

```
lib/attachment/config.ts            // ATTACHMENT_CONFIG
lib/attachment/attachment.ts        // fungsi util murni (lihat 8.1)
lib/attachment/attachment.test.ts   // unit test
components/pdf/AttachmentPage.tsx   // halaman 2
```

### 8.1 Fungsi util (murni, tanpa efek samping)

```ts
export function countCommodityLines(text: string): number;

export function needsAttachment(text: string): boolean;

export function getCommodityDisplay(text: string): {
  isTruncated: boolean;
  displayLines: string[];   // yang dirender di halaman 1
};

export function splitContainerColumns<T>(items: T[]): { left: T[]; right: T[] };

export function getGasSummary(tlvs: number[]): string; // "{N} containers — {min}–{max} ppm (see Attachment)"

export function getContainerSummary(count: number): string; // "{N} containers (see Attachment)"
```

---

## 9. Titik Integrasi pada Kode yang Ada (Satu-satunya Perubahan Diizinkan)

Agent harus menelusuri kode yang ada terlebih dahulu, lalu menambahkan **hanya** tiga hal berikut, masing-masing dibungkus kondisi `needsAttachment` agar jalur lama tidak tersentuh:

1. **Render field komoditas di halaman 1**: jika `needsAttachment`, gunakan `getCommodityDisplay(...).displayLines`; selain itu pakai render lama tanpa perubahan.
2. **Render field nomor peti kemas dan gas level di halaman 1**: jika `needsAttachment`, tampilkan teks ringkasan (4.2 dan 4.3); selain itu pakai render lama.
3. **Komponen `<Document>`**: jika `needsAttachment`, tambahkan `<AttachmentPage />` setelah halaman 1 dan ubah teks nomor halaman menjadi `Page 1 of 2`; selain itu tidak berubah.

Tidak ada perubahan pada state management, skema form, validasi, API, atau styling global.

---

## 10. Kriteria Penerimaan (Acceptance Criteria)

- [ ] Input komoditas pada PDF referensi (11 baris) memicu attachment dan hasilnya cocok dengan halaman 1 dan 2 referensi.
- [ ] Baris ke-9 tampil sebagai `APPLICAN... (see Attachment)`.
- [ ] Ringkasan kontainer dan gas level tampil sesuai 4.2 dan 4.3.
- [ ] Halaman 2 memuat header, tabel dua grup kolom, teks komoditas lengkap, dan catatan kaki.
- [ ] Footer: `Page 1 of 2` dan `Page 2 of 2`.
- [ ] Komoditas pendek: output halaman 1 identik dengan sebelum fitur ditambahkan (verifikasi dengan membandingkan hasil PDF sebelum dan sesudah).
- [ ] Mengedit komoditas dari panjang ke pendek menghilangkan attachment secara langsung di preview.
- [ ] Unit test untuk `countCommodityLines`, `needsAttachment`, `getCommodityDisplay`, `splitContainerColumns`, `getGasSummary` lulus.
- [ ] Tidak ada diff pada file lama selain tiga titik integrasi di Bagian 9.

---

## 11. Urutan Pengerjaan untuk Agent

1. Baca kode yang ada. Petakan nama field komoditas, kontainer, segel, TLV, GC number, notice ref, tanggal.
2. Buat `config.ts` dan `attachment.ts` beserta unit test.
3. Kalibrasi `CHARS_PER_LINE` dengan contoh referensi.
4. Buat `AttachmentPage.tsx`.
5. Tambahkan tiga titik integrasi (Bagian 9).
6. Jalankan test dan bandingkan hasil PDF sebelum dan sesudah untuk komoditas pendek.
7. Laporkan daftar file yang diubah dan ditambah. Jika ada file lama selain titik integrasi yang berubah, kembalikan.
