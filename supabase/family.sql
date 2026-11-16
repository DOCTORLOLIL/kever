-- "המשפחה שלי": קישור נפטרים למכשיר (בלי הרשמה) והתראות על אירועים
create table if not exists family_links (
  device text not null check (length(device) between 20 and 64),
  deceased_id bigint not null references deceased(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (device, deceased_id)
);
create table if not exists family_events (
  id bigint generated always as identity primary key,
  deceased_id bigint not null references deceased(id) on delete cascade,
  kind text not null,            -- azkara / damage / photo
  body text,
  created_at timestamptz not null default now()
);
create index if not exists family_events_d on family_events(deceased_id, id);
create index if not exists family_links_d on family_links(deceased_id);
-- אין גישה ישירה לטבלאות: רק דרך הפונקציות למטה
alter table family_links enable row level security;
alter table family_events enable row level security;

create or replace function family_follow(p_dev text, p_id bigint, p_on boolean) returns int
language plpgsql security definer set search_path = public as $$
begin
  if p_on then insert into family_links(device, deceased_id) values (p_dev, p_id) on conflict do nothing;
  else delete from family_links where device = p_dev and deceased_id = p_id; end if;
  return (select count(*) from family_links where deceased_id = p_id);
end $$;

create or replace function family_count(p_id bigint) returns int
language sql security definer set search_path = public as $$ select count(*)::int from family_links where deceased_id = p_id $$;

-- אירועים חדשים לנפטרים שהמכשיר מקושר אליהם
create or replace function family_feed(p_dev text, p_after bigint) returns setof family_events
language sql security definer set search_path = public as $$
  select e.* from family_events e join family_links l on l.deceased_id = e.deceased_id and l.device = p_dev
  where e.id > p_after and e.created_at > l.created_at order by e.id limit 50 $$;

-- אזכרה: שולחים לכל המקושרים (עד 5 בכל יום לנפטר, כדי למנוע הצפה)
create or replace function family_azkara(p_id bigint, p_body text) returns int
language plpgsql security definer set search_path = public as $$
begin
  if length(coalesce(p_body,'')) not between 5 and 800 then raise exception 'bad text'; end if;
  if (select count(*) from family_events where deceased_id = p_id and kind = 'azkara' and created_at > now() - interval '1 day') >= 5 then
    raise exception 'too many'; end if;
  insert into family_events(deceased_id, kind, body) values (p_id, 'azkara', p_body);
  return (select count(*) from family_links where deceased_id = p_id);
end $$;

-- דיווח נזק → אירוע
create or replace function family_on_report() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.deceased_id is not null and new.kind = 'damage' then
    insert into family_events(deceased_id, kind, body) values (new.deceased_id, 'damage', left(new.message, 300));
  end if; return new;
end $$;
drop trigger if exists family_report on reports;
create trigger family_report after insert on reports for each row execute function family_on_report();

-- תמונה שאושרה → אירוע
create or replace function family_on_photo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    insert into family_events(deceased_id, kind) values (new.deceased_id, 'photo');
  end if; return new;
end $$;
drop trigger if exists family_photo on grave_photos;
create trigger family_photo after update on grave_photos for each row execute function family_on_photo();

grant execute on function family_follow(text, bigint, boolean), family_count(bigint), family_feed(text, bigint), family_azkara(bigint, text) to anon, authenticated;
