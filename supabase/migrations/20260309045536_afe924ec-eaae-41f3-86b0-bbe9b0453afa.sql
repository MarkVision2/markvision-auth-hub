
-- Insert retention templates with test data
INSERT INTO retention_templates (id, name, message_prompt, project_id, sent_count, return_count, revenue_generated) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Проф. осмотр 6 мес', 'Здравствуйте, {name}! Прошло 6 месяцев с последнего визита. Запишитесь на профилактический осмотр со скидкой 15%.', 'c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5', 84, 22, 5200000),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Чек-ап 3 мес', 'Добрый день, {name}! Пора на контрольный чек-ап. Используйте промокод для бонуса.', 'c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5', 56, 14, 2800000),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Годовой ремайндер', '{name}, прошёл год! Самое время обновить план лечения. Ждём вас!', 'c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5', 32, 6, 1400000)
ON CONFLICT (id) DO NOTHING;

-- Insert retention tasks with promo codes
INSERT INTO retention_tasks (lead_id, template_id, trigger_date, promo_code, project_id, status) VALUES
  ('92d30af7-b574-4451-997f-dbb000dc9973', 'a1b2c3d4-0001-4000-8000-000000000001', '2026-03-15', 'CHECK15', 'c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5', 'pending'),
  ('1b4fd583-e2bc-4815-bd8e-099834c88628', 'a1b2c3d4-0002-4000-8000-000000000002', '2026-03-20', 'CHECKUP20', 'c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5', 'pending'),
  ('92d30af7-b574-4451-997f-dbb000dc9973', 'a1b2c3d4-0003-4000-8000-000000000003', '2026-04-01', 'YEAR2026', 'c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5', 'pending'),
  ('1b4fd583-e2bc-4815-bd8e-099834c88628', 'a1b2c3d4-0001-4000-8000-000000000001', '2026-02-10', 'CHECK15', 'c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5', 'sent'),
  ('92d30af7-b574-4451-997f-dbb000dc9973', 'a1b2c3d4-0002-4000-8000-000000000002', '2026-01-15', 'CHECKUP20', 'c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5', 'converted'),
  ('1b4fd583-e2bc-4815-bd8e-099834c88628', 'a1b2c3d4-0001-4000-8000-000000000001', '2026-01-20', 'CHECK15', 'c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5', 'converted'),
  ('92d30af7-b574-4451-997f-dbb000dc9973', 'a1b2c3d4-0003-4000-8000-000000000003', '2026-02-28', 'YEAR2026', 'c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5', 'sent'),
  ('1b4fd583-e2bc-4815-bd8e-099834c88628', 'a1b2c3d4-0002-4000-8000-000000000002', '2026-03-25', 'CHECKUP20', 'c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5', 'pending');
