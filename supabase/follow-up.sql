-- ============================================================
-- xox — موعد المتابعة التالي لكل عميل
-- Supabase → SQL Editor → New query → الصق → Run
-- آمن: عمود واحد جديد بس — مفيش أي بيانات بتتلمس
-- ============================================================

alter table leads add column if not exists follow_up date;

select 'تم ✅ — عمود follow_up اتضاف لجدول leads' as result;
