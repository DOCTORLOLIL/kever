-- תצלום רחפן לכל בית עלמין (הרצה חד-פעמית ב-SQL Editor)
alter table public.cemeteries
  add column if not exists overlay_url text,
  add column if not exists overlay_corners jsonb;
update public.cemeteries set overlay_url = 'https://gravemarker.bulu.ltd/overlays/ofakim-2026.jpg'
where id = 'ofakim';
