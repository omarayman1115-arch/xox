-- ============================================================
-- xox — إضافة خانة ملاحظات للعملاء (نفّذها مرة واحدة)
-- Supabase → SQL Editor → New query (فاضي) → الصق → Run
-- ============================================================

alter table public.leads
  add column if not exists note text not null default '';
