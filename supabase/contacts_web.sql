-- כתובת אתר לאיש קשר. רק מנהל (is_admin) יכול למלא או לשנות אותה
alter table public.cemetery_contacts add column if not exists website text;
create or replace function public.contacts_web_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.editors where user_id = auth.uid() and is_admin) then
    if tg_op = 'INSERT' then new.website := null;
    else new.website := old.website; end if;
  end if;
  return new;
end $$;
drop trigger if exists contacts_web_guard on public.cemetery_contacts;
create trigger contacts_web_guard before insert or update on public.cemetery_contacts
for each row execute function public.contacts_web_guard();
