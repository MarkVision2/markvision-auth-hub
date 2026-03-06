

## Plan: Increase Font Sizes, Add Theme Toggle, Clean Up Targetologist

### 1. Increase Font Sizes Globally

Current problem: extensive use of `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-xs` (12px) throughout all pages and layout. Hard to read.

Changes:
- `src/index.css`: Set base font-size to 14px, increase minimum readable size
- `src/components/DashboardLayout.tsx`: Bump sidebar nav text from `text-xs` to `text-sm`, section headers from `text-[9px]` to `text-[11px]`, breadcrumb from `text-[11px]` to `text-sm`
- All dashboard pages (`DashboardTarget`, `DashboardSales`, `DashboardPM`, `AgencyAccounts`, `ContentFactory`, `CrmSystem`): Replace `text-[9px]`→`text-xs`, `text-[10px]`→`text-xs`, `text-[11px]`→`text-sm`, `text-xs`→`text-sm` where appropriate for readability. Table headers and badge labels stay slightly smaller but bump up 1-2 steps.
- Sheet components: same treatment

### 2. Add Light/Dark Theme Toggle

Changes:
- `src/index.css`: Add `.light` (or `:root` without `.dark`) CSS variables for light theme — white backgrounds, dark text, adjusted card/border/muted colors
- `src/components/DashboardLayout.tsx`: Add a Sun/Moon toggle button in the header next to the avatar. On click, toggle `dark` class on `<html>` element and persist choice to `localStorage`
- `src/hooks/useTheme.ts`: New hook — reads from localStorage, applies class to `document.documentElement`, returns `{theme, toggle}`
- Ensure all pages use CSS variable-based colors (they already do via `bg-background`, `text-foreground`, etc.) — verify no hardcoded `hsl(0 0% X%)` values that would break in light mode. Fix any found.

### 3. Remove Bulk Toggle Panel from Targetologist

In `src/pages/DashboardTarget.tsx`:
- Remove the "Вкл. все" and "Выкл. все" buttons (lines 293-299)
- Remove the `bulkToggleAll` function
- Keep search, status filter tabs, and export button

### Files Changed

1. `src/index.css` — add light theme variables
2. `src/hooks/useTheme.ts` — new file, theme toggle hook
3. `src/components/DashboardLayout.tsx` — theme toggle button in header, larger fonts in sidebar
4. `src/pages/DashboardTarget.tsx` — remove bulk toggle, increase fonts
5. `src/pages/DashboardSales.tsx` — increase fonts
6. `src/pages/DashboardPM.tsx` — increase fonts
7. `src/pages/AgencyAccounts.tsx` — increase fonts
8. `src/pages/Dashboard.tsx` — increase fonts
9. `src/pages/ContentFactory.tsx` — increase fonts
10. `src/pages/CrmSystem.tsx` — increase fonts
11. Sheet components — increase fonts where needed

