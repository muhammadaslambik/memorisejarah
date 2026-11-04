# paket-12d2-profil-penulis.ps1  (PAKET-12D2)
# Isi: klik nama penulis -> halaman profil redaksi; tombol Lihat Biografi (biografi lengkap dari WordPress); daftar tulisan di profil. Jalankan SETELAH paket 12D.
# Jalankan dari folder proyek:  powershell -ExecutionPolicy Bypass -File .\paket-12d2-profil-penulis.ps1
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)

function P([string]$rel) {
  return [System.IO.Path]::Combine($root, $rel.Replace('/', [string][System.IO.Path]::DirectorySeparatorChar))
}
function Tulis([string]$rel, [string]$isi) {
  $p = P $rel
  $dir = [System.IO.Path]::GetDirectoryName($p)
  if (-not [System.IO.Directory]::Exists($dir)) { [void][System.IO.Directory]::CreateDirectory($dir) }
  if ([System.IO.File]::Exists($p)) {
    $lama = [System.IO.File]::ReadAllText($p)
    if (($lama -notmatch 'PAKET-') -and ($lama -notmatch 'Segera hadir')) {
      Write-Host ("DILEWATI (bukan berkas paket): " + $rel) -ForegroundColor Yellow
      return
    }
  }
  [System.IO.File]::WriteAllText($p, $isi, $utf8)
  Write-Host ("Ditulis : " + $rel) -ForegroundColor Green
}
function Ganti([string]$rel, [string]$lama, [string]$baru) {
  $p = P $rel
  if (-not [System.IO.File]::Exists($p)) { Write-Host ("TIDAK ADA: " + $rel) -ForegroundColor Red; return }
  $t = [System.IO.File]::ReadAllText($p)
  if ($t.Contains($baru)) { Write-Host ("Sudah   : " + $rel) -ForegroundColor DarkGray; return }
  $i = $t.IndexOf($lama)
  if ($i -lt 0) { Write-Host ("GAGAL (teks lama tidak ditemukan): " + $rel) -ForegroundColor Red; return }
  $t = $t.Substring(0, $i) + $baru + $t.Substring($i + $lama.Length)
  [System.IO.File]::WriteAllText($p, $t, $utf8)
  Write-Host ("Diubah  : " + $rel) -ForegroundColor Green
}
function Tambah([string]$rel, [string]$tanda, [string]$teks) {
  $p = P $rel
  if (-not [System.IO.File]::Exists($p)) { Write-Host ("TIDAK ADA: " + $rel) -ForegroundColor Red; return }
  $t = [System.IO.File]::ReadAllText($p)
  if ($t.Contains($tanda)) { Write-Host ("Sudah   : " + $rel) -ForegroundColor DarkGray; return }
  $t = $t.TrimEnd() + "`r`n`r`n" + $teks + "`r`n"
  [System.IO.File]::WriteAllText($p, $t, $utf8)
  Write-Host ("Ditambah: " + $rel) -ForegroundColor Green
}
function GantiRegex2([string]$rel, [string]$pola, [string]$baru) {
  $p = P $rel
  if (-not [System.IO.File]::Exists($p)) { Write-Host ("TIDAK ADA: " + $rel) -ForegroundColor Red; return }
  $t = [System.IO.File]::ReadAllText($p)
  if ($t.Contains($baru)) { Write-Host ("Sudah   : " + $rel) -ForegroundColor DarkGray; return }
  $re = New-Object System.Text.RegularExpressions.Regex($pola, [System.Text.RegularExpressions.RegexOptions]::Singleline)
  if (-not $re.IsMatch($t)) { Write-Host ("GAGAL (pola tidak cocok): " + $rel) -ForegroundColor Red; return }
  $ev = [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $baru }
  $t = $re.Replace($t, $ev, 1)
  [System.IO.File]::WriteAllText($p, $t, $utf8)
  Write-Host ("Diubah  : " + $rel) -ForegroundColor Green
}

Write-Host "== Paket 12D2 ==" -ForegroundColor Cyan
$f0 = @'
// PAKET-12D2: menambah kolom redaksi.bio_lengkap, mengisi biografi lengkap anggota redaksi
// (disalin dari halaman WordPress lama), dan menghubungkan profil redaksi ke akun penulisnya.
// Aman dijalankan ulang: biografi yang sudah terisi tidak ditimpa, kecuali dengan --timpa.
// Jalankan: npx tsx --env-file=.env.local scripts/isi-biografi.ts
import { neon } from "@neondatabase/serverless";

const BIO: Record<string, string> = {
  "arya-bagus-nur-ajiyanto": `**DATA UMUM :**

Nama: Arya Bagus Nur Ajiyanto, S.Hum

Tempat, Tanggal Lahir: Klaten, 19 Maret 2001

Pendidikan Terakhir: S1 Sejarah Peradaban Islam, Fakultas Adab dan Bahasa, UIN Raden Mas Said Surakarta.

**PROFIL SINGKAT**
Arya Bagus Nur Ajiyanto adalah seorang sejarawan muda asal Klaten yang aktif dalam dunia intelektual, kebudayaan, dan keagamaan.

Dengan latar belakang akademik di bidang Sejarah Peradaban Islam, Arya menaruh perhatian besar pada pelestarian nilai-nilai budaya lokal, penguatan moderasi beragama, serta pemberdayaan masyarakat melalui pendekatan edukatif dan produktif.

Ia percaya bahwa sejarah adalah kunci untuk memahami identitas dan membangun masa depan yang inklusif.

**PENGALAMAN & PENGHARGAAN**

- **Ketua Umum Himpunan Mahasiswa Program Studi (HMPS) Ilmu Sejarah – UIN Raden Mas Said Surakarta**.
- **Purna Paskibraka Kabupaten Klaten**
- **Wisudawan Terbaik Fakultas Adab dan Bahasa (Kategori Non-Akademik)**.
- **Tokoh Sejarawan Muda Klaten – Penghargaan dari Disbudporapar Kabupaten Klaten**.
- Penulis buku ***Dinamika Tradisi Perayaan Yaa Qowiyyu di Jatinom Klaten***, diserahkan langsung kepada **Menteri Agama RI**
- Peserta lomba artikel “**Moderate Millennial Agent**” – Syiar Kebudayaan Islam, Kementerian Agama RI

**FOKUS KEGIATAN & PENULISAN**

- Kajian sejarah dan tradisi lokal Jawa
- Penguatan narasi moderasi beragama dan Islam wasathiyah
- Pengembangan pembiayaan produktif syariah dan ekosistem halal *value chain*
- Penulisan artikel ilmiah dan populer bertema budaya, sejarah, dan keislaman

**MOTO HIDUP**
“Sejarah bukan sekadar masa lalu, tapi fondasi untuk membangun masa depan yang lebih bijak dan beradab.”

**Informasi selengkapnya dapat menghubungi:**

- **Email:** aryabagusnurajiyanto@gmail.com
- **Nomor hp/wa:** 0857-2877-2003`,

  "muhammad-aslambik": `**DATA UMUM :**

Nama: Muhammad Aslambik, S.Hum.

Alamat: Jl. Dargo Dalam 80A SMG, RT/RW : 05/04, Kebonagung, Semarang Timur, Semarang, Jawa Tengah, Indonesia.

Bidang Penelitian: Sejarah dan Studi Islam.

**PENDIDIKAN :**

- TK Terpadu, Loireng, Sayung, Demak.
- SDN Loireng, Sayung, Demak.
- MADIN Hidayatush Shibyan, Loireng, Sayung, Demak.
- SMP PIDI Sayung, Demak.
- SMA Al-Itishom Grabag, Magelang.
- [Pondok Pesantren Nurul Qur’aniy (PPNQ)](https://www.instagram.com/pp.nurul.quraniy/), Kerep rt/rw: 01/02, Jombor, Kec. Tuntang, Kab. Semarang.
- D2, Bahasa Arab, Ma’had Abu Bakar Ash Shiddiq, Universitas Muhammadiyah Surakarta.
- S1, Sejarah Peradaban Islam, UIN Raden Mas Said Surakarta (2019-2023). ((**Menjadi wisudawan terbaik Program Studi Sejarah Peradaban Islam, UIN Raden Mas Said Surakarta dengan IPK. 3,86**). Bergelar Sarjana Humaniora (S.Hum) – (2023)).

**ORGANISASI :**

- **LSO (Lembaga Semi Otonom) RELASI**, organisasi tingkat Fakultas di Fakultas Adab dan Bahasa, UIN Raden Mas Said Surakarta, yang berfokus dalam riset keilmiahan dan pengembangan bahasa asing, dengan **Jabatan Ketua Departemen Keilmiahan** (Februari 2022 – Februari 2023).
- **LPM (Lembaga Pers Mahasiswa) PANDAWA**, organisasi tingkat fakultas di Fakultas Adab dan Bahasa, UIN Raden Mas Said Surakarta, dengan **Jabatan Koordinator Reporter** (Februari 2022 – Februari 2023).
- **HMI** – (LK1 Komisariat Fakultas Hukum UNS, diklat di Klaten pada tanggal 16-18 September 2022).

**AKTIFITAS LAINNYA :**

- **Asisten Dosen Bidang Kepenulisan Ibu Martina Safitry, S.S., M.A.** (Agustus 2021 sampai Desember 2023).
- **Asisten Dosen Bidang Riset dan Kepenulisan Bapak Moh. Ashif Fuadi, M. Hum.**, (2021-sekarang).
- Pengurus Komunitas **Jong Historian Bond (JHB)**, yang berfokus pada kegiatan diskusi/seminar sejarah – (2020-2022).
- Penulis di [**MalangNetwork.com**](https://malang.jatimnetwork.com/author/28869/Muhammad-Aslambik?page=1), situs portal berita online – (September-Oktober 2023).
- Pendiri & Pemimpin Redaksi di [**Memori Sejarah**](https://memorisejarah.wordpress.com/redaksi/), situs website yang berfokus pada riset heuristik dan historiografi sejarah – (2023-sekarang).

**PRESTASI :**

- Penerima Beasiswa Peningkatan Potensi Akademik (2020)
- Penerima Beasiswa Prestasi Akademik Non-KIP (2021)
- Penerima Beasiswa Prestasi Akademik Non-KIP (2022)
- Presenter Konferensi Internasional (*The 1st International Conference on Culture & Languages ICCL*) – (2022).
- Presenter Konferensi Internasional (*Exploring Roots of Plurality and Tolerance in Indonesia*) – (2022).
- **Wisudawan terbaik Program Studi Sejarah Peradaban Islam**, UIN Raden Mas Said Surakarta dengan IPK. 3,86 – (2023).

**KARYA PENELITIAN :**

Akun Google Scholar: [Muhammad Aslambik](https://scholar.google.com/citations?user=u1yLuAoAAAAJ&hl=id)

**Artikel Jurnal :**

1. Historisitas dan Nilai Religius Shalawat Lam Yahtalim dalam Kitab Maraqi Al-‘Ubudiyah Karya Syekh Nawawi Al-Bantani. (Terbit di *Jurnal KACA (Karunia Cahaya Allah): Jurnal Dialogis Ilmu Ushuluddin*, Vol. 12, No. 1 (1 Februari 2022)). (Dipresentasikan pada acara *The First International Conference and Call Paper on Islamic History and Civilication, Theme “Exploring Roots of Plurality and Tolerance in Indonesia*“) – (Sinta 4). [*Lihat Selengkapnya*](https://jurnal.alfithrah.ac.id/index.php/kaca/article/view/211).
2. Nilai-Nilai Dasar Moderasi dan Toleransi Beragama dalam Praktik Pengajaran di Pondok Pesantren Roudlotus Sholihin Demak. (Dipresentasikan dalam acara *The 1st International Conference on Culture & Languages (ICCL) “Global (Global & Local) Reinforcement of Religious Tolerance in Post Pandemic Era”*). (Diterbitkan di *Proceeding of International Conference Cultures & Languages*, 18 November 2022) – (moraref). [*Lihat Selengkapnya*](https://ejournal.uinsaid.ac.id/index.php/iccl/article/view/5815).
3. Pemilihan Tweede Kamer Belanda Dan Masalah Kemiskinan Di Indonesia Dalam Narasi Surat Kabar Adil Tahun 1933. (Diterbitkan di jurnal *Mahakarya: Jurnal Mahasiswa Ilmu Budaya* 4 (1), 35-46, 30 Juni 2023) – (Sinta 3). [*Lihat Selengkapnya*](https://ejournal.uinsaid.ac.id/index.php/mahakarya/article/view/6956).
4. *Prevention Effort of Sexual Violence From Power Inequality Relations in Islamic Boarding Schools in Indonesia*. (Diterbitkan di *Jurnal Harmoni* (Kementerian Agama), 23 (1), 1-17, 8 Juli 2024) – (Sinta 2). [*Lihat Selengkapnya*](https://jurnalharmoni.kemenag.go.id/index.php/harmoni/article/view/720).
5. Menyoal Ketimpangan Relasi Kuasa dan Upaya Pencegahan Kekerasan Seksual di Pesantren: Sebuah Tinjauan Kritis. (Diterbitkan di *Jurnal Musãwa*, Vol. 21, No. 15 Juli 2024) – (Sinta 2). [*Lihat Selengkapnya*](https://ejournal.uin-suka.ac.id/pusat/MUSAWA/article/view/2772).

**Judul Skripsi :**

**Narasi Sosial-Politik, Sosial-Ekonomi, dan Sosial-Dakwah di Indonesia dalam Surat Kabar *Adil* (2 Maret – 26 Juni 1933).** [*Lihat Selengkapnya*](https://drive.google.com/file/d/1hfZ1pDrhIHqCsPWyjLg0lzeLjvz-Hqpw/view?usp=sharing).

Pembimbing & Penguji Skripsi:

- Penguji Utama: Prof. Dr. Toto Suharto, S.Ag., M.Ag.
- Penguji 1 (Ketua Sidang): Martina Safitry, SS., MA.
- Penguji 2 (Sekertaris Sidang/Pembimbing): Prof. Dr. KH. Syamsul Bakri, S.Ag., M.Ag.

Karya skripsi tersebut mendapatkan pujian dari Prof. Dr. KH. Syamsul Bakri, S.Ag., M.Ag., sebagai karya skripsi terbaik yang pernah beliau lihat.

Selain itu, Prof. Dr. Toto Suharto, S.Ag., M.Ag., juga berpendapat bahwa karya skripsi tersebut merupakan karya yang kualitasnya baik, karena dilengkapi dengan data primer yang banyak.

**Informasi selengkapnya dapat menghubungi:**

- **Email Utama:** aslambik10@gmail.com
- **Email Alternatif:** aslambik007@gmail.com
- **Nomor hp/wa:** 085706778624`,

  "sigid-nugrohowati": `**DATA UMUM :**

Nama: Sigid Nugrohowati

Status: Mahasiswi

Alamat Domisili: Taskerep, RT 13/RW 05, Plumbon, Sambungmacan, Sragen, Jawa Tengah, Indonesia.

Bidang Penelitian: Sejarah dan Studi Islam.

**Pendidikan**

**Formal**:

- TK Pertiwi 2 Plumbon,
- SMPN 2 Sambungmacan,
- SMAN 1 Sragen,
- S1, Pendidikan Agama Islam, Institut Islam Mamba’ul ‘Ulum Surakarta.

**Non formal**:

- Sekolah Da’i,
- Fawaed Syafi’iyyah (Fikih Dasar),
- Scholarship Arabic Course (Basic),
- Pelatihan Aksara Jawa Kuna

**Keahlian:** Mengajar/Menjadi Akademisi

**Pengalaman Kerja**:

- Guru les privat tahfizh, iqra’, dan calistung (TK-SD)

**Informasi selengkapnya dapat menghubungi:**

- Instagram: @sigidnugrohowati
- Facebook: Sigid Nugrohowati
- Nomor WA: 081215867910
- Email: sigiddigitallibrary@gmail.com`,

  "rifky-arya-pramadana": `**DATA UMUM :**

Nama : Rifky Arya Pramadana

Alamat : Jl. Dahlia Perum Jaten Permai Indah Karanganyar

Bidang Penelitian: Sejarah Peradaban Islam

**PENDIDIKAN :**

- S1, Sejarah Peradaban Islam, UIN Raden Mas Said Surakarta (2019-2025).

**ORGANISASI :**

- **LSO (Lembaga Semi Otonom) RELASI**, organisasi tingkat Fakultas di Fakultas Adab dan Bahasa, UIN Raden Mas Said Surakarta, yang berfokus dalam riset keilmiahan dan pengembangan bahasa asing, dengan **Jabatan Ketua Umum** (Februari 2022 – Februari 2023).

**AKTIFITAS LAINNYA :**

- Pendiri & Pengurus Komunitas **Jong Historian Bond (JHB)**, yang berfokus pada kegiatan diskusi/seminar sejarah – (2020-2022).

**Informasi selengkapnya dapat menghubungi:**

- **Email:** rifkyaryapramadana99@gmail.com
- **Nomor hp/wa:** 0896-5315-1841`,

  "iqbal-al-irfan": `**DATA UMUM :**

Nama: Iqbal Al Irfan, S.Hum.

Alamat: Gemolong, Sragen, Jawa tengah, Jawa Tengah, Indonesia.

Bidang Penelitian: Sejarah Peradaban Islam.

**PENDIDIKAN :**

- S-1 Jurusan Sejarah Peradaban Islam di Universitas Islam Raden Mas Said Surakarta (2019-2023). Dan berhasil menjadi lulusan terbaik Ilmu Sejarah Peradaban Islam (IPK 3.74) dengan menyandang gelar S.Hum., dalam wisuda ke-53 UIN Raden Mas Said Surakarta (Juli 2023).

**ORGANISASI :**

- LSO Relasi: Menjabat sebagai ketua Humas & Sosial media
- KMS Sragen: Menjabat sebagai Staff Humas
- PMR Kab. Karanganyar: Menjabat sebagai ketua koordinasi devisi MAN 2 Karanganyar

**PENGALAMAN KERJA :**

- Reporter & Produksi Film Dokumenter Sejarah di Komunitas Sejarah Mbako Baki (2022): Melakukan perencanaan, menulis, dan membuat skenario.
- Tour guide in Museum Batik Danar Hadi (2022): Mamandu pengunjung yang sedang berwisata di Museum Danar Hadi
- Marketing di PT Yamaha Cab. Sragen (2019): Riset informasi, analisa tren pasar, dan melakukan kampanye pemasaran.
- Operator Produksi di CV. Nuansa Kayu Bekas (2017): Melakukan finishing pada produk

**SKILL & PRESTASI :**

- Kemampuan Analis Data.
- Kepenulisan, Penyuntingan, dan Menguasai Ms Office (Word, Excel, Power Point)
- Bahasa Inggris (pasif)
- Bahasa Korea (pasif)
- Penerima Beasiswa Bidikmisi 2019-2023
- Mahasiswa *Cum Laude* dan lulusan terbaik Program Studi Sejarah Peradaban Islam, UIN Raden Mas Said Surakarta, dengan IPK 3,74. (2023).

**Informasi selengkapnya dapat menghubungi:**

**Email**: Iqbalalirfan01@gmail.com

**Nomor HP/WA**: 085647555423

**Linkedln:** Iqbal Al Irfan

**Facebook**: Iqbal Al Irfan

**Instagram**: Iqbal_Alirfan`,

  "fajri-ana-zahrotul-jannah": `**DATA UMUM :**

Nama : Fajri Ana Zahrotul Jannah, S.Hum.  
TTL : Klaten, 8 Juli 1999  
Jenis Kelamin : Perempuan  
Agama : Islam  
Status : Belum Kawin  
Kewarganegaraan : WNI  
Alamat : Prumpung Sawah, Cipinang Besar Utara, Jatinegara,  
Jakarta Timur  
Hobi : Menulis dan Walking Tour Sejarah Budaya Indonesia  
Motto : “*All Progress takes place outside the comfort zone*”

**PENDIDIKAN :**

**Formal** **:**

- S1, Sejarah Peradaban Islam di UIN Raden Mas Said Surakarta (2019-2023), IPK : 3.83. Bergelar Sarjana Humaniora (S.Hum).

**Non-Formal :**

- Pondok Pesantren Salafi Putri Amirul Haq (2012-2015)
- Pondok Modern Darussalam Gontor Putri Kampus 3 (2015-2016)
- Pondok Pesantren Al-Qur’aaniyyah (2016-2019)
- Pesantren Mahasiswa Fakultas Adab dan Bahasa UIN Raden Mas Said Surakarta (2019-2023).

**PENGALAMAN KERJA/ORGANISASI**

**A. Pengalaman Organisasi Formal**

1. Library Staff Islamic Teachers Training College Gontor For Girls Three (2015-2016)
2. Ketua Putri (Umi) Lembaga Studi Islam Putri MAN 1 Pandeglang (2016-2017)
3. Bendahara Umum Lembaga Studi Islam MAN 1 Pandeglang (2016-2017)
4. Tim Inti Hadrah Putri Sanggar Seni MAN 1 Pandeglang (2017-2019)
5. Tim Inti Nasyid Accapela Putri Sanggar Seni MAN 1 Pandeglang (2017-2019)
6. Divisi B OSIS MAN 1 Pandeglang (2017-2019)
7. Anggota Aktif Racana Gugus Depan KH.Agus Salim dan Rohana Kudus, Pramuka MAN 1 Pandeglang (2017-2018)
8. Sekretaris Divisi Bidang Kepenulisan Ilmiah Lembaga Semi Otonom, Riset, dan Pengembangan Ilmu Bahasa Asing (LSO Relasi) UIN Raden Mas Said Surakarta (2021-2022)
9. Kepala Divisi Kurikulum Pesantren Mahasiswa Fakultas Adab dan Bahasa UIN Raden Mas Said Surakarta (2022-2024)

**B. Pengalaman Organisasi Non-Formal**

1. Anggota Aktif Asosiasi Nasyid Nusantara Banten (2017-2018)
2. Kontributor penulis sejarahkita.com (2020-2022)
3. Anggota Perkawanan Penulis Sejarah Perempuan Yogyakarta (2023-2024)
4. Anggota KKG Wali Kelas 5 Kecamatan Klaten Utara (2023-2024)

**C. Pengalaman Kerja**

1. Asisten Dosen Jurusan Sejarah Peradaban Islam UIN Raden Mas Said Surakarta (2021-2022)
2. Tim Riset Dosen Monumen-Monumen di Daerah Istimewa Yogyakarta (2022-2023)
3. Tim Riset Film Dokumenter “Nginang Karo Ngilo”, Dana Istimewa Yogykarta, Dinas Kebudayaan Yogyakarta (2022-2023)
4. Guru Bahasa Arab MTS Ali Maksum Krapyak Yogyakarta
5. Magang Tour Guide Museum Batik Danar Hadi Solo Jawa Tengah (2022)
6. Mentor Pengajar Qur’an Pesantren Mahasiswa Fakultas Adab dan Bahasa UIN Raden Mas Said Surakarta (2021-2023)
7. Guru Mata Pelajaran Tahfidh, Qur’an, Bahasa Inggris, TIK, SDIT Nurul Akbar (2023)
8. Guru Wali Kelas 5 SDIT Nurul Akbar (2023)
9. Guru Wali Kelas 4 SDIT Nurul Akbar (2024)

**D. Pengalaman Konferensi dan Publikasi**

1. Delegasi *Presentator 9th World Conference on Women’s Studies* Thailand, Bangkok (WCWS 2023)
2. *Steering Committee The 1st Mangkunegaran International Symposium Towards a New Global History of Javanese Court Culture, Politics and Governance*
3. Publikasi Jurnal International Scopus “*Homopbhobia Over Time: A Study Of Pesantren Waria Al-Fattah Yogyakarta and Their Struggle*.
4. Mengikuti Pelatihan Pengajaran Qur’an Metode Qiro’ati, Pesantren Mahasiswa Fakultas Adab dan Bahasa.
5. Mengikuti Pelatihan Pengajaran Qur’an Metode Yanbua Kudus, SDIT Nurul Akbar
6. Mengikuti Pelatihan Sekolah Penggerak, Kurikulum Merdeka (2024)

**E. Prestasi**

1. Siwa Terbaik Jurusan Agama MAN 1 Pandeglang (2019)
2. Juara III Antar Provinsi Banten Nasyid Akhwat (2018)
3. Delegasi Fahmil Qur’an Putri MTQ Banten
4. Lulus Qiro’at Hafs 30 Juz Binnadzar, Pondok Pesantren Salafi Putri Al-Qur’aaniyyah, Pandeglang, Banten (2018)
5. Mahasiswa Terbaik Non Akademik Fakultas Adab dan Bahasa (2023)
6. Juara III Lomba Karya Tulis Ilmiah tingkat Provinsi Universitas Negeri Yogyakarta (2022)
7. Juara II Lomba Karya Tulis Ilmiah tingkat Provinsi Universitas Tidar (2021)

**F. Kemampuan Skill**

1. Menggunakan Aplikasi Word
2. Menggunakan Aplikasi Exel
3. Menggunakan Aplikasi SPSS
4. Menggunakan Aplikasi PPT
5. Membuat dan Mengelola Google Formulir
6. Membuat dan Mengkonsep Film Dokumenter Sejarah
7. Tour Guide
8. Bahasa Arab (baik)
9. Bahasa Inggris (baik)
10. Bahasa Indonesia (sangat baik)
11. Bahasa Belanda (sedang)
12. Menulis Blog, Sejarah Islam, Sejarah Indonesia
13. Public Speaking, Master Off Ceremony, Pembicara Sejarah
14. Memainkan alat music Accapela
15. Memainkan alat music hadrah, dan Qosidah

**Informasi selengkapnya dapat menghubungi:**

- **Email:** zahrazaza345@gmail.com
- **Nomor Hp/WA:** 08882784736`,

  // Tabel pendidikan dan organisasi pada halaman lama diubah menjadi daftar agar bisa diedit di editor CMS
  "dewa-alfaquin-faturangga": `**DATA UMUM :**

Nama: Dewa Alfaquin Faturangga, S.Hum.

Tempat/Tanggal Lahir: Sukoharjo, 11 Mei 2002

Alamat: Blotan 03/02, Kepuh, Nguter, Sukoharjo

Moto Hidup: Teruslah bernafas

Hobby: Travelling dan Nonton Wayang

Bidang Penelitian: Sejarah, Kebudayaan, dan Studi Islam

Pekerjaan: Wirausaha

**PENDIDIKAN:**

- SD Negeri Kepuh 03 (2007–2013)
- MTsN Sukoharjo (2013–2016)
- MAN Sukoharjo (2016–2019)
- UIN Raden Mas Said Surakarta (2020–2024)

**ORGANISASI:**

- PR PMII RAAB – Anggota Dept. Gender (2022–2023)
- PK PMII Raden Mas Said Sukoharjo – Staff Biro Keagamaan (2023–2024)
- HMPS SPI – Staff Dept. Event (2022–2023)
- HMPS SPI – CO. Dept. Senbud (2023–2024)
- HIKASI – Wakabid II Keilmuan, Riset dan Pengembangan (2022–2023)
- UKM LPM Dinamika – Staff Divisi Desgraf dan Pembukuan (2022–2023)
- DEMA UIN Surakarta – Staff Kemendikbud (2024–2025)

**AKTIVITAS LAINNYA:**

- Asisten Dosen Moh. Ashif Fuadi, M, Hum

**PRESTASI:**

- Presenter di Semdikjar 5 UNP Kediri 2022
- Presenter ICCL 2024
- Volunteer di KLS SEAQIL bidang cerpen

**KARYA:**

- RELASI INTELEKTUAL KASUNANAN SURAKARTA DENGAN PESANTREN GEBANG TINATAR TEGALSARI, JETIS, PONOROGO TAHUN 1800-1862 (Terbit di Jurnal Al-Isnad: Journal of Islamic Civilization History and Humanities Vol. 5 No. 01 2024) – (Sinta 4). [*Lihat Selengkapnya*](https://ejournal.uinsaid.ac.id/index.php/al-isnad/article/view/9624).
- “POLITIK REPRESI” MUSLIM JAWA DALAM DISKURSUS SERAT WEDHATAMA (Dipresentasikan saat Vol. 2 No. 1 (2024): Proceeding of The 2nd International Conference on Cultures & Language 2024) – (Moraref). [*Lihat Selengkapnya*](https://ejournal.uinsaid.ac.id/index.php/iccl/article/view/9723).
- Perpustakaan Rekso Pustoko, Membangun Literasi Masyarakat Abad 19 (Dipresentasikan dan terbit di jurnal Vol. 5 (2022): SEMDIKJAR 5). [*Lihat Selengkapnya*](https://proceeding.unpkediri.ac.id/index.php/semdikjar/article/view/1969).

**Informasi selengkapnya dapat menghubungi:**

- **Email:** queenalfa41@gmail.com
- **Nomor hp/wa:** 0895392703690`,
};

// Hanya diisi bila kolom masih kosong
const BIDANG: Record<string, string> = {
  "muhammad-aslambik": "Sejarah dan Studi Islam",
  "sigid-nugrohowati": "Sejarah dan Studi Islam",
  "rifky-arya-pramadana": "Sejarah Peradaban Islam",
  "iqbal-al-irfan": "Sejarah Peradaban Islam",
  "dewa-alfaquin-faturangga": "Sejarah, Kebudayaan, dan Studi Islam",
  "rina-mutoharoh": "Sejarah pers, sosial, dan politik",
};
const RINGKAS: Record<string, string> = {
  "arya-bagus-nur-ajiyanto": "Sejarawan muda asal Klaten yang aktif dalam dunia intelektual, kebudayaan, dan keagamaan.",
  "rina-mutoharoh": "Guru sejarah, lulusan Sejarah Peradaban Islam UIN Raden Mas Said Surakarta. Minat studi terkait sejarah pers, sosial dan politik.",
};

// ---- Markdown sederhana -> HTML (judul tebal, daftar, paragraf, tautan https) ----
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s: string) =>
  esc(s)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_m, a: string, u: string) => `<a href="${u}">${a}</a>`)
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

export function mdKeHtml(md: string): string {
  const out: string[] = [];
  let para: string[] = [];
  let daftar: { jenis: "ul" | "ol"; isi: string[] } | null = null;
  const tutupPara = () => {
    if (para.length) out.push(`<p>${para.join("")}</p>`);
    para = [];
  };
  const tutupDaftar = () => {
    if (daftar) out.push(`<${daftar.jenis}>${daftar.isi.map((i) => `<li>${i}</li>`).join("")}</${daftar.jenis}>`);
    daftar = null;
  };
  for (const mentah of md.split("\n")) {
    const baris = mentah.replace(/\s+$/, "");
    const patah = / {2,}$/.test(mentah);
    if (!baris.trim()) { tutupPara(); continue; } // daftar tetap terbuka melewati baris kosong
    const judul = /^(\*\*[^*]+\*\*\s*:?\s*)+$/.test(baris.trim());
    const ul = /^- (.*)$/.exec(baris);
    const ol = /^\d+\. (.*)$/.exec(baris);
    if (!ul && !ol) tutupDaftar();
    if (judul) {
      tutupPara();
      out.push(`<h3>${esc(baris.replace(/\*\*/g, "").replace(/\s+/g, " ").trim())}</h3>`);
    } else if (ul || ol) {
      tutupPara();
      const jenis = ul ? "ul" : "ol";
      if (daftar && daftar.jenis !== jenis) tutupDaftar();
      if (!daftar) daftar = { jenis, isi: [] };
      daftar.isi.push(inline((ul ?? ol)![1]));
    } else {
      para.push(inline(baris) + (patah ? "<br>" : " "));
    }
  }
  tutupPara(); tutupDaftar();
  return out.join("\n").replace(/ <\/p>/g, "</p>").replace(/<br><\/p>/g, "</p>");
}

// ---- Penghubung profil redaksi <-> akun pengguna (hanya bila cocok tunggal) ----
const kata = (s: string) => s.split(",")[0].toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter(Boolean);

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
  const timpa = process.argv.includes("--timpa");
  const sql = neon(process.env.DATABASE_URL);
  await sql`ALTER TABLE redaksi ADD COLUMN IF NOT EXISTS bio_lengkap text NOT NULL DEFAULT ''`;
  console.log("Kolom bio_lengkap siap.");

  for (const [slug, md] of Object.entries(BIO)) {
    const html = mdKeHtml(md);
    const r = timpa
      ? await sql`UPDATE redaksi SET bio_lengkap = ${html}, updated_at = now() WHERE slug = ${slug} RETURNING id`
      : await sql`UPDATE redaksi SET bio_lengkap = ${html}, updated_at = now() WHERE slug = ${slug} AND bio_lengkap = '' RETURNING id`;
    console.log((r.length ? "Biografi diisi : " : "Dilewati (sudah ada atau profil tidak ditemukan): ") + slug);
  }
  for (const [slug, v] of Object.entries(BIDANG)) await sql`UPDATE redaksi SET bidang = ${v} WHERE slug = ${slug} AND bidang = ''`;
  for (const [slug, v] of Object.entries(RINGKAS)) await sql`UPDATE redaksi SET bio = ${v} WHERE slug = ${slug} AND bio = ''`;

  const pengguna = await sql`SELECT id, name FROM users`;
  const anggota = await sql`SELECT id, name, user_id FROM redaksi ORDER BY urutan`;
  const terpakai = new Set(anggota.filter((a) => a.user_id).map((a) => Number(a.user_id)));
  for (const a of anggota.filter((x) => !x.user_id)) {
    const kA = new Set(kata(String(a.name)));
    const cocok = pengguna.filter((u) => {
      const kU = kata(String(u.name));
      return kU.length >= 2 && !terpakai.has(Number(u.id)) && kU.every((k) => kA.has(k));
    });
    if (cocok.length === 1) {
      await sql`UPDATE redaksi SET user_id = ${Number(cocok[0].id)} WHERE id = ${Number(a.id)}`;
      terpakai.add(Number(cocok[0].id));
      console.log(`Dihubungkan ke akun: ${a.name}  <->  ${cocok[0].name}`);
    } else {
      console.log(`Belum terhubung ke akun penulis: ${a.name}${cocok.length > 1 ? " (cocok lebih dari satu akun)" : ""}`);
    }
  }

  const hasil = await sql`SELECT r.name, length(r.bio_lengkap) AS biografi, (r.user_id IS NOT NULL) AS akun, (SELECT count(*)::int FROM posts p WHERE p.author_id = r.user_id AND p.status = 'published') AS tulisan FROM redaksi r ORDER BY r.urutan`;
  console.table(hasil);
}

if (process.argv[1] && /isi-biografi/.test(process.argv[1])) main().catch((e) => { console.error(e); process.exit(1); });

'@
Tulis 'scripts/isi-biografi.ts' $f0
$f1 = @'
// PAKET-12D2: tombol "Lihat Biografi" pada profil redaksi; membuka biografi lengkap di dalam kartu profil.
"use client";
import { useState } from "react";

export function BiografiLengkap({ html }: { html: string }) {
  const [buka, setBuka] = useState(false);
  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setBuka(!buka)}
        aria-expanded={buka}
        className="rounded-full border border-ms-gold/60 px-5 py-2 text-sm font-semibold text-ms-gold transition hover:bg-ms-gold/10"
      >
        {buka ? "Sembunyikan Biografi" : "Lihat Biografi"}
      </button>
      {buka && (
        <div
          className="prose prose-invert mt-5 max-w-none border-t border-ms-line pt-5 prose-headings:font-serif prose-h3:mb-2 prose-h3:mt-6 prose-h3:text-lg prose-h3:uppercase prose-h3:tracking-wide prose-p:my-2 prose-a:text-ms-gold prose-li:my-0.5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}

'@
Tulis 'src/components/content/BiografiLengkap.tsx' $f1
$f2 = @'
// PAKET-12D2: nama penulis di artikel = tautan ke halaman profil redaksi (atau halaman tulisan bila belum punya profil).
import Link from "next/link";
import type { RingkasPenulis } from "@/lib/penulis";

export function PenulisInfo({ data }: { data: RingkasPenulis }) {
  const href = data.profilSlug ? `/tentang/redaksi/${data.profilSlug}` : `/penulis/${data.id}`;
  return (
    <Link href={href} className="font-semibold text-ms-gold underline decoration-dotted underline-offset-4 hover:decoration-solid">
      {data.nama.split(",")[0]}
    </Link>
  );
}

'@
Tulis 'src/components/content/PenulisInfo.tsx' $f2
$pn = @'
// PAKET-12D2: ringkasan penulis untuk baris tanggal di artikel (ringan: hanya nama dan alamat profil)
export type RingkasPenulis = { id: number; nama: string; profilSlug: string | null };

export async function ringkasPenulis(authorId: number | null | undefined): Promise<RingkasPenulis | null> {
  if (!authorId) return null;
  try {
    const d = db();
    const [u] = await d.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, authorId)).limit(1);
    if (!u) return null;
    const [m] = await d.select({ name: redaksi.name, slug: redaksi.slug }).from(redaksi).where(and(eq(redaksi.userId, u.id), eq(redaksi.aktif, true))).limit(1);
    return { id: u.id, nama: m?.name ?? u.name, profilSlug: m?.slug ?? null };
  } catch {
    return null;
  }
}
'@
Tambah 'src/lib/penulis.ts' 'ringkasPenulis' $pn
$a0 = @'
  bio: text("bio").default("").notNull(),
'@
$b0 = @'
  bio: text("bio").default("").notNull(),
  bioLengkap: text("bio_lengkap").default("").notNull(), // HTML biografi lengkap (tombol "Lihat Biografi")
'@
Ganti 'src/db/schema.ts' $a0 $b0
$a1 = @'
import { PostCardMini } from "@/components/content/PostCardMini";
'@
$b1 = @'
import { PostCardMini } from "@/components/content/PostCardMini";
import { BiografiLengkap } from "@/components/content/BiografiLengkap";
import { sanitizeHtml } from "@/lib/sanitize";
'@
Ganti 'src/app/(situs)/tentang/redaksi/[slug]/page.tsx' $a1 $b1
$a2 = @'
            {m.bio && <p className="mt-5 whitespace-pre-line leading-relaxed text-ms-cream/85">{m.bio}</p>}
'@
$b2 = @'
            {m.bio && <p className="mt-5 whitespace-pre-line leading-relaxed text-ms-cream/85">{m.bio}</p>}
            {m.bioLengkap && <BiografiLengkap html={sanitizeHtml(m.bioLengkap)} />}
'@
Ganti 'src/app/(situs)/tentang/redaksi/[slug]/page.tsx' $a2 $b2
$a3 = @'
.orderBy(desc(posts.publishedAt)).limit(10)
'@
$b3 = @'
.orderBy(desc(posts.publishedAt)).limit(30)
'@
Ganti 'src/app/(situs)/tentang/redaksi/[slug]/page.tsx' $a3 $b3
$a4 = @'
import { ambilPenulis, buangTautanBiografiLama } from "@/lib/penulis";
'@
$b4 = @'
import { buangTautanBiografiLama, ringkasPenulis } from "@/lib/penulis";
'@
Ganti 'src/app/(situs)/artikel/[slug]/page.tsx' $a4 $b4
$a5 = @'
const penulis = await ambilPenulis(p.authorId);
'@
$b5 = @'
const penulis = await ringkasPenulis(p.authorId);
'@
Ganti 'src/app/(situs)/artikel/[slug]/page.tsx' $a5 $b5
$a6 = @'
import { PilihSumberGambar } from "@/components/admin/PilihSumberGambar";
'@
$b6 = @'
import { PilihSumberGambar } from "@/components/admin/PilihSumberGambar";
import { Editor } from "@/components/Editor";
'@
Ganti 'src/app/admin/redaksi/page.tsx' $a6 $b6
$a7 = @'
<label className="block text-sm">Bidang penelitian atau keahlian
'@
$b7 = @'
<div className="block text-sm">
          <p>Biografi lengkap (tampil saat pengunjung menekan tombol "Lihat Biografi")</p>
          <p className="mb-1 text-xs text-charcoal/60">Boleh berisi data umum, pendidikan, organisasi, karya, dan kontak. Tampilkan hanya data yang disetujui anggota yang bersangkutan.</p>
          <Editor key={`biolengkap-${m?.id ?? "baru"}`} name="bioLengkap" initial={m?.bioLengkap ?? ""} tinggi={260} />
        </div>

        <label className="block text-sm">Bidang penelitian atau keahlian
'@
Ganti 'src/app/admin/redaksi/page.tsx' $a7 $b7
$a8 = @'
import { unggahKeImageKit } from "./gambar-simpan";
'@
$b8 = @'
import { unggahKeImageKit } from "./gambar-simpan";
import { sanitizeHtml } from "./sanitize";
'@
Ganti 'src/lib/redaksi-actions.ts' $a8 $b8
$a9 = @'
    bio: s("bio", 4000),
'@
$b9 = @'
    bio: s("bio", 4000),
    bioLengkap: ((h) => (h.replace(/<[^>]*>/g, "").trim() ? h : ""))(sanitizeHtml(String(fd.get("bioLengkap") ?? "").slice(0, 60000))),
'@
Ganti 'src/lib/redaksi-actions.ts' $a9 $b9

Write-Host ""
Write-Host "== Menyiapkan data biografi dan menghubungkan akun penulis (butuh .env.local) ==" -ForegroundColor Cyan
$ErrorActionPreference = 'Continue'
npx tsx --env-file=.env.local scripts/isi-biografi.ts
Write-Host ""
Write-Host "Selesai. Jalankan: npm run dev. Buka artikel lalu klik nama penulis di bawah judul." -ForegroundColor Cyan
Write-Host "Bila ada baris merah GAGAL atau galat di atas, kirim tangkapan layarnya." -ForegroundColor Cyan
