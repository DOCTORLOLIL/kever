// Grave Marker – שאלות בהלכות אבלות. Claude עונה רק מתוך הסעיפים שבטבלה avelut
// קלט: { question }  ·  פלט: { answer, sources: [id...] }
// סודות נדרשים: ANTHROPIC_API_KEY (ואופציונלי: CLAUDE_MODEL). מוקפא עד שיש קרדיט.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const STAGES = ["", "מהפטירה עד הקבורה", "הקבורה והלוויה", "שבעה", "שלושים", "שנה ראשונה", "יארצייט ואזכרה"];

const SYSTEM = `אתה עוזר באתר של בית עלמין, ועונה לאבלים על שאלות בהלכות אבלות.
כללים מחייבים:
- ענה אך ורק מתוך הסעיפים שבתוך <halachot>. אל תוסיף ידע משלך, גם אם אתה בטוח.
- אם התשובה לא כתובה בסעיפים, כתוב: "התשובה לשאלה הזו לא מופיעה בהלכות שבאתר. מומלץ לשאול רב." ואל תנחש.
- ענה בעברית פשוטה, קצר (עד 5 משפטים), ברגישות – הפונה נמצא באבל.
- אל תפסוק במקרים מיוחדים או מורכבים; הפנה לרב.
- החזר JSON בלבד: {"answer": "...", "sources": [מספרי הסעיפים שעליהם התבססת]}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "חסר ANTHROPIC_API_KEY" }, 500);
    const { question } = await req.json();
    const q = String(question ?? "").trim().slice(0, 500);
    if (q.length < 4) return json({ error: "שאלה קצרה מדי" }, 400);

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: rows } = await db.from("avelut").select("id,stage,title,body").order("stage").order("sort");
    if (!rows?.length) return json({ answer: "ההלכות עוד לא הוכנסו לאתר. מומלץ לשאול רב.", sources: [] });
    const ctx = rows.map((r) => `<s id="${r.id}" stage="${STAGES[r.stage]}" title="${r.title}">\n${r.body}\n</s>`).join("\n");

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("CLAUDE_MODEL") ?? "claude-sonnet-5-5",
        max_tokens: 700,
        system: SYSTEM,
        messages: [{ role: "user", content: `<halachot>\n${ctx}\n</halachot>\n\nהשאלה: ${q}` }],
      }),
    });
    const ai = await r.json();
    if (!r.ok) return json({ error: ai?.error?.message ?? "שגיאה" }, 502);
    const text: string = ai.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";
    const p = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    const ids = new Set(rows.map((x) => x.id));
    return json({ answer: String(p.answer ?? ""), sources: (p.sources ?? []).map(Number).filter((n: number) => ids.has(n)) });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
