/**
 * Bob Dyno — AI Coach proxy (OpenAI)
 *
 * Aliran: dashboard → rule engine (dalam app) → Luna tulis saranan.
 * Rule engine dah kira skor sebelum ni, jadi Luna cuma perlu mentafsir, bukan mengira.
 *
 * Pengguna TAK PERNAH nampak API key. Key duduk sebagai environment variable
 * di Netlify (OPENAI_API_KEY) dan hanya wujud di server ini.
 */

const OPENAI = 'https://api.openai.com/v1';
const MODEL = process.env.COACH_MODEL || 'gpt-5.6-luna';   // tier murah, high-volume
const DAILY_CAP = Number(process.env.COACH_DAILY_CAP || 8);
const IP_CAP    = Number(process.env.IP_CAP || 400);
const EFFORT = process.env.COACH_EFFORT || 'none';  // 'none'|'low'|'medium'|'high'
const MAXTOK = Number(process.env.COACH_MAX_TOKENS || 6000);
const HARD_MS = 45000;                              // batal sebelum had 60s Netlify
const hits = new Map();

const auth = key => ({ 'content-type': 'application/json', authorization: `Bearer ${key}` });

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

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

/* Model baharu guna max_completion_tokens; model lama guna max_tokens.
   Cuba yang baharu dulu, tukar automatik kalau API tolak. */
async function callOpenAI(key, body, legacyTokens = false, signal) {
  const b = { ...body };
  if (legacyTokens) { b.max_tokens = b.max_completion_tokens; delete b.max_completion_tokens; }
  return fetch(`${OPENAI}/chat/completions`, {
    method: 'POST', headers: auth(key), body: JSON.stringify(b), signal
  });
}

export default async (req, context) => {
  /* GET = diagnosis. Tunjuk versi kod yang hidup + keadaan key, TANPA dedah key. */
  if (req.method === 'GET') {
    const k = process.env.OPENAI_API_KEY || '';
    return json({
      versi: 'openai-v3-sunyi',
      pembekal: 'OpenAI',
      env_dijangka: 'OPENAI_API_KEY',
      key_ada: !!k,
      key_panjang: k.length,
      key_bermula_sk: k.startsWith('sk-'),
      key_ada_ruang_kosong: /\s/.test(k),
      env_lama_anthropic_masih_ada: !!process.env.ANTHROPIC_API_KEY,
      model: MODEL,
      effort: EFFORT,
      max_tokens: MAXTOK,
      had_harian: DAILY_CAP
    });
  }

  if (req.method !== 'POST') return json({ error: 'POST sahaja' }, 405);

  const origin = req.headers.get('origin') || '';
  const host = new URL(req.url).host;
  if (origin && !origin.includes(host) && !/localhost|127\.0\.0\.1/.test(origin)) {
    return json({ error: 'Origin tidak dibenarkan' }, 403);
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) return json({ error: 'Server belum disetkan: OPENAI_API_KEY tiada' }, 503);

  const peranti = req.headers.get('x-bob-peranti') || '';
  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || 'anon';
  if (lebihHad(peranti, ip, DAILY_CAP, IP_CAP)) return json({ error: `Had ${DAILY_CAP} report sehari dah dicapai. Cuba esok.` }, 429);

  let payload;
  try { payload = (await req.json()).payload; }
  catch { return json({ error: 'Body tidak sah' }, 400); }
  if (!payload) return json({ error: 'Tiada data hari' }, 400);

  const nama = String(payload.nama || 'kamu').slice(0, 24);

  const sys = `Kamu BOB DYNO — jurulatih peribadi untuk pengguna Malaysia bernama ${nama}. Moto: BUILD. INSPIRE. LEAD.
Tugas: tulis report malam untuk hari ini.

PERATURAN:
- Bahasa Melayu santai-profesional (mentor yang rapat, bukan motivator murahan). Istilah teknikal boleh kekal English.
- Suara tegas, yakin, sedikit garang bila perlu — tapi sentiasa berpihak pada ${nama}.
- JUJUR. Kalau hari tu lemah, cakap terus terang dengan hormat. Jangan memuji tanpa asas.
- Panggil dia "${nama}" dalam report.
- "skor_enjin" ialah hasil rule engine yang dah dikira sebelum ini. Guna sebagai asas —
  kerja kamu ialah MENTAFSIR dan MENASIHAT, bukan mengira semula.

CATATAN SUNYI — BACA INI SEBELUM MENYENTUHNYA:
Medan "catatan_sunyi_hari_ini" ialah kebaikan yang ${nama} catat untuk dirinya sendiri,
dalam bahagian app yang memang direka TANPA markah. Ia dihantar kepada kamu supaya
kamu faham harinya dengan lebih penuh — bukan untuk dinilai.
- JANGAN masukkan ia ke dalam skor atau bintang. Sentuhannya tidak menaikkan markah.
- JANGAN memuji jumlahnya. "Bagus, 4 kebaikan hari ni!" adalah SALAH.
- JANGAN sebut pahala, ganjaran, atau keikhlasan.
- Kamu BOLEH menyebutnya sekali, secara tenang, kalau ia menjelaskan sesuatu tentang
  harinya — contohnya kalau dia kata dia tak buat apa-apa hari ni, tetapi catatannya
  menunjukkan dia luangkan masa dengan keluarga. Itu maklumat, bukan pujian.
- Kalau tiada catatan, JANGAN sebut langsung dan jangan tegur.

PROSES WAJIB — ikut turutan ini:

LANGKAH 1 — ANALISA SETIAP AKTIVITI SATU PERSATU.
Untuk SETIAP aktiviti dalam senarai (jangan tinggal mana-mana, jangan gabungkan dua jadi satu):
  - jenis   : "praktik" (buat/hasilkan sesuatu), "serapan" (baca/tengok/dengar),
              "hubungan" (masa dengan manusia), "penjagaan" (badan/rohani), atau "pengurusan" (admin/rutin).
  - nilai   : nilai SEBENAR aktiviti ni pada hidup dia — bukan pujian umum. Kalau kecil, cakap kecil.
  - lemah   : apa yang hilang atau cetek pada aktiviti ni SPESIFIK.
              Rujuk nota dia (atau ketiadaan nota) sebagai bukti.
  - naik_taraf : SATU langkah konkrit untuk menaikkan aktiviti INI ke tahap seterusnya, bawah 30 minit.
  - skor    : 1-10 untuk kedalaman aktiviti ni sahaja.

Guna "aktiviti_7_hari" untuk semak PROGRESS: pengulangan tanpa kemajuan, atau kesinambungan yang naik tahap?

LANGKAH 1B — SEMAK SARANAN KAMU SENDIRI SEMALAM.
Kalau "saranan_semalam" ada isi, semak satu persatu: mana ditunaikan, mana tidak.
Kalau "balasan_pengguna_semalam" ada isi, itu jawapan dia pada saranan kamu — ambil kira alasannya.
Kalau munasabah, ubah pendekatan; kalau ia alasan mengelak, tegur dengan hormat.
Kalau "balasan_pengguna_hari_ini" ada isi, JAWAB terus balasan tu dalam verdict.

LANGKAH 1C — GUNA MEMORI JANGKA PANJANG.
"memori" ialah apa yang kamu ingat tentang dia dari hari-hari sebelum ini:
  - memori.fakta  : perkara tetap tentang dia (kerja, keluarga, kemahiran, halangan berulang)
  - memori.corak  : corak tingkah laku yang kamu dah kesan sebelum ni
  - memori.janji  : perkara yang dia sendiri kata dia akan buat, dengan status
"trend" ialah perbandingan 7 hari ini lawan 7 hari sebelumnya, dikira oleh rule engine.

Kamu MESTI bercakap sebagai orang yang kenal dia lama:
  - Rujuk sekurang-kurangnya SATU perkara dari memori atau trend dalam verdict.
  - Kalau ada janji berstatus "terbuka" yang dah lama, sebut dan tanya.
  - Kalau trend menunjukkan kemerosotan, sebut angkanya. Kalau naik, akui dengan angka.
  - Jangan ulang nasihat yang sama macam sebelum ni kalau ia jelas tak berkesan — tukar pendekatan.

LANGKAH 2 — baru buat kesimpulan.
verdict, fix dan next MESTI terbit daripada analisa Langkah 1 dan merujuk aktiviti sebenar dengan namanya.
DILARANG nasihat generik yang boleh ditampal pada sesiapa ("kekalkan momentum", "teruskan usaha").
Kalau tiada apa nak dikritik, cari perkara paling hampir gagal dan terangkan kenapa.

LANGKAH 3 — bintang, berdasarkan KUALITI & KEDALAMAN sahaja.
Kuantiti TIDAK menaikkan bintang. Sepuluh aktiviti cetek = bintang rendah. Satu aktiviti dalam = bintang tinggi.

LANGKAH 4 — KEMAS KINI MEMORI.
Keluarkan "memori_baru" untuk disimpan bagi hari-hari akan datang:
  - fakta : HANYA fakta baharu yang kekal dan berguna untuk masa depan (maks 3 hari ini).
            Jangan ulang fakta yang dah ada dalam memori. Jangan rekod perkara remeh sehari.
  - corak : corak baharu yang kamu kesan (maks 2). Mesti berdasarkan sekurang-kurangnya 3 hari data.
  - janji : perkara yang dia komit buat, dari aktiviti/refleksi/balasan dia hari ini (maks 3).
            Untuk janji sedia ada, kembalikan dengan status dikemas kini:
            "terbuka" (belum), "selesai" (dah dibuat), "gugur" (dia sendiri batalkan atau dah lapuk).
  - progression : 1-2 ayat tentang ke mana dia bergerak secara keseluruhan sejak mula.

Balas HANYA objek JSON sah, tiada teks lain, ikut turutan kunci ini:
{"analisa":[{"tajuk":"<tajuk aktiviti persis seperti diberi>","jenis":"<praktik|serapan|hubungan|penjagaan|pengurusan>",
  "nilai":"<1-2 ayat>","lemah":"<1-2 ayat>","naik_taraf":"<1 ayat, konkrit>","skor":<1-10>}, ...satu untuk SETIAP aktiviti],
 "stars":<1-5, boleh .5>,
 "verdict":"<2-3 ayat, rujuk analisa di atas>",
 "fix":["<kelemahan merentas hari ini, rujuk aktiviti tertentu>", ...max 4],
 "next":["<tindakan konkrit esok, terbit dari naik_taraf di atas>", ...max 4],
 "memori_baru":{"fakta":["<fakta kekal baharu>", ...max 3],
                "corak":["<corak baharu>", ...max 2],
                "janji":[{"teks":"<komitmen>","status":"<terbuka|selesai|gugur>"}, ...max 3],
                "progression":"<1-2 ayat arah keseluruhan dia sejak mula>"}}`;

  /* PENTING: pada model penaakulan, max_completion_tokens merangkumi token BERFIKIR.
     Kalau terlalu kecil, semua habis pada fasa berfikir dan content jadi kosong. */
  const body = {
    model: MODEL,
    max_completion_tokens: MAXTOK,
    reasoning_effort: EFFORT,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: 'Data hari ini:\n' + JSON.stringify(payload, null, 1) }
    ]
  };

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), HARD_MS);

  try {
    let res = await callOpenAI(key, body, false, ac.signal);

    // Parameter tak disokong → cuba bentuk lama / tanpa reasoning_effort
    if (res.status === 400) {
      const t = await res.clone().text();
      if (/reasoning_effort/.test(t)) {
        const b2 = { ...body }; delete b2.reasoning_effort;
        res = await callOpenAI(key, b2, false, ac.signal);
      } else if (/max_completion_tokens|[Uu]nsupported parameter/.test(t)) {
        res = await callOpenAI(key, body, true, ac.signal);
      }
    }

    if (!res.ok) {
      const t = await res.text();
      const msg =
        res.status === 401 ? `API key OpenAI ditolak (401). Panjang key yang server nampak: ${key.length} aksara${/\s/.test(key)?' (ADA RUANG KOSONG — ini puncanya)':''}. Key sah biasanya 100+ aksara dan bermula "sk-". Buat key baharu, tampal semula, redeploy.`
        : res.status === 403 ? 'Key tiada kebenaran untuk model ini (403).'
        : res.status === 404 ? `Model "${MODEL}" tiada pada akaun ini. Tukar COACH_MODEL di Netlify.`
        : res.status === 429 ? (/quota|billing|insufficient/i.test(t)
            ? 'Kredit OpenAI habis — top up di platform.openai.com/settings/organization/billing'
            : 'Terlalu banyak permintaan serentak. Cuba lagi sekejap.')
        : `Ralat OpenAI ${res.status}`;
      return json({ error: msg, detail: t.slice(0, 200) }, 502);
    }

    let j = await res.json();
    let choice = j.choices?.[0] || {};
    let txt = (choice.message?.content || '').trim();

    /* Jawapan kosong / terpotong = bajet token habis pada fasa berfikir.
       Cuba sekali lagi tanpa berfikir langsung dan bajet lebih besar. */
    if (!txt || choice.finish_reason === 'length') {
      const b2 = { ...body, reasoning_effort: 'none', max_completion_tokens: Math.max(MAXTOK, 9000) };
      const r2 = await callOpenAI(key, b2, false, ac.signal);
      if (r2.ok) {
        j = await r2.json();
        choice = j.choices?.[0] || {};
        txt = (choice.message?.content || '').trim();
      }
    }

    txt = txt.replace(/^```(json)?/i, '').replace(/```$/, '').trim();

    if (!txt) {
      const u = j.usage || {};
      return json({ error: `AI habiskan bajet token tanpa menulis jawapan `
        + `(sebab: ${choice.finish_reason || 'tidak diketahui'}; token berfikir: `
        + `${u.completion_tokens_details?.reasoning_tokens ?? '?'} / ${u.completion_tokens ?? '?'}). `
        + `Naikkan COACH_MAX_TOKENS di Netlify.` }, 502);
    }

    let out;
    try { out = JSON.parse(txt); }
    catch {
      return json({ error: `AI balas dalam format bukan JSON (${choice.finish_reason || '-'}). Petikan: ` + txt.slice(0, 90) }, 502);
    }

    return json({
      analisa: (out.analisa || []).slice(0, 12).map(a => ({
        tajuk: String(a.tajuk || ''), jenis: String(a.jenis || ''),
        nilai: String(a.nilai || ''), lemah: String(a.lemah || ''),
        naik_taraf: String(a.naik_taraf || ''),
        skor: Math.max(1, Math.min(10, Number(a.skor) || 5))
      })),
      stars: Math.max(1, Math.min(5, Number(out.stars) || 3)),
      verdict: String(out.verdict || ''),
      fix: (out.fix || []).slice(0, 4).map(String),
      next: (out.next || []).slice(0, 4).map(String),
      memori_baru: {
        fakta: (out.memori_baru?.fakta || []).slice(0, 3).map(x => String(x).slice(0, 180)),
        corak: (out.memori_baru?.corak || []).slice(0, 2).map(x => String(x).slice(0, 180)),
        janji: (out.memori_baru?.janji || []).slice(0, 6).map(j => ({
          teks: String(j.teks || '').slice(0, 160),
          status: ['terbuka', 'selesai', 'gugur'].includes(j.status) ? j.status : 'terbuka'
        })).filter(j => j.teks),
        progression: String(out.memori_baru?.progression || '').slice(0, 400)
      },
      model: MODEL
    });
  } catch (e) {
    if (e.name === 'AbortError')
      return json({ error: `AI ambil masa lebih ${HARD_MS/1000}s dan dibatalkan. Kurangkan bilangan aktiviti hari ini, atau set COACH_EFFORT=none di Netlify.` }, 504);
    return json({ error: String(e.message || e).slice(0, 160) }, 502);
  } finally {
    clearTimeout(timer);
  }
};

export const config = { path: '/api/coach' };
