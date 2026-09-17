-- سكيمة قاعدة البيانات لموقع xox العقاري
-- نفّذ السكريبت ده مرة واحدة في Supabase > SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  listing_type text not null check (listing_type in ('sale', 'rent')),
  rent_period text check (rent_period in ('monthly', 'yearly', 'daily')),
  property_type text not null,
  title text not null,
  description text default '',
  price numeric not null check (price >= 0),
  governorate text not null,
  city text default '',
  district text default '',
  area int not null check (area > 0),
  bedrooms int not null default 0 check (bedrooms >= 0),
  bathrooms int not null default 0 check (bathrooms >= 0),
  features text[] default '{}',
  images text[] default '{}',
  contact_phone text default '',
  is_featured boolean default false,
  is_published boolean default true
);

create index if not exists properties_listing_type_idx on public.properties (listing_type);
create index if not exists properties_governorate_idx on public.properties (governorate);
create index if not exists properties_city_idx on public.properties (city);
create index if not exists properties_price_idx on public.properties (price);
create index if not exists properties_created_at_idx on public.properties (created_at desc);

-- السماح بالقراءة للكل، والكتابة بحساب الأدمن فقط (سياسة بسيطة وآمنة للبداية)
alter table public.properties enable row level security;

drop policy if exists "Public read properties" on public.properties;
create policy "Public read properties"
  on public.properties for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "Authenticated full access" on public.properties;
create policy "Authenticated full access"
  on public.properties for all
  to authenticated
  using (true)
  with check (true);

-- دلو (bucket) لتخزين صور العقارات
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read property images" on storage.objects;
create policy "Public read property images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'property-images');

drop policy if exists "Authenticated upload property images" on storage.objects;
create policy "Authenticated upload property images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'property-images');

drop policy if exists "Authenticated update property images" on storage.objects;
create policy "Authenticated update property images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'property-images');

drop policy if exists "Authenticated delete property images" on storage.objects;
create policy "Authenticated delete property images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'property-images');
