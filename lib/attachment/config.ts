export const ATTACHMENT_CONFIG = {
  MAX_COMMODITY_LINES: 10,     // total baris yang muat di kotak komoditas halaman 1 untuk GC (attachment mulai muncul jika >= 11 baris)
  MAX_FC_COMMODITY_LINES: 12,  // total baris yang muat di kotak komoditas halaman 1 untuk FC (Treatment Certificate, kapasitas hingga 12 baris visual)
  CHARS_PER_LINE: 56,          // lebar estimasi karakter per baris untuk pelipatan kata dinamis (word-wrap)
  TRUNCATE_PREVIEW_CHARS: 8,   // jumlah karakter yang ditampilkan sebelum "..."
  ATTACHMENT_MARKER: "(see Attachment)",
  CONTAINER_ATTACHMENT_THRESHOLD: 4, // jika kontainer >= 4, masuk ke lampiran (attachment)
  MAX_ROWS_PER_COLUMN_PER_PAGE: 25, // untuk tabel kontainer jika sangat banyak
} as const;

