-- ============================================================
-- תמונות קברים + מיקום GPS מדויק של קבר
-- הדבק בפרויקט kever > SQL Editor ולחץ Run (פעם אחת).
-- ============================================================

-- מיקומי קברים שהציבור שולח מהשטח
create table if not exists public.grave_locations (
  id          bigint generated always as identity primary key,
  deceased_id bigint not null references public.deceased(id) on delete cascade,
  lat         double precision not null,
  lng         double precision not null,
  accuracy    real,
  status      text not null default 'new',      -- new / rejected
  created_at  timestamptz not null default now()
);
create index if not exists grave_locations_d on public.grave_locations (deceased_id);
alter table public.grave_locations enable row level security;
drop policy if exists read_ok on public.grave_locations;
drop policy if exists add_new on public.grave_locations;
drop policy if exists edit    on public.grave_locations;
create policy read_ok on public.grave_locations for select using (status <> 'rejected' or public.is_editor());
create policy add_new on public.grave_locations for insert to anon, authenticated
  with check (status = 'new' and accuracy <= 15 and lat between 29 and 34 and lng between 34 and 36);
create policy edit on public.grave_locations for all using (public.is_editor()) with check (public.is_editor());

-- תמונות קברים להנצחה (מוצגות אחרי אישור עורך)
create table if not exists public.grave_photos (
  id          bigint generated always as identity primary key,
  deceased_id bigint not null references public.deceased(id) on delete cascade,
  path        text not null,
  status      text not null default 'pending',  -- pending / approved / rejected
  created_at  timestamptz not null default now()
);
create index if not exists grave_photos_d on public.grave_photos (deceased_id);
alter table public.grave_photos enable row level security;
drop policy if exists read_ok on public.grave_photos;
drop policy if exists add_new on public.grave_photos;
drop policy if exists edit    on public.grave_photos;
create policy read_ok on public.grave_photos for select using (status = 'approved' or public.is_editor());
create policy add_new on public.grave_photos for insert to anon, authenticated
  with check (status = 'pending' and path like 'pending/%');
create policy edit on public.grave_photos for all using (public.is_editor()) with check (public.is_editor());

-- אחסון התמונות (עד 5MB, תמונות בלבד)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('grave-photos', 'grave-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
drop policy if exists "grave photos upload" on storage.objects;
drop policy if exists "grave photos editors" on storage.objects;
create policy "grave photos upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'grave-photos' and (storage.foldername(name))[1] = 'pending');
create policy "grave photos editors" on storage.objects for delete to authenticated
  using (bucket_id = 'grave-photos' and public.is_editor());
