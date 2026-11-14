# השמעה בקול גברי – הפעלה

1. Google Cloud (אפשר בפרויקט של VanSpot):
   - APIs & Services ← Library ← "Cloud Text-to-Speech API" ← Enable.
   - APIs & Services ← Credentials ← Create credentials ← API key.
     ב-Edit API key ← API restrictions ← Restrict key ← לסמן רק Cloud Text-to-Speech API ← Save.
   - (דורש חשבון חיוב פעיל. 1 מיליון תווים בחודש של קולות WaveNet בחינם.)
2. Supabase, פרויקט kever:
   - SQL Editor ← להריץ `supabase/tts.sql`.
   - Edge Functions ← Deploy a new function ← Via Editor ← שם `tts` ← להדביק את `functions/tts/index.ts` ← Deploy.
   - בהגדרות הפונקציה: לכבות "Verify JWT" (Enforce JWT verification).
   - Edge Functions ← Secrets ← להוסיף `GOOGLE_TTS_KEY` עם המפתח.
3. לכתוב ל-Claude "בוצע" – הוא ידליק את כפתור ההשמעה ויבדוק.
