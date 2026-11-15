-- קברי צדיקים בבית העלמין ובסביבתו
create table if not exists tzaddikim (
  id bigint generated always as identity primary key,
  cemetery_id text not null references cemeteries(id) on delete cascade,
  deceased_id bigint references deceased(id) on delete set null,
  title text not null,
  inside boolean not null default true,
  place text,
  hillula date,
  about text,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);
create index if not exists tzaddikim_cem on tzaddikim(cemetery_id);
alter table tzaddikim enable row level security;
drop policy if exists tz_read on tzaddikim;
create policy tz_read on tzaddikim for select using (true);
drop policy if exists tz_write on tzaddikim;
create policy tz_write on tzaddikim for all to authenticated using (is_editor()) with check (is_editor());
