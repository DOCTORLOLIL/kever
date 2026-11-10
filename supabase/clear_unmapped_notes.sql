-- הסרת ההערה "חלקה עדיין לא במפה" מנפטרים בחלקות שכבר סומנו במפה
update deceased d
set notes = nullif(
  regexp_replace(
    regexp_replace(
      regexp_replace(d.notes, '(, )?חלקה עדיין לא במפה', '', 'g'),
    '^(✓ )?, ', '\1'),
  '^✓ ?$', ''),
  '')
where d.notes like '%חלקה עדיין לא במפה%'
  and exists (select 1 from plots p
              where p.cemetery_id = d.cemetery_id and p.gush = d.gush and p.plot = d.plot
                and p.boundary is not null);

-- בדיקה: כמה נשארו עם ההערה (אמור להיות 0)
select count(*) as left_with_note from deceased where notes like '%חלקה עדיין לא במפה%';
