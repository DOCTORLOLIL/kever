-- הלכות אבלות: סעיפים לפי שלב (1 פטירה-קבורה, 2 קבורה, 3 שבעה, 4 שלושים, 5 שנה, 6 יארצייט). רק מנהל כותב
create table if not exists avelut (
  id bigint generated always as identity primary key,
  stage int not null check (stage between 1 and 6),
  sort int not null default 0,
  title text not null,
  body text not null default '',
  updated_at timestamptz not null default now()
);
create index if not exists avelut_stage on avelut(stage, sort);
alter table avelut enable row level security;
drop policy if exists av_read on avelut;
create policy av_read on avelut for select using (true);
drop policy if exists av_write on avelut;
create policy av_write on avelut for all to authenticated
  using (exists (select 1 from editors where user_id = auth.uid() and is_admin))
  with check (exists (select 1 from editors where user_id = auth.uid() and is_admin));
