(() => {
  'use strict';

  const DATA = window.QUIZ_DATA || {};
  const MAPEL = [
    { id: 'sejarah', nama: 'Sejarah', ikon: '📜' },
    { id: 'pkn', nama: 'Pendidikan Pancasila', ikon: '🦅' }
  ].filter(m => DATA[m.id]);

  const JUMLAH_PG = 10;
  const MODE = [
    { id: 'pg', kunci: 'pg', nama: 'Pilihan ganda', ikon: '✏️', ket: n => `${Math.min(JUMLAH_PG, n)} soal acak dari ${n}, langsung ada pembahasan` },
    { id: 'kartu', kunci: 'flashcards', nama: 'Kartu hafalan', ikon: '🃏', ket: n => `${n} kartu, ketuk untuk melihat jawaban` },
    { id: 'urut', kunci: 'urutkan', nama: 'Urutkan', ikon: '🔢', ket: n => `${n} set, susun ke urutan yang benar` },
    { id: 'jodoh', kunci: 'jodohkan', nama: 'Menjodohkan', ikon: '🔗', ket: n => `${n} set, pasangkan kiri dan kanan` },
    { id: 'uraian', kunci: 'uraian', nama: 'Uraian', ikon: '📝', ket: n => `${n} soal, jawab dulu lalu cek poin kunci` }
  ];

  const app = document.getElementById('app');
  const KUNCI_SIMPAN = 'latihan-asas-v1';

  /* ---------- tema: otomatis (ikut HP), terang, gelap ---------- */
  const KUNCI_TEMA = 'latihan-asas-tema';
  const TEMA = ['auto', 'light', 'dark'];
  const NAMA_TEMA = { auto: 'Otomatis', light: 'Terang', dark: 'Gelap' };
  let tema = 'auto';
  try {
    const t = localStorage.getItem(KUNCI_TEMA);
    if (TEMA.includes(t)) tema = t;
  } catch (e) { /* private mode: stay on auto */ }

  function pasangTema(t) {
    tema = t;
    const akar = document.documentElement;
    if (t === 'auto') akar.removeAttribute('data-theme'); else akar.setAttribute('data-theme', t);
    try {
      if (t === 'auto') localStorage.removeItem(KUNCI_TEMA); else localStorage.setItem(KUNCI_TEMA, t);
    } catch (e) { /* not saved, still applied for this visit */ }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(akar).getPropertyValue('--ink').trim());
  }
  function tombolTema() {
    const b = el('button', { type: 'button', class: 'tema', onclick: () => {
      pasangTema(TEMA[(TEMA.indexOf(tema) + 1) % TEMA.length]);
      b.textContent = `Tampilan: ${NAMA_TEMA[tema]}`;
    } }, `Tampilan: ${NAMA_TEMA[tema]}`);
    return b;
  }

  /* ---------- helpers ---------- */
  function muat() {
    try { return JSON.parse(localStorage.getItem(KUNCI_SIMPAN)) || {}; } catch (e) { return {}; }
  }
  function simpan(id, n, t) {
    if (!t) return;
    const s = muat();
    const lama = s[id];
    if (!lama || n / t > lama.n / lama.t) {
      s[id] = { n, t };
      try { localStorage.setItem(KUNCI_SIMPAN, JSON.stringify(s)); } catch (e) { /* private mode: skip */ }
    }
  }
  function el(tag, props, ...anak) {
    const e = document.createElement(tag);
    for (const k in (props || {})) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'disabled' || k === 'hidden') e[k] = true;
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const a of anak.flat()) {
      if (a == null || a === false) continue;
      e.append(a.nodeType ? a : document.createTextNode(String(a)));
    }
    return e;
  }
  function emo(e) {
    return e ? el('span', { class: 'emo', 'aria-hidden': 'true' }, e) : null;
  }
  function uraikan(v, kelas) {
    if (v == null || v === '') return null;
    if (Array.isArray(v)) return el('ul', { class: 'butir-daftar' + (kelas ? ' ' + kelas : '') }, v.map(t => el('li', null, t)));
    return el('p', kelas ? { class: kelas } : null, v);
  }
  function ganti(node, ...anak) {
    node.replaceChildren(...anak.flat().filter(a => a != null && a !== false));
  }
  function acak(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }
  function layar(o, ...isi) {
    app.replaceChildren(
      el('header', { class: 'atas' },
        o.kembali ? el('a', { class: 'kembali', href: '#/' }, '‹ Daftar latihan') : null,
        el('h1', { class: o.besar ? 'judul besar' : 'judul' }, emo(o.ikon), o.judul),
        o.sub ? el('p', { class: 'sub' }, o.sub) : null,
        o.ekstra || null,
        o.maju ? el('div', { class: 'maju' },
          el('span', null, o.maju.label),
          el('progress', { max: o.maju.max, value: o.maju.kini, 'aria-label': o.maju.label })) : null),
      el('main', null, ...isi));
    window.scrollTo(0, 0);
  }
  function lihat(node) {
    if (node && node.scrollIntoView) node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function hasil(m, mode, n, t, satuan, tambahan, ulang) {
    simpan(`${m.id}/${mode.id}`, n, t);
    const s = muat()[`${m.id}/${mode.id}`];
    layar({ kembali: true, judul: 'Hasil', ikon: '🏁', sub: `${m.nama}, ${mode.nama.toLowerCase()}` },
      el('p', { class: 'skor' },
        el('span', { class: 'skor-angka' }, `${n}/${t}`),
        el('span', { class: 'skor-ket' }, satuan)),
      s ? el('p', { class: 'terbaik-baris' }, `Skor terbaikmu: ${s.n}/${s.t}`) : null,
      tambahan,
      el('div', { class: 'aksi' },
        el('button', { type: 'button', class: 'utama', onclick: ulang }, 'Latihan lagi'),
        el('a', { class: 'kedua', href: '#/' }, 'Pilih latihan lain')));
  }

  /* ---------- beranda ---------- */
  function beranda() {
    const skor = muat();
    layar({ judul: 'Latihan ASAS', ikon: '🎯', besar: true, sub: 'Kelas 12, semester ganjil. Pilih latihan, kerjakan di HP, ulangi sesukamu.', ekstra: tombolTema() },
      el('div', { class: 'tanda', 'aria-hidden': 'true' }),
      MAPEL.map(m => el('section', { class: 'mapel' },
        el('h2', null, emo(m.ikon), m.nama),
        el('ul', { class: 'daftar' },
          MODE.filter(md => (DATA[m.id][md.kunci] || []).length).map(md => {
            const s = skor[`${m.id}/${md.id}`];
            return el('li', null,
              el('a', { class: 'baris', href: `#/${m.id}/${md.id}` },
                el('span', { class: 'baris-teks' },
                  el('strong', null, emo(md.ikon), md.nama),
                  el('span', { class: 'ket' }, md.ket(DATA[m.id][md.kunci].length))),
                s ? el('span', { class: 'terbaik' }, `Terbaik ${s.n}/${s.t}`) : null));
          })))),
      MAPEL.length ? null : el('p', { class: 'kosong' }, 'Soal belum termuat. Periksa koneksi internet, lalu muat ulang halaman ini.'),
      el('p', { class: 'catatan' }, 'Semua soal di sini adalah soal latihan, bukan soal ujian. Skor terbaik hanya disimpan di HP ini.'));
  }

  /* ---------- 1. pilihan ganda ---------- */
  function mulaiPG(m, mode) {
    const soal = acak(DATA[m.id].pg).slice(0, JUMLAH_PG).map(q => ({
      q, opsi: acak(q.opsi.map((t, i) => ({ t, benar: i === q.jawaban })))
    }));
    let i = 0, benar = 0;
    const salah = [];

    const selesai = () => hasil(m, mode, benar, soal.length, 'jawaban benar',
      salah.length ? [
        el('h2', { class: 'bagian' }, emo('📌'), 'Yang perlu dipelajari lagi'),
        el('ul', { class: 'ulasan' }, salah.map(s => el('li', null,
          el('p', { class: 'q' }, s.q.soal),
          el('p', { class: 'salah' }, `Pilihanmu: ${s.pilih}`),
          el('p', { class: 'benar' }, `Jawaban benar: ${s.q.opsi[s.q.jawaban]}`),
          uraikan(s.q.pembahasan))))
      ] : el('p', null, 'Semua benar. Coba set soal berikutnya.'),
      () => mulaiPG(m, mode));

    const tampil = () => {
      if (i >= soal.length) return selesai();
      const { q, opsi } = soal[i];
      let dijawab = false;
      const umpan = el('div', { class: 'umpan', 'aria-live': 'polite' });
      const tombol = opsi.map((o, k) => el('button', { type: 'button', class: 'opsi', onclick: () => pilih(k) },
        el('span', { class: 'bulat', 'aria-hidden': 'true' }, 'ABCDE'[k]),
        el('span', { class: 'opsi-teks' }, o.t)));

      function pilih(k) {
        if (dijawab) return;
        dijawab = true;
        const betul = opsi[k].benar;
        if (betul) benar++; else salah.push({ q, pilih: opsi[k].t });
        tombol.forEach((b, j) => {
          b.disabled = true;
          if (j === k) b.classList.add('dipilih');
          if (opsi[j].benar) { b.classList.add('ya'); b.append(el('span', { class: 'cap' }, 'Jawaban benar')); }
          else if (j === k) { b.classList.add('tidak'); b.append(el('span', { class: 'cap' }, 'Pilihanmu')); }
        });
        const lanjut = el('button', { type: 'button', class: 'utama', onclick: () => { i++; tampil(); } },
          i === soal.length - 1 ? 'Lihat hasil' : 'Soal berikutnya');
        ganti(umpan,
          el('p', { class: betul ? 'vonis ya' : 'vonis tidak' }, betul ? 'Benar.' : 'Belum tepat.'),
          uraikan(q.pembahasan),
          lanjut);
        lihat(lanjut);
      }

      layar({ kembali: true, judul: mode.nama, ikon: mode.ikon, sub: m.nama, maju: { kini: i, max: soal.length, label: `Soal ${i + 1} dari ${soal.length}` } },
        q.topik ? el('p', { class: 'topik' }, q.topik) : null,
        q.stimulus ? el('p', { class: 'stimulus' }, q.stimulus) : null,
        el('h2', { class: 'soal' }, q.soal),
        el('div', { class: 'opsi-daftar' }, tombol),
        umpan);
    };
    tampil();
  }

  /* ---------- 2. kartu hafalan ---------- */
  function mulaiKartu(m, mode) {
    const semua = acak(DATA[m.id].flashcards);
    const antre = semua.slice();
    const diulang = new Set();
    let hafal = 0;

    const tampil = () => {
      if (!antre.length) {
        return hasil(m, mode, semua.length - diulang.size, semua.length, 'kartu langsung hafal tanpa diulang', null, () => mulaiKartu(m, mode));
      }
      const k = antre[0];
      let balik = false;
      const sisi = el('span', { class: 'kartu-sisi' }, 'Pertanyaan');
      const isi = el('span', { class: 'kartu-isi' }, k.depan);
      const petunjuk = el('span', { class: 'kartu-petunjuk' }, 'Ketuk kartu untuk melihat jawaban');
      const aksi = el('div', { class: 'aksi', hidden: true },
        el('button', { type: 'button', class: 'kedua', onclick: () => { diulang.add(k); antre.push(antre.shift()); tampil(); } }, 'Belum hafal'),
        el('button', { type: 'button', class: 'utama', onclick: () => { antre.shift(); hafal++; tampil(); } }, 'Sudah hafal'));
      const kartu = el('button', { type: 'button', class: 'kartu', 'aria-live': 'polite', onclick: () => {
        balik = !balik;
        kartu.classList.toggle('balik', balik);
        sisi.textContent = balik ? 'Jawaban' : 'Pertanyaan';
        const v = balik ? k.belakang : k.depan;
        const berdaftar = Array.isArray(v);
        isi.classList.toggle('berdaftar', berdaftar);
        ganti(isi, berdaftar
          ? el('span', { class: k.nomor ? 'kartu-daftar bernomor' : 'kartu-daftar' }, v.map(t => el('span', { class: 'kartu-butir' }, t)))
          : v);
        petunjuk.textContent = balik ? 'Ketuk kartu untuk melihat pertanyaan lagi' : 'Ketuk kartu untuk melihat jawaban';
        aksi.hidden = false;
        lihat(aksi);
      } }, sisi, isi, petunjuk);

      layar({ kembali: true, judul: mode.nama, ikon: mode.ikon, sub: m.nama, maju: { kini: hafal, max: semua.length, label: `Hafal ${hafal} dari ${semua.length} kartu` } },
        k.topik ? el('p', { class: 'topik' }, k.topik) : null,
        kartu, aksi);
    };
    tampil();
  }

  /* ---------- 3. urutkan ---------- */
  function mulaiUrut(m, mode) {
    const sets = DATA[m.id].urutkan;
    let si = 0, benarSet = 0;

    const tampil = () => {
      if (si >= sets.length) return hasil(m, mode, benarSet, sets.length, 'set tersusun benar', null, () => mulaiUrut(m, mode));
      const s = sets[si];
      const n = s.urutan.length;
      let kolam;
      do { kolam = acak(s.urutan.map((_, x) => x)); } while (n > 1 && kolam.every((v, x) => v === x));
      const taruh = [];
      let diperiksa = false;
      const badan = el('div');

      const gambar = () => {
        const sisa = kolam.filter(x => !taruh.includes(x));
        const semuaBenar = taruh.every((v, p) => v === p);
        const slot = el('ol', { class: 'slot' }, Array.from({ length: n }, (_, p) => {
          const x = taruh[p];
          const kelas = 'slot-li' + (diperiksa ? (x === p ? ' ya' : ' tidak') : '');
          return el('li', { class: kelas }, x !== undefined
            ? el('button', { type: 'button', class: 'keping', disabled: diperiksa, title: diperiksa ? null : 'Ketuk untuk mengembalikan',
              onclick: () => { taruh.splice(p, 1); gambar(); } }, s.urutan[x])
            : el('span', { class: 'slot-kosong' }, p === taruh.length ? 'Ketuk pilihan di bawah' : ''));
        }));
        const bawah = diperiksa
          ? el('div', { class: 'umpan', 'aria-live': 'polite' },
            el('p', { class: semuaBenar ? 'vonis ya' : 'vonis tidak' }, semuaBenar ? 'Urutan benar.' : 'Belum tepat.'),
            s.rincian
              ? [el('p', null, semuaBenar ? 'Rinciannya:' : 'Urutan yang benar:'),
                el('ol', { class: 'benar-daftar' }, s.rincian.map(t => el('li', null, t)))]
              : [semuaBenar ? null : el('p', null, 'Urutan yang benar:'),
                semuaBenar ? null : el('ol', { class: 'benar-daftar' }, s.urutan.map(t => el('li', null, t)))],
            uraikan(s.pembahasan),
            el('button', { type: 'button', class: 'utama', onclick: () => { si++; tampil(); } },
              si === sets.length - 1 ? 'Lihat hasil' : 'Set berikutnya'))
          : el('div', null,
            sisa.length ? el('h3', { class: 'kolam-judul' }, emo('👇'), 'Pilihan') : null,
            el('div', { class: 'kolam' }, sisa.map(x => el('button', { type: 'button', class: 'keping',
              onclick: () => { taruh.push(x); gambar(); } }, s.urutan[x]))),
            el('div', { class: 'aksi' },
              el('button', { type: 'button', class: 'utama', disabled: sisa.length > 0, onclick: () => {
                diperiksa = true;
                if (taruh.every((v, p) => v === p)) benarSet++;
                gambar();
                lihat(badan.querySelector('.umpan'));
              } }, 'Periksa urutan')));
        ganti(badan,slot, bawah);
      };

      layar({ kembali: true, judul: mode.nama, ikon: mode.ikon, sub: m.nama, maju: { kini: si, max: sets.length, label: `Set ${si + 1} dari ${sets.length}` } },
        el('h2', { class: 'soal' }, s.judul),
        el('p', { class: 'petunjuk' }, s.petunjuk || 'Ketuk pilihan satu per satu sesuai urutannya. Ketuk lagi untuk mengembalikan.'),
        badan);
      gambar();
    };
    tampil();
  }

  /* ---------- 4. menjodohkan ---------- */
  function mulaiJodoh(m, mode) {
    const sets = DATA[m.id].jodohkan;
    let si = 0, tanpaSalah = 0, totalSalah = 0;

    const tampil = () => {
      if (si >= sets.length) {
        return hasil(m, mode, tanpaSalah, sets.length, 'set selesai tanpa salah pasang',
          el('p', null, totalSalah ? `Total salah pasang: ${totalSalah} kali.` : 'Tidak ada salah pasang sama sekali.'),
          () => mulaiJodoh(m, mode));
      }
      const s = sets[si];
      const n = s.pasangan.length;
      const urutKiri = acak(s.pasangan.map((_, x) => x));
      const urutKanan = acak(urutKiri);
      const bKiri = {}, bKanan = {};
      let pilih = null, cocok = 0, salah = 0;
      const status = el('p', { class: 'ket-status', 'aria-live': 'polite' }, 'Ketuk satu kotak di kiri, lalu pasangannya di kanan.');
      const umpan = el('div', { class: 'umpan' });

      urutKiri.forEach(x => {
        bKiri[x] = el('button', { type: 'button', class: 'kotak', 'aria-pressed': 'false', onclick: () => {
          if (pilih !== null) bKiri[pilih].setAttribute('aria-pressed', 'false');
          pilih = pilih === x ? null : x;
          if (pilih !== null) bKiri[x].setAttribute('aria-pressed', 'true');
        } }, s.pasangan[x].kiri);
      });
      urutKanan.forEach(x => {
        bKanan[x] = el('button', { type: 'button', class: 'kotak', onclick: () => {
          if (pilih === null) { status.textContent = 'Pilih dulu satu kotak di kiri.'; return; }
          if (pilih === x) {
            cocok++;
            [bKiri[x], bKanan[x]].forEach(b => {
              b.disabled = true;
              b.classList.add('ya');
              b.prepend(el('span', { class: 'nomor', 'aria-hidden': 'true' }, String(cocok)));
            });
            bKiri[x].setAttribute('aria-pressed', 'false');
            pilih = null;
            status.textContent = `${cocok} dari ${n} pasangan benar.`;
            if (cocok === n) tuntas();
          } else {
            salah++;
            [bKiri[pilih], bKanan[x]].forEach(b => {
              b.classList.add('tidak');
              setTimeout(() => b.classList.remove('tidak'), 700);
            });
            status.textContent = 'Belum cocok. Coba pasangan lain.';
          }
        } }, s.pasangan[x].kanan);
      });

      function tuntas() {
        totalSalah += salah;
        if (!salah) tanpaSalah++;
        const lanjut = el('button', { type: 'button', class: 'utama', onclick: () => { si++; tampil(); } },
          si === sets.length - 1 ? 'Lihat hasil' : 'Set berikutnya');
        ganti(umpan,
          el('p', { class: 'vonis ya' }, salah ? 'Semua sudah berpasangan.' : 'Sempurna, tanpa salah pasang.'),
          salah ? el('p', null, `Salah pasang ${salah} kali di set ini. Angka pada kotak menunjukkan pasangannya.`) : null,
          lanjut);
        lihat(lanjut);
      }

      layar({ kembali: true, judul: mode.nama, ikon: mode.ikon, sub: m.nama, maju: { kini: si, max: sets.length, label: `Set ${si + 1} dari ${sets.length}` } },
        el('h2', { class: 'soal' }, s.judul),
        status,
        el('div', { class: 'jodoh' },
          el('div', { class: 'kolom' }, urutKiri.map(x => bKiri[x])),
          el('div', { class: 'kolom' }, urutKanan.map(x => bKanan[x]))),
        umpan);
    };
    tampil();
  }

  /* ---------- 5. uraian ---------- */
  function mulaiUraian(m, mode) {
    const soal = DATA[m.id].uraian;
    let i = 0, dapat = 0, total = 0;

    const tampil = () => {
      if (i >= soal.length) return hasil(m, mode, dapat, total, 'poin kunci sudah ada di jawabanmu', null, () => mulaiUraian(m, mode));
      const q = soal[i];
      const badan = el('div');
      const kotak = el('textarea', { id: 'jawaban', rows: 6 });

      const cek = () => {
        const tulisan = kotak.value.trim();
        const jumlah = el('p', { class: 'ket-status', 'aria-live': 'polite' }, `0 dari ${q.poin.length} poin dicentang.`);
        const centang = q.poin.map((p, k) => {
          const input = el('input', { type: 'checkbox', id: `poin-${k}`, onchange: () => {
            jumlah.textContent = `${centang.filter(c => c.input.checked).length} dari ${q.poin.length} poin dicentang.`;
          } });
          return { input, node: el('label', { class: 'centang', for: `poin-${k}` }, input, el('span', null, p)) };
        });
        ganti(badan,
          tulisan ? el('h3', { class: 'bagian' }, emo('✍️'), 'Jawabanmu') : null,
          tulisan ? el('p', { class: 'jawabanku' }, tulisan) : null,
          el('h3', { class: 'bagian' }, emo('🔑'), 'Poin kunci'),
          el('p', { class: 'petunjuk' }, 'Centang poin yang sudah ada di jawabanmu.'),
          el('div', { class: 'centang-daftar' }, centang.map(c => c.node)),
          jumlah,
          el('h3', { class: 'bagian' }, emo('💡'), 'Contoh jawaban'),
          uraikan(q.contoh, 'contoh'),
          el('div', { class: 'aksi' },
            el('button', { type: 'button', class: 'utama', onclick: () => {
              dapat += centang.filter(c => c.input.checked).length;
              total += q.poin.length;
              i++;
              tampil();
            } }, i === soal.length - 1 ? 'Lihat hasil' : 'Soal berikutnya')));
        lihat(badan);
      };

      badan.append(
        el('label', { class: 'label', for: 'jawaban' }, 'Tulis jawabanmu di sini atau di buku. Jawaban tidak disimpan.'),
        kotak,
        el('button', { type: 'button', class: 'utama', onclick: cek }, 'Lihat poin kunci'));

      layar({ kembali: true, judul: mode.nama, ikon: mode.ikon, sub: m.nama, maju: { kini: i, max: soal.length, label: `Soal ${i + 1} dari ${soal.length}` } },
        q.topik ? el('p', { class: 'topik' }, q.topik) : null,
        q.stimulus ? el('p', { class: 'stimulus' }, q.stimulus) : null,
        el('h2', { class: 'soal' }, q.soal),
        badan);
    };
    tampil();
  }

  /* ---------- router ---------- */
  const MULAI = { pg: mulaiPG, kartu: mulaiKartu, urut: mulaiUrut, jodoh: mulaiJodoh, uraian: mulaiUraian };
  function rute() {
    const [, idMapel, idMode] = location.hash.split('/');
    const m = MAPEL.find(x => x.id === idMapel);
    const mode = MODE.find(x => x.id === idMode);
    if (m && mode && (DATA[m.id][mode.kunci] || []).length) MULAI[mode.id](m, mode);
    else beranda();
  }
  window.addEventListener('hashchange', rute);
  pasangTema(tema);
  rute();
})();
