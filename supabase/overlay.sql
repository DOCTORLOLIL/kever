-- תצלום רחפן לכל בית עלמין (הרצה חד-פעמית ב-SQL Editor)
alter table public.cemeteries
  add column if not exists overlay_url text,
  add column if not exists overlay_corners jsonb;
update public.cemeteries set
  overlay_url = 'https://gravemarker.bulu.ltd/overlays/ofakim-2026.jpg',
  overlay_corners = '[[31.3156051,34.6061477],[31.3165235,34.61048],[31.3135235,34.6067528]]'::jsonb
where id = 'ofakim';
