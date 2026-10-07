/* Ilham — pendapat AI untuk satu idea, hanya bila pengguna menekan butang.
   AI di sini ialah RAKAN BERFIKIR, bukan hakim dan bukan penyorak: ia menolong
   idea yang baru lahir bergerak, menunjuk risiko dengan jujur, dan tidak
   mematikannya. Tiada simpanan teks: ilham diproses dalam ingatan, dihantar ke
   OpenAI, kemudian dilupakan sebaik permintaan selesai. */

const OPENAI = 'https://api.openai.com/v1';
const MODEL  = process.env.ILHAM_MODEL || process.env.COACH_MODEL || 'gpt-5.6-luna';
const EFFORT = process.env.COACH_EFFORT || 'none';
const MAXTOK = Number(process.env.COACH_MAX_TOKENS || 5000);
const HARD_MS = 40000;
const DAILY_CAP = Number(process.env.ILHAM_CAP || 15);
const IP_CAP    = Number(process.env.IP_CAP || 1200);

const hits = new Map();
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });
const auth = key => ({ 'content-type': 'application/json', authorization: `Bearer ${key}` });

/* Had penggunaan dikira ikut PERANTI, bukan alamat IP — sama seperti baik.mjs.
   Kiraan dalam ingatan fungsi boleh terlepas bila Netlify memulakan semula fungsi;
   ia menapis penyalahgunaan biasa, bukan kawalan kos. Kawalan kos sebenar ialah
   had belanja bulanan di platform.openai.com. */
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
    return json({ versi: 'ilham-v1', model: MODEL, had_harian: DAILY_CAP });
  if (req.method !== 'POST') return json({ error: 'POST sahaja' }, 405);

  const origin = req.headers.get('origin') || '';
  const host = new URL(req.url).host;
  if (origin && !origin.includes(host) && !/localhost|127\.0\.0\.1/.test(origin))
    return json({ error: 'Origin tidak dibenarkan' }, 403);

  const key = process.env.OPENAI_API_KEY;
  if (!key) return json({ error: 'Server belum disetkan: OPENAI_API_KEY tiada' }, 503);

  const peranti = req.headers.get('x-bob-peranti') || '';
  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || 'anon';
  if (lebihHad(peranti, ip, DAILY_CAP, IP_CAP))
    return json({ error: `Had ${DAILY_CAP} pendapat AI sehari dah dicapai. Cuba esok.` }, 429);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Body tidak sah' }, 400); }

  const nama      = String(body.nama || 'kamu').slice(0, 24);
  const ilham     = String(body.ilham || '').trim().slice(0, 600);
  const keutamaan = ['tinggi', 'sederhana', 'rendah'].includes(body.keutamaan) ? body.keutamaan : 'tiada';
  const langkah   = String(body.langkah || '').slice(0, 200);
  const siap      = (Array.isArray(body.langkah_siap) ? body.langkah_siap : [])
                      .slice(0, 5).map(x => String(x).slice(0, 160)).filter(Boolean);
  if (!ilham) return json({ error: 'Tiada ilham' }, 400);

  const sys = `Kamu BOB DYNO — rakan berfikir untuk ${nama}, pengguna Malaysia.
Dia baru menulis satu ilham: idea yang terlintas — mungkin bisnes, ubah hidup, atau bantu
masyarakat. Dia sendiri yang meminta pendapat kamu.

PERANAN KAMU:
- Rakan berfikir yang jujur. Bukan hakim, bukan penyorak. Tugas kamu menolong idea ini bergerak.
- Bahasa Melayu santai-profesional, panggil dia "kamu". Istilah teknikal boleh kekal English.
- Spesifik pada ilham INI. DILARANG nasihat generik ("buat kajian pasaran", "kekal konsisten",
  "jangan putus asa") tanpa menyatakan APA dan BAGAIMANA untuk idea ini.
- Jujur tentang risiko, tetapi jangan matikan idea. Ilham yang baru lahir memang belum lengkap.
- Kalau idea melanggar undang-undang Malaysia atau boleh membahayakan orang, nyatakan terus
  dalam "risiko".
- JANGAN janji untung atau kejayaan. JANGAN reka angka pasaran, harga atau statistik.
- Kalau dia sudah ada langkah seterusnya atau langkah yang siap, ambil kira — jangan cadang
  semula perkara yang dia sudah buat.

Jawab JSON sahaja:
{"kekuatan":"<1-2 ayat: apa yang benar-benar kuat atau menarik pada idea ini>",
 "risiko":"<1-2 ayat: perkara utama yang boleh gagal, atau yang perlu diuji dahulu>",
 "soalan":["<soalan yang menajamkan idea ini>", "<soalan kedua>", "<soalan ketiga, jika perlu>"],
 "langkah_pertama":"<1 ayat: SATU tindakan kecil dan konkrit, bawah 30 minit, untuk menguji idea ini>"}`;

  const user = [
    `Ilham: "${ilham}"`,
    `Keutamaan yang dia beri: ${keutamaan}`,
    `Langkah seterusnya yang dia tetapkan: ${langkah || 'tiada'}`,
    `Langkah yang sudah siap: ${siap.length ? siap.join('; ') : 'tiada'}`
  ].join('\n');

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

    return json({
      kekuatan: String(o.kekuatan || '').slice(0, 500),
      risiko: String(o.risiko || '').slice(0, 500),
      soalan: (Array.isArray(o.soalan) ? o.soalan : []).slice(0, 3).map(x => String(x).slice(0, 220)).filter(Boolean),
      langkah_pertama: String(o.langkah_pertama || '').slice(0, 240),
      model: MODEL
    });
  } catch (e) {
    if (e.name === 'AbortError') return json({ error: 'AI ambil masa terlalu lama. Cuba lagi.' }, 504);
    return json({ error: String(e.message || e).slice(0, 160) }, 502);
  } finally { clearTimeout(timer); }
};

export const config = { path: '/api/ilham' };
