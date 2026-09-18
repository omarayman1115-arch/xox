-- ============================================================
-- xox — ترحيل جدول الليدز (نفّذه مرة واحدة)
-- الجدول القديم (بتاع موقع الكمبوندات) فاضي ومفيهوش بيانات،
-- فبنستبدله بالجدول الجديد بالأعمدة المطلوبة.
-- Supabase → SQL Editor → New query (فاضي) → الصق → Run
-- ============================================================

drop table if exists public.leads;

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.xox_properties(id) on delete set null,
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  phone_number text not null check (char_length(phone_number) between 8 and 20),
  status text not null default 'not_contacted' check (status in ('contacted', 'not_contacted')),
  created_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);

alter table public.leads enable row level security;

-- أي زائر يقدر يبعت ليد (من فورم التواصل)
create policy "anyone can submit a lead"
  on public.leads for insert
  to anon, authenticated
  with check (true);

-- القراءة للأدمن المسجل فقط
create policy "admin can read leads"
  on public.leads for select
  to authenticated
  using (true);

-- تعديل الحالة (تم التواصل / لم يتم) للأدمن المسجل فقط
create policy "admin can update leads"
  on public.leads for update
  to authenticated
  using (true)
  with check (true);

-- مفيش سياسة حذف للعامة — الحذف بيتم من السيرفر فقط (service key بعد تحقق الأدمن)
