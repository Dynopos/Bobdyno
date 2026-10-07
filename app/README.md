# Bob Dyno — NADI (bobdyno.my)

Kod app yang dihoskan di Netlify, projek `bobdyno`, https://bobdyno.my.

## Tetapan Netlify

| Medan | Nilai |
| --- | --- |
| Base directory | `app` |
| Build command | *(kosong)* |
| Publish directory | `.` (ditetapkan dalam `app/netlify.toml`) |
| Functions directory | `netlify/functions` (ditetapkan dalam `app/netlify.toml`) |

Pemboleh ubah persekitaran (ditetapkan dalam Netlify, bukan dalam repo):
`OPENAI_API_KEY`, `STATS_KEY`, serta had pilihan `COACH_MODEL`,
`COACH_DAILY_CAP`, `BAIK_CAP`, `IP_CAP`, `QUIZ_MODEL`, `QUIZ_DAILY_CAP` dan
yang berkaitan.

## Kandungan

- `index.html` — app utama: Catatan Sunyi, Hari Ini, Progress, Ilham, Rekod
- `quiz.html` — quiz "Kembali Bangun"
- `stats.html` — papan angka peribadi (perlu `STATS_KEY`)
- `notis-privasi.html`
- `sw.js`, `manifest.json`, `icons/` — PWA
- `netlify/functions/` — `/api/baik`, `/api/coach`, `/api/kira`, `/api/quiz`

Bila `index.html` berubah, naikkan `VERSION` dalam `sw.js` supaya cache
luar talian dikemas kini.
