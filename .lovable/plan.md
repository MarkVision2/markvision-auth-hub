

## Plan: Redesign Agency Accounts Filters & UX

### Problem
Current tabs "Без лидов" and "Остановлены" are not actionable. They show static states without helping the user make decisions. The page needs smarter filtering and better information hierarchy.

### New Filter Logic

Replace current tabs with meaningful, action-oriented filters:

| Tab | Logic | Purpose |
|-----|-------|---------|
| **Все** | All accounts | Full overview |
| **Требуют внимания** | Active accounts where: spend > 0 but leads = 0, OR ROMI < 0, OR CPL is abnormally high (> 2x average) | Quickly find problem accounts |
| **Эффективные** | Active accounts where ROMI > 0 and leads > 0 | See what's working |
| **Неактивные** | `is_active === false` | Archived/paused, out of the way |

### Additional Improvements

1. **Summary KPI row** at the top of the table -- total spend, total leads, average CPL, average ROMI across all accounts. Gives instant portfolio health overview.

2. **Search input** -- filter accounts by name for quick lookup.

3. **Sortable columns** -- click column headers to sort by spend, leads, ROMI, etc. Default sort: by spend descending (biggest spenders first).

4. **Color-coded row indicators** -- subtle left border color on each row:
   - Emerald: ROMI > 0
   - Red: ROMI < 0 or spending with no leads
   - Neutral: no data yet

### Files Changed

- `src/pages/AgencyAccounts.tsx` -- new filter logic, search state, sort state, summary row, updated tabs

### No database or migration changes needed.

