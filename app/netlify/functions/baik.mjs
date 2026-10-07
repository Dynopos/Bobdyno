/* Jejak Baik — pengelasan + refleksi.
   Peraturan paling penting dalam fail ni bukan teknikal — ia etika.
   AI di sini ialah CERMIN, bukan hakim. Ia tidak mengira pahala,
   tidak menilai keikhlasan, dan tidak memuji jumlah. */

const OPENAI = 'https://api.openai.com/v1';
const MODEL  = process.env.COACH_MODEL || 'gpt-5.6-luna';
const EFFORT = process.env.COACH_EFFORT || 'none';
const MAXTOK = Number(process.env.COACH_MAX_TOKENS || 5000);
const HARD_MS = 40000;
const DAILY_CAP = Number(process.env.BAIK_CAP || 40);
const IP_CAP    = Number(process.env.IP_CAP || 1200);

const KAT = [
  { id:'pemurah',  label:'Pemurah' },
  { id:'keluarga', label:'Keluarga' },
  { id:'belas',    label:'Belas Kasihan' },
  { id:'masa',     label:'Masa & Perhatian' },
  { id:'wang',     label:'Pemberian Wang' },
  { id:'maaf',     label:'Memaafkan' },
  { id:'bantu',    label:'Membantu Orang' },
  { id:'komuniti', label:'Komuniti' },
  { id:'alam',     label:'Menjaga Alam & Kebersihan' },
  { id:'diri',     label:'Membaiki Diri' },
];
const SAH = new Set(KAT.map(k => k.id));

const hits = new Map();
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });
const auth = key => ({ 'content-type': 'application/json', authorization: `Bearer ${key}` });

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
  if (req.method === 'GET')
    return json({ versi: 'baik-v4-tanpawang', model: MODEL, kategori: KAT, had_harian: DAILY_CAP });
  if (req.method !== 'POST') return json({ error: 'POST sahaja' }, 405);

  const origin = req.headers.get('origin') || '';
  const host = new URL(req.url).host;
  if (origin && !origin.includes(host) && !/localhost|127\.0\.0\.1/.test(origin))
    return json({ error: 'Origin tidak dibenarkan' }, 403);

  const key = process.env.OPENAI_API_KEY;
  if (!key) return json({ error: 'Server belum disetkan: OPENAI_API_KEY tiada' }, 503);

  const peranti = req.headers.get('x-bob-peranti') || '';
  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || 'anon';
  if (lebihHad(peranti, ip, DAILY_CAP, IP_CAP)) return json({ error: 'Terlalu banyak permintaan hari ini. Cuba esok.' }, 429);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Body tidak sah' }, 400); }

  const mod   = ['refleksi','mingguan'].includes(body.mod) ? body.mod : 'catat';
  const teks  = String(body.teks || '').slice(0, 600);
  const latar = body.latar || {};          // ringkasan corak lepas, bukan teks penuh
  const nama  = String(body.nama || '').slice(0, 40);

  if (mod === 'catat' && !teks.trim()) return json({ error: 'Tiada teks' }, 400);

  const ETIKA = `
PERATURAN MUTLAK — LANGGAR SATU PUN, JAWAPAN KAMU SALAH:
- JANGAN sekali-kali mengira atau menyebut pahala, dosa, atau ganjaran.
- JANGAN menilai keikhlasan. Kamu tidak tahu isi hati sesiapa, dan tidak boleh berpura-pura tahu.
- JANGAN memberi markah, skor, gred, peratus, bintang, atau apa-apa bentuk penilaian.
- JANGAN membandingkan dia dengan orang lain, atau dengan "kebanyakan pengguna".
- JANGAN memuji jumlah. "Wah, 12 kebaikan minggu ni!" adalah SALAH — itu menjadikan
  kebaikan satu pertandingan dengan diri sendiri.
- JANGAN menghukum sesuatu perbuatan dari sudut hukum agama.
- JANGAN berkata dia orang baik atau kurang baik. Itu bukan kerja kamu.
- JANGAN gunakan bahasa yang membuatkan dia rasa bersalah kerana kurang mencatat.

KEBAIKAN TIDAK PERLU WANG — INI PALING KERAP DISALAH FAHAM:
Jangan sekali-kali menganggap sedekah, derma, atau belanja orang sebagai
bentuk kebaikan yang paling tinggi. Ia cuma SATU bentuk, dan ia bentuk yang
hanya mampu dilakukan oleh orang yang ada lebihan.

Semua ini kebaikan yang penuh dan sah, tidak kurang sedikit pun:
- Mengutip sampah di jalan atau di pasar.
- Membersihkan laman masjid atau surau.
- Mengalihkan batu atau dahan dari jalan supaya orang lain tidak tersadung.
- Memberi laluan kepada kereta lain.
- Senyum kepada orang yang nampak letih.
- Mengucapkan terima kasih kepada pekerja yang selalu tidak diendahkan.
- Mendengar seseorang bercakap sampai habis tanpa memotong.
- Memberi makan kucing jalanan.
- Menahan diri daripada membalas kata-kata kasar.
- Mendoakan seseorang tanpa dia tahu.
- Tidak menyebarkan sesuatu yang boleh memburukkan orang lain.

Kalau catatannya melibatkan wang, JANGAN pula memuji nilai wang itu.
Kalau catatannya TIDAK melibatkan wang, JANGAN sesekali membayangkan ia lebih kecil,
lebih ringan, atau "cuma perkara kecil". Kepada orang yang menerimanya, ia bukan kecil.

BERJAYA vs BERGUNA — INI TERAS APPS NI:
Ada dua cara manusia mengukur dirinya.
- "Berjaya" itu terkumpul dan berbanding. Sebanyak mana pun dikumpul, hati tetap
  kata belum cukup. Ukuran ini tidak pernah selesai.
- "Berguna" itu lengkap pada setiap kali. Satu kebaikan kecil kepada seorang manusia
  sudah pun bermakna, dan ia tidak perlu ditambah untuk menjadi sah.

Maka kamu DIBENARKAN — malah DIGALAKKAN — mengakui bahawa perbuatannya berguna.
Manusia perlu tahu dirinya bukan tidak bererti. Tetapi arah pandangnya mesti betul:

BOLEH (mengakui KEGUNAAN — pandang kepada orang yang menerima):
- "Malam ni ada seorang ibu yang tidak keseorangan, sebab kamu telefon."
- "Seseorang makan hari ni sebab kamu."
- "Staf itu balik ke rumah tanpa memikul rasa bersalah semalaman."

TIDAK BOLEH (memuji PENCAPAIAN — pandang kepada rekodnya sendiri):
- "Bagus! Kamu dah buat 12 kebaikan minggu ni."
- "Kamu semakin baik berbanding minggu lepas."
- "Teruskan, kamu di landasan yang betul!"
- "Kamu orang yang baik."

Bezanya mudah: ayat yang betul menunjuk kepada MANUSIA yang tersentuh.
Ayat yang salah menunjuk kepada REKOD dia sendiri, atau kepada label dirinya.

KERJA KAMU: menjadi cermin yang jujur. Tunjukkan kesan perbuatannya kepada orang lain,
bukan kedudukannya dalam senarai. Jangan menegur, jangan mengampu.`;

  let sys, user;

  if (mod === 'catat') {
    sys = `Kamu membaca satu catatan kebaikan yang ditulis seseorang untuk dirinya sendiri.
Tugas kamu: kelaskan catatan itu, dan tulis satu ayat pantulan yang pendek.
${ETIKA}

KATEGORI YANG SAH — guna id sahaja, pilih 1 hingga 3 yang paling tepat:
${KAT.map(k => `${k.id} — ${k.label}`).join('\n')}

Jawab JSON sahaja:
{"kategori":["id","id"],
 "kepada":"<siapa menerima kebaikan itu: 'diri sendiri' | 'keluarga' | 'kawan' | 'orang tak dikenali' | 'rakan kerja' | 'komuniti'>",
 "pantulan":"<SATU ayat sahaja, maksimum 22 patah perkataan. Tunjukkan KESAN perbuatan itu kepada orang yang menerimanya — sesuatu yang dia sendiri mungkin tidak perasan. Contoh yang betul: 'Malam ni ada seorang ibu yang tidak keseorangan.' atau 'Kamu beri kepada orang yang takkan dapat membalasnya.' Contoh yang SALAH: 'Bagus, teruskan!' atau 'Kamu dah 3 kali buat begini.'>"}`;
    user = `Catatan dia: "${teks}"`;
  } else if (mod === 'mingguan') {
    sys = `Kamu menulis refleksi mingguan untuk seseorang, tentang kebaikan yang dia catat
minggu ini. Nada kamu HANGAT dan bersungguh-sungguh. Ini bukan laporan sejuk —
ini surat pendek yang mengingatkan seseorang bahawa kewujudannya membawa kesan.
${ETIKA}

BERAPA HANGAT? SEHANGAT YANG BOLEH — tetapi arahnya mesti betul.
Kehangatan kamu ditumpahkan kepada MANUSIA yang menerima kebaikannya, bukan kepada
rekodnya. Semakin khusus kamu menyebut orang itu, semakin dalam ia terasa.

BOLEH, dan buatlah sepenuh hati:
- "Ada seorang ibu yang malam Selasa tu tidak makan seorang diri, sebab kamu telefon."
- "Rider tu mungkin dah lupa nama kamu. Tapi hari tu dia makan."
- "Kamu maafkan orang yang tak minta maaf. Itu bukan perkara mudah."
- "Minggu ni ada tiga orang yang harinya jadi sedikit ringan, dan mereka mungkin
   tak pernah tahu itu datang daripada kamu."

TIDAK BOLEH, walau seangkat pun:
- "Bagus! 12 kebaikan minggu ni!"  (memuji jumlah)
- "Kamu lebih baik daripada minggu lepas."  (perbandingan)
- "Teruskan, kamu di landasan yang betul!"  (bahasa pencapaian)
- "Kamu memang orang yang baik."  (melabel dirinya)

Kalau catatannya sedikit minggu ni, JANGAN tegur dan JANGAN sebut kekurangan.
Satu kebaikan pun cukup untuk ditulis dengan hormat.

Jawab JSON sahaja:
{"tajuk":"<tajuk pendek dan hangat untuk minggu ni, maksimum 8 patah perkataan>",
 "pembuka":"<2-3 ayat pembuka yang hangat. Terus kepada kesan perbuatannya pada manusia lain.>",
 "sorotan":[{"apa":"<catatan dia, diringkaskan>","kesan":"<1 ayat: apa yang berlaku kepada orang yang menerimanya. Khusus. Berperasaan.>"}],
 "corak":"<1-2 ayat tenang: bentuk kebaikan yang paling kerap muncul minggu ni>",
 "penutup":"<2-3 ayat penutup. Hangat. Ingatkan dia bahawa berguna itu sudah pun mencukupi — tidak perlu ditambah untuk jadi sah. Jangan sebut jumlah.>"}

Isi "sorotan" dengan 2 hingga 4 catatan yang paling bermakna. Jangan semua.`;
    user = `Rekod minggu ${nama ? nama + ' ' : ''}:\n${JSON.stringify(latar, null, 1)}`;
  } else {
    sys = `Kamu memantulkan corak daripada rekod kebaikan seseorang.
${ETIKA}

CARA MEMBACA CORAK:
- Namakan bahagian yang PALING KERAP muncul, dan bahagian yang HAMPIR TIADA.
- Ketidakseimbangan itu diperhatikan, bukan disalahkan. Orang yang banyak memberi wang
  tetapi kurang memberi masa bukan orang yang salah — dia cuma belum perasan coraknya.
- Kalau rekod masih sedikit, katakan terus terang bahawa masih terlalu awal untuk
  nampak apa-apa corak. JANGAN reka corak daripada tiga catatan.
- Kalau ada perubahan antara minggu, sebut perubahan itu.

Jawab JSON sahaja:
{"nampak":"<2-3 ayat: apa yang benar-benar kelihatan dalam rekodnya>",
 "jarang":"<1 ayat: bentuk kebaikan yang jarang muncul dalam rekodnya. Nyatakan sebagai pemerhatian, bukan kekurangan>",
 "cuba":"<1 ayat: satu bentuk kebaikan alternatif yang boleh dia cuba. Kecil dan konkrit. Bukan arahan — pelawaan>",
 "berguna":"<1-2 ayat: siapa yang hidupnya tersentuh oleh perbuatannya dalam tempoh ini. Sebut MANUSIA, bukan jumlah. Contoh betul: 'Dalam tempoh ni ada seorang ibu, seorang rider, dan seorang staf yang harinya jadi sedikit ringan sebab kamu.' Contoh SALAH: 'Kamu dah kumpul 12 kebaikan.'>"}`;
    user = `Ringkasan rekod ${nama ? nama + ' ' : ''}:\n${JSON.stringify(latar, null, 1)}`;
  }

  const payload = {
    model: MODEL,
    max_completion_tokens: MAXTOK,
    reasoning_effort: EFFORT,
    response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: sys }, { role: 'user', content: user }]
  };

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), HARD_MS);
  try {
    const call = b => fetch(`${OPENAI}/chat/completions`, {
      method: 'POST', headers: auth(key), body: JSON.stringify(b), signal: ac.signal });

    let res = await call(payload);
    if (res.status === 400) {
      const t = await res.clone().text();
      if (/reasoning_effort/.test(t)) { const b2 = { ...payload }; delete b2.reasoning_effort; res = await call(b2); }
      else if (/max_completion_tokens|[Uu]nsupported parameter/.test(t)) {
        const b3 = { ...payload, max_tokens: MAXTOK }; delete b3.max_completion_tokens; res = await call(b3);
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
      const r2 = await call({ ...payload, reasoning_effort: 'none', max_completion_tokens: Math.max(MAXTOK, 7000) });
      if (r2.ok) { j = await r2.json(); c = j.choices?.[0] || {}; txt = (c.message?.content || '').trim(); }
    }
    txt = txt.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    if (!txt) return json({ error: 'AI tidak menulis jawapan. Cuba lagi.' }, 502);

    let o;
    try { o = JSON.parse(txt); } catch { return json({ error: 'AI balas bukan JSON.' }, 502); }

    if (mod === 'mingguan') {
      return json({
        tajuk: String(o.tajuk || '').slice(0, 90),
        pembuka: String(o.pembuka || '').slice(0, 600),
        sorotan: (Array.isArray(o.sorotan) ? o.sorotan : []).slice(0, 4).map(x => ({
          apa: String(x.apa || '').slice(0, 200), kesan: String(x.kesan || '').slice(0, 300) })),
        corak: String(o.corak || '').slice(0, 400),
        penutup: String(o.penutup || '').slice(0, 600),
        model: MODEL
      });
    }
    if (mod === 'catat') {
      const kat = (Array.isArray(o.kategori) ? o.kategori : [])
        .map(x => String(x).toLowerCase().trim()).filter(x => SAH.has(x)).slice(0, 3);
      return json({
        kategori: kat.length ? kat : ['bantu'],
        kepada: String(o.kepada || '').slice(0, 40),
        pantulan: String(o.pantulan || '').slice(0, 200),
        model: MODEL
      });
    }
    return json({
      nampak: String(o.nampak || '').slice(0, 600),
      berguna: String(o.berguna || '').slice(0, 400),
      jarang: String(o.jarang || '').slice(0, 300),
      cuba:   String(o.cuba   || '').slice(0, 300),
      model: MODEL
    });
  } catch (e) {
    if (e.name === 'AbortError') return json({ error: 'AI ambil masa terlalu lama. Cuba lagi.' }, 504);
    return json({ error: String(e.message || e).slice(0, 160) }, 502);
  } finally { clearTimeout(timer); }
};

export const config = { path: '/api/baik' };
