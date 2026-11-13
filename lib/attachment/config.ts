export const ATTACHMENT_CONFIG = {
  MAX_COMMODITY_LINES: 12,     // total baris yang muat di kotak komoditas halaman 1 untuk GC (attachment mulai muncul jika >= 13 baris)
  MAX_FC_COMMODITY_LINES: 12,  // total baris yang muat di kotak komoditas halaman 1 untuk FC (Treatment Certificate)
  CHARS_PER_LINE: 80,          // estimasi karakter per baris (font bold, lebar kolom nilai)
  TRUNCATE_PREVIEW_CHARS: 8,   // jumlah karakter yang ditampilkan sebelum "..."
  ATTACHMENT_MARKER: "(see Attachment)",
  CONTAINER_ATTACHMENT_THRESHOLD: 4, // jika kontainer >= 4, masuk ke lampiran (attachment)
  MAX_ROWS_PER_COLUMN_PER_PAGE: 25, // untuk tabel kontainer jika sangat banyak
} as const;

