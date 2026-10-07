/**
 * Bob — Self Development Apps · Enjin keputusan QUIZ
 *
 * Menulis satu bacaan peribadi berdasarkan jawapan quiz seseorang yang sedang
 * berada di titik rendah. BUKAN diagnosis kesihatan mental — bacaan tentang
 * struktur hari dia, dan langkah kecil untuk tujuh hari pertama.
 *
 * Kes berisiko TIDAK sampai ke sini — halaman quiz menahannya di klien dan
 * memaparkan talian bantuan sebenar. Fungsi ini juga menolaknya sebagai lapisan kedua.
 */

/* Ayat disahkan dari quran.com (terjemahan Abdullah Muhammad Basmeih, id 39).
   AI hanya MEMILIH satu kunci dari senarai ini — ia tidak pernah menulis ayat sendiri. */
const AYAT = [
  {
    "key": "94:5-6",
    "surah": "Al-Insyirah 94:5-6",
    "tema": "rasa berat yang berpanjangan",
    "ar": "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا\nإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    "ms": "Oleh itu, maka (tetapkanlah kepercayaanmu) bahawa sesungguhnya tiap-tiap kesukaran disertai kemudahan. (Sekali lagi ditegaskan): bahawa sesungguhnya tiap-tiap kesukaran disertai kemudahan."
  },
  {
    "key": "2:286",
    "surah": "Al-Baqarah 2:286",
    "tema": "rasa terbeban melebihi kemampuan",
    "ar": "لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    "ms": "Allah tidak memberati seseorang melainkan apa yang terdaya olehnya."
  },
  {
    "key": "13:28",
    "surah": "Ar-Ra‘d 13:28",
    "tema": "hati yang tidak tenteram, hubungan rohani terputus",
    "ar": "ٱلَّذِينَ ءَامَنُوا۟ وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ ٱللَّهِ ۗ أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ",
    "ms": "Orang-orang yang beriman dan tenang tenteram hati mereka dengan zikrullah. Ketahuilah dengan zikrullah itu, tenang tenteramlah hati manusia."
  },
  {
    "key": "13:11",
    "surah": "Ar-Ra‘d 13:11",
    "tema": "menunggu keadaan berubah sendiri, tak tahu nak mula",
    "ar": "إِنَّ ٱللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا۟ مَا بِأَنفُسِهِمْ",
    "ms": "Sesungguhnya Allah tidak mengubah apa yang ada pada sesuatu kaum sehingga mereka mengubah apa yang ada pada diri mereka sendiri."
  },
  {
    "key": "65:3",
    "surah": "At-Talaq 65:3",
    "tema": "buntu, tiada jalan nampak, tiada sokongan",
    "ar": "وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥ",
    "ms": "Dan (ingatlah), sesiapa berserah diri bulat-bulat kepada Allah, maka Allah cukuplah baginya (untuk menolong dan menyelamatkannya)."
  },
  {
    "key": "2:153",
    "surah": "Al-Baqarah 2:153",
    "tema": "perlu bertahan, perlu kekuatan harian",
    "ar": "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ ۚ إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ",
    "ms": "Wahai sekalian orang-orang yang beriman! Mintalah pertolongan dengan bersabar dan dengan (mengerjakan) sembahyang; kerana sesungguhnya Allah menyertai (menolong) orang-orang yang sabar."
  },
  {
    "key": "3:139",
    "surah": "Ali ‘Imran 3:139",
    "tema": "hilang keyakinan diri, rasa rendah diri",
    "ar": "وَلَا تَهِنُوا۟ وَلَا تَحْزَنُوا۟ وَأَنتُمُ ٱلْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ",
    "ms": "Dan janganlah kamu merasa lemah, dan janganlah kamu berdukacita, padahal kamulah orang-orang yang tertinggi jika kamu orang-orang yang (sungguh-sungguh) beriman."
  },
  {
    "key": "14:7",
    "surah": "Ibrahim 14:7",
    "tema": "lupa nikmat yang masih ada, tak nampak apa yang sudah dicapai",
    "ar": "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
    "ms": "Demi sesungguhnya! Jika kamu bersyukur nescaya Aku akan tambahi nikmatKu kepada kamu."
  },
  {
    "key": "2:216",
    "surah": "Al-Baqarah 2:216",
    "tema": "kehilangan atau kegagalan yang belum difahami hikmahnya",
    "ar": "وَعَسَىٰٓ أَن تَكْرَهُوا۟ شَيْـًٔا وَهُوَ خَيْرٌ لَّكُمْ",
    "ms": "Dan boleh jadi kamu benci kepada sesuatu padahal ia baik bagi kamu."
  },
  {
    "key": "39:53",
    "surah": "Az-Zumar 39:53",
    "tema": "rasa bersalah, rasa dosa terlalu banyak, putus asa pada diri",
    "ar": "يَـٰعِبَادِىَ ٱلَّذِينَ أَسْرَفُوا۟ عَلَىٰٓ أَنفُسِهِمْ لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ ۚ إِنَّ ٱللَّهَ يَغْفِرُ ٱلذُّنُوبَ جَمِيعًا",
    "ms": "Wahai hamba-hambaKu yang telah melampaui batas terhadap diri mereka sendiri, janganlah kamu berputus asa dari rahmat Allah, kerana sesungguhnya Allah mengampunkan segala dosa."
  }
];

const OPENAI = 'https://api.openai.com/v1';
const MODEL = process.env.QUIZ_MODEL || process.env.COACH_MODEL || 'gpt-5.6-luna';
const EFFORT = process.env.QUIZ_EFFORT || 'none';
const MAXTOK = Number(process.env.QUIZ_MAX_TOKENS || 4200);
const DAILY_CAP = Number(process.env.QUIZ_DAILY_CAP || 10);
const IP_CAP    = Number(process.env.IP_CAP || 600);
const HARD_MS = 40000;
const hits = new Map();

const auth = key => ({ 'content-type': 'application/json', authorization: `Bearer ${key}` });
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });

/* ── Had penggunaan ────────────────────────────────────────
   Dikira ikut PERANTI, bukan alamat IP.
   Sebab: pengguna mudah alih Malaysia berkongsi alamat IP awam melalui CGNAT
   pembawa (Celcom, Maxis, Digi). Kalau dihadkan ikut IP, beberapa orang sahaja
   boleh menghabiskan kuota untuk beribu-ribu orang lain di belakang IP yang sama.
   IP kekal sebagai penghadang penyalahgunaan sahaja, dengan had yang jauh lebih tinggi.

   Nota jujur: kiraan ini disimpan dalam ingatan fungsi. Netlify boleh mula semula
   atau menjalankan beberapa salinan fungsi serentak, jadi kiraan ini BOLEH terlepas.
   Ia menapis penyalahgunaan biasa — ia BUKAN kawalan kos. Kawalan kos sebenar
   hanya ada satu tempat: had belanja bulanan di platform.openai.com.
   Lihat SETUP-API-KEY.md. */
function kunciHad(peranti, ip) {
  const hari = new Date().toISOString().slice(0, 10);
  const id = (typeof peranti === 'string' && /^[a-z0-9]{6,40}$/i.test(peranti)) ? peranti : null;
  return { peranti: id ? `d:${id}|${hari}` : null, ip: `i:${ip}|${hari}` };
}
function lebihHad(peranti, ip, hadPeranti, hadIp) {
  const k = kunciHad(peranti, ip);
  if (hits.size > 20000) hits.clear();
  if (k.peranti) {
    const n = (hits.get(k.peranti) || 0) + 1; hits.set(k.peranti, n);
    if (n > hadPeranti) return true;
  }
  const m = (hits.get(k.ip) || 0) + 1; hits.set(k.ip, m);
  return m > hadIp;
}

export default async (req, context) => {
  if (req.method === 'GET') return json({ versi: 'quiz-v7-rohani', model: MODEL, had_harian: DAILY_CAP });
  if (req.method !== 'POST') return json({ error: 'POST sahaja' }, 405);

  const origin = req.headers.get('origin') || '';
  const host = new URL(req.url).host;
  if (origin && !origin.includes(host) && !/localhost|127\.0\.0\.1/.test(origin))
    return json({ error: 'Origin tidak dibenarkan' }, 403);

  const key = process.env.OPENAI_API_KEY;
  if (!key) return json({ error: 'Server belum disetkan: OPENAI_API_KEY tiada' }, 503);

  const peranti = req.headers.get('x-bob-peranti') || '';
  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || 'anon';
  if (lebihHad(peranti, ip, DAILY_CAP, IP_CAP)) return json({ error: 'Terlalu banyak percubaan hari ini. Cuba esok.' }, 429);

  let jawapan;
  try { jawapan = (await req.json()).jawapan; }
  catch { return json({ error: 'Body tidak sah' }, 400); }
  if (!jawapan) return json({ error: 'Tiada jawapan' }, 400);

  // Kes berisiko TIDAK lagi disekat — dia tetap dapat bacaan, tetapi dalam mod lembut,
  // dan klien memaparkan talian bantuan di ATAS bacaan itu.
  const bahaya = jawapan.risiko === 'kerap' || jawapan.risiko === 'kadang';

  // Bila ada risiko, kolam ayat dihadkan kepada ayat yang menenangkan sahaja.
  // Ayat seperti 13:11 (ubah diri sendiri) atau 14:7 (bersyukur) boleh terasa
  // seperti menyalahkan orang yang sedang di titik paling rendah.
  const LEMBUT = ['94:5-6', '2:286', '13:28', '65:3', '2:153', '39:53'];
  const KOLAM = bahaya ? AYAT.filter(a => LEMBUT.includes(a.key)) : AYAT;

  const sys = `Kamu BOB DYNO — jurulatih peribadi Malaysia. Moto: BUILD. INSPIRE. LEAD.
Seseorang yang sedang berada di titik rendah dalam hidup baru sahaja menjawab quiz.
Tulis satu bacaan peribadi untuk dia.

SIAPA DIA: bukan orang malas. Selalunya orang yang pernah kuat, kemudian sesuatu berlaku,
dan sekarang dia cuba bangun semula tetapi tak tahu dari mana nak mula.

NADA:
- Bahasa Melayu. Hangat tetapi tidak mengasihani. Bercakap dengan dia sebagai manusia dewasa.
- HARAM: "you got this", "semangat!", "semua akan okay", "rezeki tak ke mana", ayat motivasi kosong.
- HARAM juga: bahasa klinikal atau diagnosis ("anda mengalami kemurungan", "simptom", "gangguan").
  Kamu BUKAN doktor. Kamu bercakap tentang STRUKTUR HARI dia, bukan keadaan mentalnya.
- Akui beratnya dahulu sebelum bercakap tentang langkah. Jangan terus melompat ke penyelesaian.
- Rujuk jawapan SEBENAR dia. Kalau dia kata dah setahun, sebut setahun. Jangan umum.

DATA YANG KAMU TERIMA ialah keadaan sebenar bahagian hidup dia: kewangan, kerja/bisnes,
rumah tangga, keluarga/anak, kesihatan, tidur, solat, dan sokongan sosial.

CARA BACA DATA ITU:
- Cari bahagian yang paling BERDARAH dahulu, dan namakannya terus. Jangan berselindung.
- Kalau hutang menghimpit atau baru hilang kerja — itu bukan masalah "motivasi".
  Jangan beri nasihat tabiat kepada masalah wang. Akui ia masalah struktur, dan
  langkah kamu mesti mengurangkan tekanan sebenar, bukan menambah kerja.
- Kalau rumah tangga bergaduh atau baru berpisah — itu menghabiskan tenaga lebih daripada
  apa-apa kerja. Jangan suruh dia bangun pagi untuk bersenam kalau malamnya dia tak tidur.
- Kalau tidur rosak, hampir semua nasihat lain akan gagal. Pertimbangkan tidur dahulu.
- Kalau kesihatan ada penyakit tak terkawal, langkah pertama ialah berjumpa doktor —
  katakan begitu, jangan cuba selesaikan sendiri.
- Bahagian yang dia kata "bukan masalah utama" ialah KEKUATAN dia. Sebut sekurang-kurangnya
  satu kekuatan itu — orang di titik rendah lupa mereka masih ada yang berfungsi.

PRINSIP NASIHAT — ini paling penting:
- Orang di titik rendah GAGAL dengan sasaran besar. Beri langkah yang kecil sampai
  hampir memalukan kecilnya. "Lima minit" bukan "satu jam". "Sekali" bukan "setiap hari".
- Satu langkah mesti boleh dibuat walaupun pada hari paling teruk dia.
- Pilih SATU bahagian hidup sahaja untuk dipulihkan dahulu. Jangan suruh dia baiki semuanya serentak.
- Kalau dia kata tiada siapa tahu keadaannya, sentuh perkara itu — keterasingan biasanya
  punca yang lebih besar daripada disiplin.

Balas HANYA objek JSON sah:
{"tajuk":"<3-6 patah perkataan yang menamakan keadaan dia dengan tepat dan bermaruah>",
 "nampak":["<2-4 ayat pemerhatian, setiap satu merujuk jawapan sebenar dia>"],
 "punca":"<2-3 ayat: apa yang sebenarnya sedang berlaku pada struktur harinya>",
 "bahagian_berdarah":"<namakan bahagian hidup yang paling teruk sekarang, dalam 2-5 patah perkataan: cth 'Kewangan dan hutang', 'Tidur yang rosak', 'Rumah tangga yang sejuk'>",
 "kekuatan":"<1 ayat: apa yang MASIH berfungsi dalam hidup dia, rujuk jawapan dia>",
 "mula_dari":"<nama SATU bahagian app: Ilmu Baru|Kemahiran|Keluarga|Impak Sosial|Rohani|Kesihatan>",
 "kenapa_mula_situ":"<1-2 ayat kenapa bahagian itu dahulu>",
 "langkah":[{"bila":"<cth: Malam ni>","apa":"<tindakan sangat kecil dan konkrit>"},
            {"bila":"<cth: 3 hari pertama>","apa":"<...>"},
            {"bila":"<cth: Minggu pertama>","apa":"<...>"}],
 "kenapa_rekod":"<3-4 ayat. INI PALING PENTING — baca arahan di bawah.>",
 "ayat_pilihan":"<kunci SATU ayat dari senarai di bawah yang paling kena dengan keadaan dia>",
 "ayat_kaitan":"<2-3 ayat: kenapa ayat itu untuk dia, dikaitkan dengan jawapan sebenar dia. Jangan berceramah.>",
 "penutup":"<1-2 ayat. Jujur, tidak manis-manis. Boleh keras sedikit kalau perlu.>"}

SENARAI AYAT — pilih SATU sahaja dengan menyebut kuncinya:
${KOLAM.map(a => `${a.key} — sesuai untuk: ${a.tema}`).join('\n')}

ARAHAN UNTUK "kenapa_rekod" — jangan jadikan ini iklan:
Terangkan kenapa MENCATAT setiap hari itu penting KHUSUS untuk keadaan dia. Guna jawapannya sendiri:
- Kalau dia kata percubaan lepas "padam dalam beberapa hari" atau "jatuh balik" —
  sebabnya bukan dia lemah; tiada apa yang merekod kemajuannya, jadi bila dia tergelincir
  sekali, otaknya simpulkan dia tak pernah bergerak langsung. Catatan memutuskan kitaran itu.
- Kalau dia kata tak ingat bila kali terakhir dia bangga — itu bukan kerana tiada apa berlaku,
  tetapi kerana tiada apa yang menyimpannya. Otak menyimpan kegagalan lebih kuat daripada kejayaan kecil.
- Kalau dia kata tiada siapa tahu keadaannya — catatan menjadi saksi sementara,
  sehingga dia sanggup memberitahu manusia.
- Kalau harinya "berubah-ubah" — catatan yang menunjukkan corak, dan corak yang boleh dibaiki.
Tulis sebagai sebab, bukan sebagai jualan. JANGAN sebut perkataan "app", "aplikasi",
"muat turun" atau "install" — sistem akan menyambungnya sendiri selepas ayat kamu.

TAHAP YANG SUDAH DIKIRA:
Sistem sudah mengira tahap keterukan dia dengan peraturan tetap, dan menghantarnya
dalam medan "tahap" (Singa / Buaya / Kucing Hutan / Semut) dan "tahap_skor" (0-100).
JANGAN pertikaikan tahap itu dan jangan kira semula. Tulis bacaan yang SEPADAN dengannya:
- Singa: jangan kecilkan. Akui ini berat. Langkah mesti sangat kecil — orang di tahap ni
  tiada tenaga untuk pelan besar. Sebut bantuan luar (doktor, kaunselor, orang yang dipercayai).
- Buaya: namakan apa yang sedang menggigit dan tidak melepaskan. Fokus menghentikan pendarahan.
- Kucing Hutan: dia masih pegang tali. Boleh cabar dia sedikit.
- Semut: jangan buat-buat serius. Akui dia okey, dan tunjuk apa yang boleh dikukuhkan.

BAHAGIAN YANG DIA SENDIRI TANDA:
Medan "bahagian_mencabar" ialah senarai yang DIA sendiri pilih sebagai paling mencabar.
Itu suaranya sendiri — dahulukan senarai itu daripada tekaan kamu. Kalau senarai itu panjang
(4 ke atas), jangan cuba jawab semua; namakan satu yang paling merbahaya dan katakan terus
terang bahawa yang lain akan lebih mudah selepas yang itu berkurang.

BILA HENDAK MEMBAWA DIA DEKAT KEPADA AGAMA — BACA INI BETUL-BETUL:
Ini bahagian paling mudah disalah buat. Peraturannya:

1. Kalau dia sendiri menanda "hubungannya dengan Allah" dalam bahagian_mencabar,
   ATAU keadaan_solat menunjukkan dia jauh (lama tidak solat / lebih banyak tinggal):
   itu JEMPUTAN. Dia baru beritahu kamu dia rasa jauh. Maka langkah rohani BOLEH jadi
   langkah pertama — tetapi mesti sangat kecil dan tanpa syarat.
   Contoh yang betul: "Malam ni, satu solat sahaja. Yang mana-mana. Tak perlu ganti yang lepas."
   Contoh yang SALAH: "Kembalilah solat lima waktu, itu punca semua masalah kamu."
   JANGAN sekali-kali kata kesusahan dia berlaku KERANA dia tinggal solat. Itu menghukum,
   dan ia tidak benar — orang yang solat pun diuji.

2. Kalau dia TIDAK menanda bahagian agama dan solatnya masih terjaga:
   JANGAN jadikan agama sebagai langkah utama. Dia tidak minta itu, dan hidupnya sedang
   berdarah di tempat lain. Ayat Al-Quran di hujung sudah memadai sebagai sentuhan rohani.

3. Kalau dia jawab "tidak nak jawab" pada soalan solat:
   Hormati itu sepenuhnya. Jangan sentuh soal ibadah langsung dalam langkah. Ayat masih
   boleh diberi, tetapi sebagai pujukan, bukan teguran.

4. Untuk sesiapa pun: bawa dia DEKAT, jangan tolak dia jauh. Nada seorang kawan yang
   membukakan pintu, bukan seorang ustaz yang menegur di atas mimbar. Tiada perkataan
   "sepatutnya kamu", "kamu lalai", "itu balasan".

UMUR — GUNAKAN, JANGAN ABAIKAN:
Medan "umur" menentukan apa yang realistik untuk dia. Nasihat yang sama tidak sesuai
untuk semua usia:
- 18-24: masa masih panjang, tetapi jangan merendahkan masalahnya sebagai "muda lagi".
- 25-44: selalunya terhimpit antara tanggungjawab keluarga dan kerjaya yang belum stabil.
- 45-54: kurang masa untuk membina semula dari kosong. Cadangan mesti menggunakan
  pengalaman yang dia sudah ada, bukan menyuruh dia bermula dari sifar.
- 55 ke atas: JANGAN cadangkan tukar kerjaya atau mula bisnes baharu melainkan dia
  sendiri menyebutnya. Fokus kepada kesihatan, ketenangan, dan hubungan.

DATA BARU YANG KAMU ADA — GUNAKAN:
- "kehilangan": kalau ada kematian, perceraian, atau bisnes runtuh — itu berduka, bukan
  masalah motivasi. Jangan sekali-kali suruh orang berduka jadi lebih produktif.
- "cara_dia_lari": kalau dia lari ke judi, itu bahaya kewangan DAN emosi — sebut terus.
  Kalau skrol telefon berjam-jam, itu mati rasa, bukan malas. Jangan menghukum.
- "tenaga_pagi" + "tidur" + "keadaan_fikiran": kalau tiga-tiga teruk, itu tanda badan dan
  fikiran dah kehabisan. Cadangkan dia jumpa doktor sebelum apa-apa pelan diri.
- "ada_dinantikan": kalau tiada apa dinantikan, langkah pertama patut mencipta satu
  perkara kecil untuk dinantikan dalam masa terdekat.
${bahaya ? `
MOD LEMBUT — WAJIB DIPATUHI:
Orang ini menanda ada terlintas rasa mahu menyakiti diri. Maka:
- JANGAN beri pelan produktiviti atau sasaran mingguan.
- Langkah pertama MESTI: memberitahu satu manusia, atau menghubungi talian bantuan,
  atau berjumpa doktor. Bukan tabiat, bukan senaman, bukan kewangan.
- JANGAN janji "semua akan okey". JANGAN suruh dia lebih bersyukur atau lebih banyak berdoa
  seolah-olah itu puncanya. Itu menambah rasa bersalah.
- JANGAN sebut cara, kaedah, atau butiran apa-apa bentuk mencederakan diri.
- Nada: tenang, pendek, tidak panik, tidak mengasihani. Akui beratnya tanpa membesarkannya.
- Dalam "penutup", nyatakan dengan jelas bahawa bercakap dengan orang terlatih adalah
  langkah paling masuk akal sekarang — bukan tanda lemah.
` : ''}
PERATURAN AYAT — WAJIB:
- Kamu HANYA memilih kunci. JANGAN sesekali menulis teks Arab atau terjemahan sendiri.
- Teks ayat akan dimasukkan oleh sistem dari sumber yang disahkan.
- Dalam "ayat_kaitan", jangan berkhutbah dan jangan menghukum. Hubungkan ayat itu dengan
  keadaan sebenar dia, dengan hormat. Kalau dia jarang solat, jangan tegur soal itu —
  bawa dia dekat, jangan tolak dia jauh.`;

  const body = {
    model: MODEL,
    max_completion_tokens: MAXTOK,
    reasoning_effort: EFFORT,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: 'Jawapan quiz dia:\n' + JSON.stringify(jawapan, null, 1) }
    ]
  };

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), HARD_MS);

  try {
    const call = b => fetch(`${OPENAI}/chat/completions`, {
      method: 'POST', headers: auth(key), body: JSON.stringify(b), signal: ac.signal
    });

    let res = await call(body);
    if (res.status === 400) {
      const t = await res.clone().text();
      if (/reasoning_effort/.test(t)) { const b2 = { ...body }; delete b2.reasoning_effort; res = await call(b2); }
      else if (/max_completion_tokens|[Uu]nsupported parameter/.test(t)) {
        const b3 = { ...body, max_tokens: MAXTOK }; delete b3.max_completion_tokens; res = await call(b3);
      }
    }

    if (!res.ok) {
      const t = await res.text();
      return json({ error:
        res.status === 401 ? 'API key server ditolak (401).'
        : res.status === 429 ? (/quota|billing|insufficient/i.test(t) ? 'Kredit OpenAI habis.' : 'Terlalu sibuk, cuba lagi.')
        : `Ralat OpenAI ${res.status}` }, 502);
    }

    let j = await res.json();
    let c = j.choices?.[0] || {};
    let txt = (c.message?.content || '').trim();

    if (!txt || c.finish_reason === 'length') {
      const r2 = await call({ ...body, reasoning_effort: 'none', max_completion_tokens: Math.max(MAXTOK, 5000) });
      if (r2.ok) { j = await r2.json(); c = j.choices?.[0] || {}; txt = (c.message?.content || '').trim(); }
    }

    txt = txt.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    if (!txt) return json({ error: 'AI tidak menulis jawapan. Cuba lagi.' }, 502);

    let o;
    try { o = JSON.parse(txt); }
    catch { return json({ error: 'AI balas bukan JSON: ' + txt.slice(0, 80) }, 502); }

    const KAT = ['Ilmu Baru', 'Kemahiran', 'Keluarga', 'Impak Sosial', 'Rohani', 'Kesihatan'];
    return json({
      tajuk: String(o.tajuk || '').slice(0, 80),
      nampak: (o.nampak || []).slice(0, 4).map(x => String(x).slice(0, 300)),
      punca: String(o.punca || '').slice(0, 500),
      bahagian_berdarah: String(o.bahagian_berdarah || '').slice(0, 80),
      kekuatan: String(o.kekuatan || '').slice(0, 300),
      mula_dari: KAT.includes(o.mula_dari) ? o.mula_dari : 'Kesihatan',
      kenapa_mula_situ: String(o.kenapa_mula_situ || '').slice(0, 300),
      langkah: (o.langkah || []).slice(0, 3).map(l => ({
        bila: String(l.bila || '').slice(0, 40), apa: String(l.apa || '').slice(0, 220)
      })),
      penutup: String(o.penutup || '').slice(0, 300),
      kenapa_rekod: String(o.kenapa_rekod || '').slice(0, 600),
      ayat: (KOLAM.find(a => a.key === o.ayat_pilihan) || KOLAM[0]),
      ayat_kaitan: String(o.ayat_kaitan || '').slice(0, 400),
      model: MODEL
    });
  } catch (e) {
    if (e.name === 'AbortError') return json({ error: 'AI ambil masa terlalu lama. Cuba lagi.' }, 504);
    return json({ error: String(e.message || e).slice(0, 160) }, 502);
  } finally { clearTimeout(timer); }
};

export const config = { path: '/api/quiz' };
