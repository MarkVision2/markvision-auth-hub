# MarkVision Auth Hub

Мультитенантная SaaS-платформа для стоматологических клиник и маркетинговых
агентств: CRM, управление рекламой, аналитика, генерация контента с AI и
автоматизация рабочих процессов через n8n.

Продакшн: **[markvision.kz](https://markvision.kz)**

---

## Содержание

- [Что это](#что-это)
- [Ключевые модули](#ключевые-модули)
- [Стек](#стек)
- [Архитектура](#архитектура)
- [Локальный запуск](#локальный-запуск)
- [Переменные окружения](#переменные-окружения)
- [Структура репозитория](#структура-репозитория)
- [Деплой](#деплой)
- [Безопасность](#безопасность)
- [Поддержка](#поддержка)

---

## Что это

MarkVision — это единая рабочая среда для стоматологических клиник, где
маркетолог, руководитель продаж, главврач и врач работают в одной системе с
разделением прав (RBAC). Платформа покрывает полный цикл: привлечение лидов из
рекламы → CRM → продажи → удержание, плюс контент-фабрику на AI для
социальных сетей.

Проект разрабатывается для реальной сети клиник (пилот — **Стоматология Уали**)
и мигрирует от ручного управления к автоматизации на базе Supabase и n8n.

## Ключевые модули

| Модуль | Что делает |
|---|---|
| **Auth & RBAC** | Supabase Auth, роли: Admin, Manager, Doctor, Agency |
| **Dashboard** | Единая панель с KPI по ролям (PM, Sales, Target, HQ) |
| **CRM** | Лиды, сделки, карточки пациентов, WhatsApp-интеграция через n8n |
| **Ad Management** | Запуск и контроль кампаний Meta Ads (Facebook/Instagram) |
| **Competitor Spy** | Парсинг рекламы конкурентов через Meta Ad Library + AI-разбор |
| **Content Factory** | Генерация Reels / сценариев / монтажа через AI (OpenAI, Gemini, Remotion) |
| **Auto-posting** | Публикация контента в соцсети через n8n |
| **Diagnostics** | Терминал для врача: история пациента, план лечения |
| **Quality Control** | Оценка работы отдела продаж, скоринг звонков |
| **Retention & LTV** | Аналитика удержания и пожизненной ценности клиента |
| **Finance** | Учёт выручки, расходов, ROI по источникам трафика |
| **AI Reports / AI ROP** | AI-ассистент руководителя продаж, авто-отчёты |
| **Scoreboard** | Геймификация команды продаж |
| **Schedule** | Планировщик записи пациентов |

## Стек

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **State / Data:** TanStack Query, Supabase JS SDK
- **UI / Motion:** Radix Primitives, Framer Motion
- **Forms / Validation:** react-hook-form + Zod
- **Video:** Remotion (рендер AI-монтажей)
- **Backend-as-a-Service:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Serverless:** Vercel Functions (`/api/*.js`) — Node.js 24 / Fluid Compute
- **Автоматизация:** n8n ([n8n.zapoinov.com](https://n8n.zapoinov.com))
- **Тесты:** Vitest (unit) + Playwright (E2E)
- **CI/CD:** Vercel (авто-деплой из `main`)

## Архитектура

```
┌──────────────────┐        ┌──────────────────────────┐
│  React SPA       │◄──────►│  Supabase (Postgres+Auth)│
│  (Vite on Vercel)│        │  RLS per tenant          │
└────────┬─────────┘        └──────────────┬───────────┘
         │                                  │
         │ JWT                     Edge Fns │
         ▼                                  ▼
┌──────────────────┐        ┌──────────────────────────┐
│  Vercel /api     │        │  n8n Workflows           │
│  AI edit, render │◄──────►│  WhatsApp, Meta, AI      │
│  IG webhook      │        │  Content analysis        │
└────────┬─────────┘        └──────────────┬───────────┘
         │                                  │
         ▼                                  ▼
   OpenAI / Gemini               Meta Ads, Instagram,
   Remotion renderer             Airtable, Speechmatics
```

- **Изоляция клиентов:** Row-Level Security на всех таблицах через
  `project_members.project_id`.
- **Секреты:** `service_role` ключ хранится только в Vercel env и Supabase —
  никогда не попадает в клиентский бандл.
- **Webhooks:** `/api/ig-webhook.js` (Instagram), n8n-endpoints с shared token.

## Локальный запуск

Требования: **Node.js 20+** и **npm 10+**.

```bash
git clone https://github.com/MarkVision2/markvision-auth-hub.git
cd markvision-auth-hub
npm install
cp .env.example .env.local
# заполните VITE_SUPABASE_* и остальные ключи
npm run dev
```

Открыть: `http://localhost:5173`.

### Команды

| Команда | Описание |
|---|---|
| `npm run dev` | Vite dev server с HMR |
| `npm run build` | Продакшн-сборка в `dist/` |
| `npm run preview` | Превью продакшн-сборки |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit-тесты) |
| `npm run test:watch` | Vitest в watch-режиме |
| `npm run remotion:studio` | Remotion Studio для редактирования шаблонов видео |
| `npm run remotion:render` | Рендер Remotion-композиции `AutoEdit` |

## Переменные окружения

Переменные с префиксом `VITE_` попадают в клиентский бандл и **публично
видны**. Туда можно класть только безопасные по дизайну значения (Supabase URL
и anon key, защищённые через RLS).

### Клиент (VITE_*)

| Переменная | Назначение |
|---|---|
| `VITE_SUPABASE_URL` | URL Supabase-проекта |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Публичный anon-ключ Supabase |
| `VITE_SUPABASE_PROJECT_ID` | ID проекта Supabase |
| `VITE_PROJECT_ID` | UUID рабочего пространства по умолчанию |
| `VITE_N8N_CAMPAIGN_LAUNCH_URL` | Webhook запуска рекламной кампании |
| `VITE_N8N_WA_SEND_WEBHOOK` | Webhook отправки WhatsApp-сообщений |
| `VITE_N8N_SCRAPE_HEAVY_URL` | Webhook глубокого парсинга рекламы |
| `VITE_N8N_SCRAPE_LIGHT_URL` | Webhook лёгкого парсинга рекламы |
| `VITE_N8N_AI_MONTAGE_URL` | Webhook AI-монтажа |
| `VITE_BOOST_WEBHOOK_URL` | Webhook буста поста |

### Сервер (только в Vercel env, **никогда не `VITE_*`**)

| Переменная | Назначение |
|---|---|
| `SUPABASE_URL` | URL Supabase (серверная часть) |
| `SUPABASE_SERVICE_ROLE_KEY` | Сервисный ключ (полный доступ к БД, обходит RLS) |
| `AI_EDIT_RENDER_TOKEN` | Shared token для `/api/ai-edit-render` |

> **Важно.** Любые приватные ключи (OpenAI, Airtable PAT, Speechmatics,
> Gemini) должны проксироваться через Supabase Edge Function или Vercel API —
> не через переменные `VITE_*`.

## Структура репозитория

```
markvision-auth-hub/
├── api/                      # Vercel serverless (AI edit, IG webhook)
├── docs/                     # Проектная документация
├── e2e/                      # Playwright-тесты
├── public/                   # Статика
├── scripts/                  # Утилитные скрипты, миграции
├── src/
│   ├── components/           # UI по доменам (crm, ai-rop, content, spy, ...)
│   ├── hooks/
│   ├── integrations/supabase # Клиент и типы Supabase
│   ├── lib/                  # ad-library-api, ai-agent, утилиты
│   ├── pages/                # Маршрутные страницы
│   ├── remotion/             # Шаблоны видео
│   └── test/                 # Unit-тесты
├── supabase/
│   ├── config.toml
│   ├── functions/            # Edge Functions (lovable-webhook, spy-proxy и т.д.)
│   └── migrations/           # SQL-миграции схемы + RLS-политик
├── vercel.json
└── vite.config.ts
```

## Деплой

Автоматический: push в `main` → Vercel собирает и публикует на
`markvision.kz`. Предварительные деплои создаются для каждого PR.

Supabase-миграции применяются через `supabase db push` или через Supabase
Dashboard → SQL Editor.

## Безопасность

Полное описание политики — в [SECURITY.md](./SECURITY.md). Коротко:

- Row-Level Security включена на всех мультитенантных таблицах.
- Сервисный ключ Supabase — только в Vercel env, никогда в клиенте.
- Приватные API-ключи проксируются через серверные функции.
- Dependabot + `npm audit` проверяют зависимости.
- Отчёты об уязвимостях: **zapoinov95@gmail.com** (не через публичные issues).

## Поддержка

- **Владелец проекта:** Yuri MarkVision · zapoinov95@gmail.com
- **n8n:** [n8n.zapoinov.com](https://n8n.zapoinov.com)
- **Продакшн:** [markvision.kz](https://markvision.kz)

---

© 2026 MarkVision. Проприетарный код. Все права защищены.
