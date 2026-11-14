# קריאת מצבות מתמונה – מוקפא

כשתמונת קבר מאושרת, Claude קורא את המצבה ומשווה לרשומה. אם יש סתירה (שם, שם הורה, תאריך),
נוספת לנפטר הערה שמתחילה ב"מצבה:", והוא מופיע ב"רשומות לבדיקה" תחת "לא תואם למצבה".

## הפעלה (פעם אחת)
1. ב-console.anthropic.com: להטעין קרדיט וליצור API key. (המנוי של Claude.ai לא כולל את זה.)
2. ב-Supabase, בפרויקט kever: SQL Editor ← להריץ את `supabase/ai_read.sql`.
3. Edge Functions ← Deploy a new function ← Via Editor, שם: `read-headstone`, להדביק את `functions/read-headstone/index.ts`, Deploy.
4. Edge Functions ← Secrets: להוסיף `ANTHROPIC_API_KEY` עם המפתח.
5. לבקש מ-Claude להפעיל (AI_READ=true בכלי העריכה).

עלות משוערת: פחות מ-2 סנט לתמונה.
