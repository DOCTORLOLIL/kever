-- Grave Marker – ספירת הורדות והתקנות ייחודיות (אנונימי, בלי פרטים מזהים)

-- כל התקנה של האפליקציה מקבלת מזהה אקראי בטלפון ומדווחת פעם ביום
create table if not exists installs (
  id uuid primary key,
  first_seen timestamptz not null default now(),
  last_seen date not null default current_date,
  build int,
  lang text
);
alter table installs enable row level security;

-- לחיצות על "הורדה" בדף ההורדה (פעם אחת לכל דפדפן)
create table if not exists downloads (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  kind text check (kind in ('arm64','universal'))
);
alter table downloads enable row level security;

-- האפליקציה מדווחת דרך פונקציה בלבד (אין גישה ישירה לטבלאות)
create or replace function ping_install(p_id uuid, p_build int, p_lang text)
returns void language sql security definer set search_path = public as $$
  insert into installs(id, build, lang) values (p_id, p_build, left(p_lang, 5))
  on conflict (id) do update set last_seen = current_date, build = excluded.build, lang = excluded.lang;
$$;

create or replace function count_download(p_kind text)
returns void language sql security definer set search_path = public as $$
  insert into downloads(kind) values (case when p_kind = 'universal' then 'universal' else 'arm64' end);
$$;

-- סטטיסטיקה לעורכים בלבד
create or replace function app_stats()
returns json language plpgsql security definer set search_path = public as $$
begin
  if not is_editor() then raise exception 'not allowed'; end if;
  return json_build_object(
    'installs', (select count(*) from installs),
    'active30', (select count(*) from installs where last_seen > current_date - 30),
    'active7',  (select count(*) from installs where last_seen > current_date - 7),
    'new7',     (select count(*) from installs where first_seen > now() - interval '7 days'),
    'downloads', (select count(*) from downloads),
    'byLang',   (select coalesce(json_object_agg(coalesce(lang,'?'), n), '{}') from (select lang, count(*) n from installs group by lang) x)
  );
end $$;

revoke all on function ping_install(uuid,int,text) from public;
revoke all on function count_download(text) from public;
revoke all on function app_stats() from public;
grant execute on function ping_install(uuid,int,text) to anon, authenticated;
grant execute on function count_download(text) to anon, authenticated;
grant execute on function app_stats() to authenticated;
