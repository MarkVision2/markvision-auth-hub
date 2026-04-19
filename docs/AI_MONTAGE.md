# ИИ Монтаж — статус и следующие шаги

## Что уже сделано (2026-04-18)

### База данных (Supabase, проект `iywmjdrghcbsicdwohmb`)
Применена миграция `ai_edit_pipeline_schema` + `ai_edit_renders_bucket`:

- `ai_edit_projects` — проект на каждое загруженное видео (стиль, формат, статус, прогресс).
- `ai_edit_segments` — EDL (caption / zoom / broll / sfx / music / cut / transition).
- `ai_edit_renders` — версии рендеров.
- `ai_edit_style_presets` — пресеты стилей субтитров (засеяно 3: `viral_hormozi`, `minimal_clean`, `business_clinic`).
- `ai_edit_assets` — B-roll/SFX/музыка (загруженные, сгенерированные, стоковые).
- `ai_edit_cost_ledger` — учёт стоимости каждого шага.
- RLS включён везде; `service_role` (n8n) обходит политики.
- Storage bucket `ai-edit-renders` (public read, 500 МБ лимит, MP4/MOV/WebM).
- Существующий bucket `content_assets` переиспользуется для исходников.

### Frontend
`src/components/content/ai-edit/AiEditBlock.tsx` переведён на новую архитектуру:
- Загрузка исходников в `content_assets`.
- Создание строки в `ai_edit_projects` напрямую через Supabase client.
- Триггер пайплайна через POST на n8n webhook (`VITE_N8N_AI_MONTAGE_URL`).
- Подписка на изменения через Supabase Realtime (`postgres_changes` на `ai_edit_projects` + `ai_edit_renders`).
- Удалены старые ссылки на несуществующие `/api/ai-edit` и `/api/ai-edit-status`.

### n8n workflow
**`AI Montage — Pipeline Orchestrator`** (id `QZ6yB6KH3bUKXVdX`):
1. `Webhook: start` — `POST /webhook/ai-montage-start { projectId, taskToken }`
2. `Supabase: fetch project` — забирает все настройки из `ai_edit_projects`
3. `Status: transcribing` — обновляет `progress=15`
4. `OpenAI Whisper (STT)` — `whisper-1` с `timestamp_granularities[word]`
5. `Status: analyzing` — `progress=40`
6. `Claude: analyze transcript` — `claude-sonnet-4-6`, возвращает highlights/zoom_points/broll_prompts/sfx_triggers/scenes
7. `Save segments + status: generating_broll` — code-нода: преобразует слова в `caption` сегменты + добавляет zoom/broll/sfx
8. `Supabase: insert segments` — массовый INSERT через `jsonb_array_elements`
9. `Pexels: fetch B-roll videos` — Code-нода, fetch к `api.pexels.com/videos/search` по каждому `broll_prompts[].query`.
10. `Supabase: insert B-roll assets` — массовый INSERT в `ai_edit_assets`.
11. `Status: rendering` — `progress=85`.
12. `Call Remotion render API` — POST на `https://markvision.kz/api/ai-edit-render` с `{projectId, taskToken}`. Эндпоинт сам сохраняет готовый MP4 в bucket `ai-edit-renders`, вставляет строку в `ai_edit_renders` и выставляет `status=completed` / `failed`.

Workflow **активирован**. Webhook живёт на `https://n8n.zapoinov.com/webhook/ai-montage-start`.

### Render API (`api/ai-edit-render.js`)
- `POST /api/ai-edit-render { projectId, taskToken }`
- Вытаскивает project + segments + assets из Supabase, мапит в `AutoEditCompositionProps`, бандлит Remotion (`src/remotion/index.ts`), рендерит `AutoEdit` / `AutoEditSquare` через `@remotion/renderer`.
- Загружает MP4 в bucket `ai-edit-renders`, INSERT в `ai_edit_renders` (`status=completed`), обновляет `ai_edit_projects.status=completed`.
- При любой ошибке — `status=failed` + `error_message`.
- Требует env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_EDIT_RENDER_TOKEN` (опциональный shared secret).

## Что нужно от вас, чтобы поехало

### 1. Отозвать скомпрометированный kie.ai ключ ⚠️
Старый ключ был в чате. Зайдите в kie.ai dashboard → Revoke → создайте новый. **Новый положите ТОЛЬКО в n8n credentials**, не присылайте сюда.

### 2. Завести API-ключи в n8n
В n8n UI → Credentials добавить:
- `OPENAI_API_KEY` → переменная окружения n8n (для Whisper)
- `ANTHROPIC_API_KEY` → переменная окружения n8n (для Claude)
- `KIE_AI_API_KEY` → новый ключ
- `PEXELS_API_KEY` → бесплатно на pexels.com/api
- `ELEVENLABS_API_KEY` → для SFX (опционально)

### 3. Frontend env
В `.env` приложения:
```
VITE_N8N_AI_MONTAGE_URL=https://n8n.zapoinov.com/webhook/ai-montage-start
```

### 4. Активировать workflow в n8n
После добавления ключей — Activate.

## Дорожная карта (что осталось)

### Спринт 1 — допилить пайплайн (3-5 дней)
- [x] Pexels-интеграция для B-roll (Code-нода в n8n).
- [x] Remotion render endpoint `api/ai-edit-render.js` подключён к n8n.
- [ ] Добавить Veo-провайдер для случаев, когда Gemini ставит `provider=veo` в `broll_prompts` (сейчас падают в pexels-фолбэк).
- [ ] Заменить `OpenAI Whisper` на **WhisperX** на RunPod (русский word-level точнее) или AssemblyAI.
- [ ] Стресс-тест Vercel serverless на длинных видео (>3 мин) — скорее всего упрёмся в 300s timeout, тогда выносить рендер на Fly.io / Lambda.

### Спринт 2 — Remotion композиции и стили (5-7 дней)
- [ ] Форк `remotion-dev/template-captions` в `packages/remotion/`
- [ ] Реализовать 3 React-компонента стилей по конфигу из `ai_edit_style_presets`
- [ ] Auto-zoom через MediaPipe Face Landmarker + Light-ASD + Kalman smoother
- [ ] B-roll overlay композиция (PiP / fullscreen cuts)
- [ ] SFX track (Web Audio API в композиции)

### Спринт 3 — таймлайн-редактор (7-10 дней)
- [ ] Форк `designcombo/react-video-editor` (MIT) → новый таб «Редактор»
- [ ] CRUD операций над `ai_edit_segments` (drag/resize/delete/replace)
- [ ] `@remotion/player` — мгновенное preview без рендера
- [ ] Кнопка «Перерендерить» — создаёт новую версию в `ai_edit_renders`

### Спринт 4 — продакшн и биллинг (3-5 дней)
- [ ] Credit-система: списание по `ai_edit_cost_ledger`
- [ ] Лимиты на пользователя (`max_renders_per_month`)
- [ ] Webhook от kie.ai callback (для async видео-генерации)
- [ ] E2E тест: 5-мин видео → готовый MP4 ≤ 3 мин

## Ссылки на источники
- Remotion: https://remotion.dev/ (Company License: https://remotion.dev/license)
- kie.ai: https://docs.kie.ai/ , https://kie.ai/market
- WhisperX (RU word-level): https://github.com/m-bain/whisperX
- designcombo timeline (MIT): https://github.com/designcombo/react-video-editor
- Submagic-clone (Next.js + Python worker): https://github.com/javierMorales9/youtube-clipper
- MoneyPrinterTurbo (полный пайплайн, 55.9k⭐): https://github.com/harry0703/MoneyPrinterTurbo

## Risk / лицензионные оговорки
- **Remotion** — source-available, для SaaS с командой 4+ нужна Company License (~$15/seat/мес). Альтернатива: Revideo (MIT) с меньшей экосистемой.
- **kie.ai** — proxy, может ограничить квоты. Для продакшна продумать fallback на прямые API провайдеров.
- **OpenAI Sora** закрыт 25.03.2026. Не закладываемся.

## Стоимость (примерная) на 1 видео 5 мин
- Whisper API: ~$0.03
- Claude analyze: ~$0.05
- Veo 3.1 (10 сек B-roll, 5 шт): ~$7.50 — основная статья расходов
- Pexels: $0
- Remotion Lambda render: ~$0.05
- **Итого: ~$0.10 без B-roll, до $7.50 с генерацией Veo**

→ Поэтому B-roll по умолчанию через Pexels, Veo только когда LLM явно требует уникальную сцену.
