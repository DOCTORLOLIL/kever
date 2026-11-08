-- ============================================================
-- מינוי עורכים מתוך כלי הסימון
-- הדבק ב-Supabase > SQL Editor ולחץ Run (פעם אחת).
-- ============================================================

-- מנהל = מי שמורשה למנות עורכים
alter table public.editors add column if not exists is_admin boolean not null default false;

-- אבישי: עורך + מנהל
insert into public.editors (user_id, name, is_admin)
select id, 'אבישי', true from auth.users where email = '1312shen@gmail.com'
on conflict (user_id) do update set is_admin = true;

-- פונקציה: מנהל ממנה משתמש לפי אימייל לעורך
create or replace function public.add_editor(p_email text, p_name text)
returns text
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid; created timestamptz;
begin
  if not exists (select 1 from public.editors where user_id = auth.uid() and is_admin) then
    raise exception 'רק מנהל יכול למנות עורכים';
  end if;
  select id, created_at into uid, created from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then
    raise exception 'לא נמצא משתמש עם האימייל הזה';
  end if;
  update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where id = uid;
  insert into public.editors (user_id, name) values (uid, p_name)
  on conflict (user_id) do update set name = excluded.name;
  return case when created > now() - interval '2 minutes' then 'new' else 'existing' end;
end $$;

revoke execute on function public.add_editor(text, text) from public, anon;
grant execute on function public.add_editor(text, text) to authenticated;
