

## Plan: Synchronize All Modules with Real Data

### Problems Found

| Module | Status | Issue |
|--------|--------|-------|
| **Штаб-квартира** | OK | Static hub, works fine |
| **Таргетолог** | Broken | Mock campaigns hardcoded by client name — only 4 of 10 real clients show. Console ref errors with SparklineChart and DropdownMenu |
| **Продажи** | Broken | 100% mock data. Funnel stages (5) don't match CRM stages (8). No Supabase connection |
| **Управляющий** | Broken | 100% mock data. Projects, KPIs, tasks — all hardcoded |
| **Кабинеты** | OK | Connected to `agency_metrics_view`, real-time sync works |
| **Контент-Завод** | OK | Connected to Supabase |
| **CRM** | OK | Connected to `leads` table, real-time sync works |

### Core Issue
Three dashboards (Таргетолог, Продажи, Управляющий) use hardcoded mock data instead of querying real Supabase tables. The CRM uses 8 stages but the Sales funnel shows 5 different stages — they must be unified.

---

### Changes

#### 1. DashboardSales — Connect to Real Leads Data
- Fetch leads from `leads` table (same as CRM)
- Use the **same 8 stages** as CRM Kanban for the funnel visualization
- Calculate KPIs from real data: total leads, conversion rate (leads→paid), visits count, sales count
- Show real leads queue (latest leads sorted by `created_at`)
- Subscribe to real-time updates on `leads` table

#### 2. DashboardPM — Connect to Real Data
- Fetch projects from `clients_config` (each client = a project)
- Fetch leads per project to calculate visits/sales from lead stages
- Health status: derive from real lead data (green = has sales, yellow = has leads but no sales, red = no leads)
- KPIs from real aggregated data
- Keep team tasks as local state (no tasks table exists yet) — this is fine

#### 3. DashboardTarget — Fix Mock Campaigns Issue
- Since there is no `campaigns` table in Supabase, campaigns will remain mock/placeholder
- But fix the broken filter: show ALL real client accounts from `clients_config`, not just ones matching hardcoded names
- Generate placeholder campaign entries for clients without mock data so the UI isn't empty
- Fix `SparklineChart` ref warning by wrapping with `forwardRef`
- Fix `DropdownMenu` ref warning

#### 4. CRM Stages Alignment
- The CRM already uses 8 stages: `Новая заявка, Без ответа, В работе, Счет выставлен, Записан, Визит совершен, Оплачен, Отказ`
- Sales dashboard funnel will use these same stages
- "Визиты" = leads in stage "Визит совершен"
- "Продажи" = leads in stage "Оплачен"

### Files Changed

1. `src/pages/DashboardSales.tsx` — rewrite with Supabase queries, real funnel, real leads queue
2. `src/pages/DashboardPM.tsx` — rewrite KPIs and projects table with real data from `clients_config` + `leads`
3. `src/pages/DashboardTarget.tsx` — show all real clients, fix ref warnings
4. `src/components/agency/SparklineChart.tsx` — wrap with `forwardRef` to fix console error

### No database changes needed — all data already exists in `leads`, `clients_config`, and `agency_metrics_view`.

