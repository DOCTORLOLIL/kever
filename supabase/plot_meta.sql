-- שמות לחלקות ותתי-חלקות – לעורכים בלבד (לא מוצג לציבור)
create table if not exists plot_meta (
  id bigint generated always as identity primary key,
  cemetery_id text not null references cemeteries(id) on delete cascade,
  gush text not null default '1',
  plot text not null,
  sub text not null default '',          -- '' = החלקה עצמה; אחרת שם/מזהה תת-החלקה
  name text,
  boundary jsonb,                        -- גבול תת-החלקה (GeoJSON)
  area_m2 int,
  updated_at timestamptz not null default now(),
  unique (cemetery_id, gush, plot, sub)
);
alter table plot_meta enable row level security;
drop policy if exists plot_meta_editors on plot_meta;
create policy plot_meta_editors on plot_meta for all to authenticated using (is_editor()) with check (is_editor());
