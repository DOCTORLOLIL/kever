-- השמעה בקול גברי: מאגר ציבורי לקובצי הקול שנוצרו (נוצרים פעם אחת ונשמרים)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tts', 'tts', true, 2097152, array['audio/mpeg'])
on conflict (id) do update set public = true;
