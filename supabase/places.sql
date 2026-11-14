-- נקודות שימושיות בבית העלמין ושעות פתיחה
alter table cemeteries add column if not exists hours text;

create table if not exists cemetery_places (
  id bigint generated always as identity primary key,
  cemetery_id text not null references cemeteries(id) on delete cascade,
  kind text not null check (kind in ('wash','tap','wc','parking','entrance','office','shade')),
  lat double precision not null,
  lng double precision not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists cemetery_places_cem on cemetery_places(cemetery_id);
alter table cemetery_places enable row level security;

drop policy if exists places_read on cemetery_places;
create policy places_read on cemetery_places for select using (true);
drop policy if exists places_write on cemetery_places;
create policy places_write on cemetery_places for all to authenticated using (is_editor()) with check (is_editor());

-- עורכים יכולים לעדכן שעות פתיחה
drop policy if exists cemeteries_editor_update on cemeteries;
create policy cemeteries_editor_update on cemeteries for update to authenticated using (is_editor()) with check (is_editor());
