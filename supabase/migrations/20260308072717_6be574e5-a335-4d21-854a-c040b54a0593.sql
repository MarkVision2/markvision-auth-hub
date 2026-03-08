
ALTER TABLE public.finance_months
  ADD COLUMN plan_revenue numeric NOT NULL DEFAULT 0,
  ADD COLUMN plan_expenses numeric NOT NULL DEFAULT 0,
  ADD COLUMN plan_salaries numeric NOT NULL DEFAULT 0;
