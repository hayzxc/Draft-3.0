export const ATTACHMENT_CONFIG = {
  MAX_COMMODITY_LINES: 9,      // total baris yang muat di kotak komoditas halaman 1
  CHARS_PER_LINE: 60,          // estimasi karakter per baris (font bold, lebar kolom nilai)
  TRUNCATE_PREVIEW_CHARS: 8,   // jumlah karakter yang ditampilkan sebelum "..."
  ATTACHMENT_MARKER: "(see Attachment)",
  MAX_ROWS_PER_COLUMN_PER_PAGE: 25, // untuk tabel kontainer jika sangat banyak
} as const;

