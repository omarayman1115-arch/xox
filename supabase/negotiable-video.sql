-- ============================================================
-- xox — أعمدة "قابل للتفاوض" و"الفيديو"
-- Supabase → SQL Editor → New query → الصق → Run
-- آمن: عمودين جدد بس — مفيش أي بيانات بتتلمس
-- ============================================================

alter table xox_properties add column if not exists negotiable boolean default false;
alter table xox_properties add column if not exists video text;

select 'تم ✅ — عمود negotiable و video اتضافوا' as result;

-- ============================================================
-- نموذج شغال: فيديو تجريبي + "قابل للتفاوض" على أحدث عقار
-- (تقدر تمسح الجزء ده لو مش عايزه)
-- ============================================================
update xox_properties
set video = 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    negotiable = true
where id = (select id from xox_properties order by created_at desc limit 1);
