-- ============================================================
-- אנשי קשר, מכיני מצבות, דיווחים מהציבור
-- הדבק בפרויקט kever > SQL Editor ולחץ Run (פעם אחת).
-- ============================================================

create table if not exists public.cemetery_contacts (
  id          bigint generated always as identity primary key,
  cemetery_id text not null references public.cemeteries(id) on delete cascade,
  category    text not null default 'office',   -- office / council / maker / other
  name        text not null,
  role        text,
  phone       text,
  notes       text,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.cemetery_contacts enable row level security;
drop policy if exists read_all on public.cemetery_contacts;
drop policy if exists edit     on public.cemetery_contacts;
create policy read_all on public.cemetery_contacts for select using (true);
create policy edit     on public.cemetery_contacts for all using (public.is_editor()) with check (public.is_editor());

create table if not exists public.reports (
  id          bigint generated always as identity primary key,
  cemetery_id text references public.cemeteries(id) on delete cascade,
  deceased_id bigint references public.deceased(id) on delete set null,
  kind        text not null default 'error',    -- error / damage / other
  message     text not null,
  contact     text,
  status      text not null default 'new',      -- new / done
  created_at  timestamptz not null default now()
);
alter table public.reports enable row level security;
drop policy if exists add_new on public.reports;
drop policy if exists edit    on public.reports;
create policy add_new on public.reports for insert to anon, authenticated
  with check (status = 'new' and length(message) between 3 and 1000 and (contact is null or length(contact) <= 100));
create policy edit on public.reports for all using (public.is_editor()) with check (public.is_editor());
