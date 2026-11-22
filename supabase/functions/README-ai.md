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

---

# שאלות בהלכות אבלות – מוקפא

אבל כותב שאלה בדף /avelut/, ו-Claude עונה רק מתוך הסעיפים שהוכנסו (טבלה avelut), עם הפניה לסעיף.
אם התשובה לא כתובה – הוא אומר זאת ומפנה לרב.

## הפעלה (אחרי שלבים 1 ו-4 למעלה)
1. Edge Functions ← Deploy a new function ← Via Editor, שם: `ask-avelut`, להדביק את `functions/ask-avelut/index.ts`.
   לכבות "Verify JWT" (הדף ציבורי). Deploy.
2. לבקש מ-Claude להפעיל (ASK=true בדף /avelut/).

עלות משוערת: כ-1–3 סנט לשאלה (תלוי בכמות הסעיפים).
