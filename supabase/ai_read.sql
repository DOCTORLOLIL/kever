-- קריאת מצבות מתמונה: שמירת התוצאה ליד התמונה
alter table grave_photos add column if not exists ai jsonb;
alter table grave_photos add column if not exists ai_at timestamptz;
