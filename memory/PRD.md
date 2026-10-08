# HSU Campus — Produktanforderungen (PRD)

## Ziel
Mobile Campus-App für Studierende der Helmut-Schmidt-Universität / Universität der
Bundeswehr Hamburg (Expo + FastAPI + MongoDB).

## Nutzerentscheidungen
- KI-Modell: OpenAI **gpt-5.5** (Emergent LLM Key)
- Daten: Beispieldaten in der DB **und** manuelle Eingabe durch den Nutzer
- Anmeldung: E-Mail/Passwort (JWT) **und** Google-Login (Emergent-managed)
- Sprache: Deutsch als Standard, Deutsch/Englisch umschaltbar

## Implementierter Umfang (MVP, Phase 1 + 2)
- Auth: Registrierung, Login, Google-Login, `/api/auth/me`, Profil-Update
- Home-Dashboard: Begrüßung, Noten-/ECTS-Kennzahlen, Schnellzugriffe, KI-CTA, heutige Veranstaltungen
- Stundenplan: Tagesauswahl Mo–Fr, Anlegen/Löschen von Veranstaltungen
- Noten: Durchschnitt (ECTS-gewichtet), Trimester-Gruppen, Anlegen/Löschen
- Mensa: Wochentagsauswahl, Gerichte mit Preisen (Stud./Bedienstete) und Tags
- Campus-News: Hero-Artikel + Liste, Detailansicht im Modal
- KI-Studienassistent: Streaming-Chat (SSE), Verlauf in MongoDB, Vorschlags-Chips
- Dunkelmodus (automatisch nach Systemeinstellung, `src/theme.ts` `dark`-Palette)
- Profil & Einstellungen: Sprache, Name, Studiengang, Abmelden

## Architektur
Backend `/app/backend`: `server.py` (App + Lifespan), `db.py`, `auth_utils.py`,
`seed.py`, `routes/{auth,academic,campus,ai}.py`
Frontend `/app/frontend`: `src/{api.ts,auth.tsx,i18n.tsx,theme.ts,components/*}`,
Routen in `app/` (`sign-in`, `(tabs)/{index,schedule,assistant,profile}`,
`grades`, `mensa`, `news`, `settings`)

## API
- `POST /api/auth/register|login|session`, `GET|PATCH /api/auth/me`
- `GET|POST /api/schedule`, `DELETE /api/schedule/{entry_id}`
- `GET|POST /api/grades`, `DELETE /api/grades/{grade_id}`
- `GET /api/mensa?day=YYYY-MM-DD`, `GET /api/news`
- `POST /api/ai/chat` (SSE), `GET|DELETE /api/ai/messages`

## Datenmodelle (MongoDB)
- `users`: user_id, email, name, hashed_password?, picture?, language, study_program?, provider
- `user_sessions`: session_token, user_id, expires_at (TTL)
- `schedule`: entry_id, user_id, title, type, professor, location, weekday(0–6), start_time, end_time
- `grades`: grade_id, user_id, semester, course, ects, grade
- `mensa`: menu_id, date (ISO), category, name, price_student, price_staff, tags[]
- `news`: news_id, title, summary, body, category, image_url, published_at
- `ai_messages`: message_id, user_id, role, content, created_at

## Design
HSU-Crimson `#9D1B22`, iOS-Native-Clean, Ionicons, 4 Bottom-Tabs
(siehe `/app/design_guidelines.json`).

## Offen / Backlog
- Push-Benachrichtigungen (nur auf Wunsch)
- Echte HSU-Datenquellen (Stundenplan/Mensa-Schnittstellen)
