# Installation
Jika belum ada folder node_modules silahkan jalankan: `npm install` untuk meng-instalasikan semua *dependencies* yang diperlukan oleh projek ini seperti yang dispesifikasikan di dalam package.json.

# Run
Jalankan `npm run dev` untuk menjalankan projek. Projek dapat diakses dari `localhost:3000`.

Data umumnya disimpan dalam file *backend.db*. Data *session* disimpan dalam file *sessions*. File yang di-*upload* pengguna disimpan dalam folder /storage.

Jalankan `npm run reset` (memerlukan *Python 3*) untuk menghapus data dalam *backend.db*, *sessions*, dan /storage.