// Grave Marker – השמעה בקול גברי בלבד (Google Cloud Text-to-Speech), עם שמירה של כל קובץ שנוצר
// קלט: { text }  ·  פלט: { url }  ·  סוד נדרש: GOOGLE_TTS_KEY
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const VOICE = Deno.env.get("TTS_VOICE") ?? "he-IL-Wavenet-D"; // קול גברי
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

async function sha1(s: string) {
  const h = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const key = Deno.env.get("GOOGLE_TTS_KEY");
    if (!key) return json({ error: "חסר GOOGLE_TTS_KEY" }, 500);
    let { text } = await req.json();
    text = String(text ?? "")
      // שם השם נקרא "אֲדֹנָי"
      .replace(/י[֑-ׇ]*ה[֑-ׇ]*ו[֑-ׇ]*ה[֑-ׇ]*(?=[\s,.:;]|$)/g, "אֲדֹנָי")
      .replace(/ה['׳](?=[\s,.:;]|$)/g, "אֲדֹנָי")
      .replace(/\s+/g, " ").trim();
    // רק טקסט עברי קצר (מונע שימוש לרעה)
    if (!text || text.length > 600 || /[A-Za-z0-9<>{}]/.test(text.replace(/\(.*?\)/g, ""))) return json({ error: "טקסט לא תקין" }, 400);

    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const path = `${VOICE}/${await sha1(text)}.mp3`;
    const pub = admin.storage.from("tts").getPublicUrl(path).data.publicUrl;
    const head = await fetch(pub, { method: "HEAD" });
    if (head.ok) return json({ url: pub });

    const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "he-IL", name: VOICE, ssmlGender: "MALE" },
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.9 },
      }),
    });
    const j = await r.json();
    if (!r.ok) return json({ error: j?.error?.message ?? "שגיאה ביצירת הקול" }, 502);
    const bytes = Uint8Array.from(atob(j.audioContent), (c) => c.charCodeAt(0));
    const up = await admin.storage.from("tts").upload(path, bytes, { contentType: "audio/mpeg", upsert: true });
    if (up.error) return json({ error: up.error.message }, 500);
    return json({ url: pub });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
