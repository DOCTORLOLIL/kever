-- תאריך פטירה "ללא": ערך חוקי לנפטרים שאין להם תאריך
alter table deceased add column if not exists death_date_none boolean not null default false;

-- כל מי שאין לו תאריך (ולא סומן "ללא") מגיע לרשומות לבדיקה
update deceased set notes = case
    when notes is null or notes = '' then 'חסר תאריך פטירה'
    when notes like '✓%' then 'חסר תאריך פטירה, ' || ltrim(substr(notes, 2))
    else notes || ', חסר תאריך פטירה' end
where death_date is null and not death_date_none
  and coalesce(notes, '') not like '%חסר תאריך פטירה%';
