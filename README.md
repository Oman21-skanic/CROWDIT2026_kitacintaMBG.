# Tenangin - Platform AI Kesehatan Mental & Self Healing

**Tenangin** adalah platform berbasis AI murni (HTML, CSS, JS) yang dirancang untuk mendukung kesehatan mental dan *self-healing*. Aplikasi ini memfasilitasi ekspresi perasaan pengguna, memberikan dukungan emosional awal secara proaktif, serta menjembatani pengguna ke bantuan psikolog profesional jika mendeteksi stres/kondisi kritis.

Proyek ini dibangun untuk kompetisi **CROWD IT 2026** oleh tim dari **SMK Negeri 1 Ciomas**.

---

## 👥 Tim & Pembagian Tugas

Proyek ini dikerjakan secara kolaboratif oleh 3 orang anggota tim:

1. **Developer 1 (Lead UI & Chatbot)**
   - Membuat CSS Global, variabel desain, dan komponen Sidebar utama.
   - Membuat Halaman Chatbot Utama (`index.html`).
   - Membuat Halaman Koleksi & Audio Terapi (`features/koleksi/`).
2. **Developer 2 (Auth & Profil)**
   - Membuat alur masuk/daftar (`features/auth/`).
   - Membuat halaman Profil User (`features/profile/`).
   - Membuat halaman pencarian psikolog (`features/psikolog/psikolog.html`) & detail profil psikolog (`features/psikolog/detail.html`).
3. **Developer 3 (Chat & Komunitas - Pengembangan Lanjutan)**
   - Mengembangkan integrasi lanjutan (opsional/tambahan seperti forum komunitas).

---

## 📁 Struktur Folder Proyek

```
tenangin/
│
├── index.html                # Halaman Chatbot Utama
├── README.md                 # Dokumentasi proyek & Panduan Git (File Ini)
│
├── assets/                   # Aset global
│   ├── css/
│   │   ├── variables.css     # CSS Variables (Warna, tipografi, transisi)
│   │   ├── reset.css         # Normalisasi style browser
│   │   └── global.css        # Tata letak dasar (Grid, Sidebar & Main Content)
│   ├── js/
│   │   └── utils.js          # Helper JavaScript umum (localStorage, modal helper, dll)
│   └── images/               # Gambar, logo, avatar
│
├── components/               # Komponen bersama (Web Components)
│   └── app-sidebar.js        # Komponen Sidebar Kustom
│
└── features/                 # Fitur-fitur modular proyek
    ├── auth/                 # Folder Login & Register (Developer 2)
    ├── profile/              # Folder Profil Pribadi User (Developer 2)
    ├── psikolog/             # Folder Layanan & Detail Psikolog (Developer 2)
    └── koleksi/              # Folder Audio Terapi & Koleksi (Developer 1)
```

---

## 🎨 Panduan Desain & Warna (Design System)

Semua halaman **wajib** menggunakan CSS variables yang telah didefinisikan di `assets/css/variables.css`. Jangan menulis warna manual (seperti `#ffffff` atau `red`) langsung di CSS fitur Anda.

### Contoh CSS yang Benar:
```css
.card {
  background-color: var(--color-bg-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-family: var(--font-family);
  transition: all var(--transition-smooth);
}
```

---

## 🚀 Alur Kerja Kolaborasi Git (Git Workflow)

Untuk mencegah tabrakan kode (merge conflicts) yang bisa merusak proyek, ikuti langkah-langkah di bawah ini secara disiplin:

### 1. Cabang (Branch) Utama
* **`main`**: Hanya berisi kode yang sudah stabil, bersih dari error, dan siap dinilai/dideploy. Jangan sekali-kali mengoding langsung di cabang `main`.
* **`dev`**: Cabang penggabungan. Semua fitur baru akan digabungkan (merge) ke sini terlebih dahulu untuk diuji bersama.

### 2. Mulai Membuat Fitur Baru (Di Laptop Anda)
Sebelum mulai mengoding fitur Anda, tarik kode terbaru dari GitHub dan buat cabang baru:
```bash
# 1. Pindah ke dev
git checkout dev

# 2. Ambil update terbaru dari GitHub
git pull origin dev

# 3. Buat cabang fitur baru Anda (sesuai nama halaman)
git checkout -b feature/nama-fitur-anda
```
*Contoh nama cabang:* `feature/login-page`, `feature/audio-player`, `feature/psikolog-list`.

### 3. Menyimpan Pekerjaan Anda
Setelah Anda membuat perubahan kode, simpan perubahan tersebut secara teratur:
```bash
# 1. Cek file apa saja yang berubah
git status

# 2. Masukkan file ke staging area
git add .

# 3. Lakukan commit dengan pesan yang jelas
git commit -m "feat(auth): tambah form register dan validasi email"
```

### 4. Mengunggah ke GitHub & Menggabungkan (Merge) Kode
Setelah fitur Anda selesai dibuat dan diuji di laptop Anda:
```bash
# 1. Unggah cabang Anda ke GitHub
git push origin feature/nama-fitur-anda

# 2. Buka GitHub repositori Anda di browser.
# 3. Klik "Compare & Pull Request" dari cabang Anda menuju ke cabang 'dev'.
# 4. Beritahu teman tim Anda untuk me-review kode Anda.
# 5. Jika aman, klik "Merge Pull Request".
```

---

## 💻 Cara Menjalankan Proyek Secara Lokal

1. Clone repositori ini ke komputer Anda.
2. Gunakan ekstensi **Live Server** di VS Code untuk menjalankan aplikasi.
3. Buka halaman utama di alamat `http://127.0.0.1:5500/index.html`.
