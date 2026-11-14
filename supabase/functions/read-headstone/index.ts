// Grave Marker – קריאת מצבה מתמונה בעזרת Claude, והשוואה לרשומה ברשימה
// קלט: { photo_id }  ·  רק עורכים יכולים להפעיל
// סודות נדרשים: ANTHROPIC_API_KEY (ואופציונלי: CLAUDE_MODEL)
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const PROMPT = `זו תמונה של מצבה בבית עלמין יהודי בישראל. קרא את מה שחקוק עליה והחזר JSON בלבד, בלי טקסט נוסף, במבנה:
{"readable": true/false, "people": [{"last_name": "", "first_name": "", "father_name": "", "mother_name": "", "death_date_hebrew": "", "death_date_gregorian": "YYYY-MM-DD או ריק", "birth_year": ""}], "notes": ""}
- אם על המצבה יותר מנפטר אחד, החזר את כולם.
- שם אב/אם: מה שכתוב אחרי "בן"/"בת" (אם כתוב).
- תאריך עברי כפי שכתוב (למשל "כ"ט חשון תשפ"ז").
- אם משהו לא קריא – השאר ריק. אל תנחש.
- readable=false אם זו לא מצבה או שאי אפשר לקרוא.`;

const norm = (s?: string | null) =>
  (s ?? "").replace(/[֑-ׇ"'׳״\-–.]/g, "").replace(/\s+/g, " ").trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "חסר ANTHROPIC_API_KEY" }, 500);

    // רק עורך מחובר
    const user = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: isEd } = await user.rpc("is_editor");
    if (!isEd) return json({ error: "רק עורכים" }, 403);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { photo_id } = await req.json();
    const { data: ph } = await admin.from("grave_photos").select("id,path,deceased_id").eq("id", photo_id).single();
    if (!ph) return json({ error: "תמונה לא נמצאה" }, 404);
    const { data: d } = await admin.from("deceased")
      .select("id,first_name,last_name,father_name,mother_name,death_date,death_date_hebrew,notes").eq("id", ph.deceased_id).single();

    const file = await admin.storage.from("grave-photos").download(ph.path);
    if (file.error) return json({ error: file.error.message }, 500);
    const bytes = new Uint8Array(await file.data.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("CLAUDE_MODEL") ?? "claude-sonnet-5-5",
        max_tokens: 800,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: btoa(bin) } },
            { type: "text", text: PROMPT },
          ],
        }],
      }),
    });
    const ai = await r.json();
    if (!r.ok) return json({ error: ai?.error?.message ?? "שגיאה בקריאה ל-Claude" }, 502);
    const text: string = ai.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";
    const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));

    // השוואה לרשומה: מוצאים את האדם על המצבה שהכי מתאים, ומשווים שדה-שדה
    const people = (parsed.people ?? []) as Record<string, string>[];
    const score = (p: Record<string, string>) =>
      (norm(p.first_name) === norm(d.first_name) ? 2 : 0) + (norm(p.last_name) === norm(d.last_name) ? 2 : 0) +
      (norm(p.mother_name) && norm(p.mother_name) === norm(d.mother_name) ? 1 : 0);
    const best = people.sort((a, b) => score(b) - score(a))[0];
    const diffs: string[] = [];
    if (parsed.readable && best) {
      const F: [string, string][] = [["last_name", "שם משפחה"], ["first_name", "שם פרטי"], ["father_name", "שם האב"], ["mother_name", "שם האם"]];
      for (const [k, label] of F) {
        if (norm(best[k]) && norm(d[k as keyof typeof d] as string) && norm(best[k]) !== norm(d[k as keyof typeof d] as string)) {
          diffs.push(`${label} במצבה "${best[k]}", ברשימה "${d[k as keyof typeof d]}"`);
        }
      }
      if (best.death_date_gregorian && d.death_date && best.death_date_gregorian !== d.death_date) {
        diffs.push(`תאריך פטירה במצבה ${best.death_date_gregorian}, ברשימה ${d.death_date}`);
      } else if (!best.death_date_gregorian && norm(best.death_date_hebrew) && norm(d.death_date_hebrew) &&
        norm(best.death_date_hebrew) !== norm(d.death_date_hebrew)) {
        diffs.push(`תאריך עברי במצבה "${best.death_date_hebrew}", ברשימה "${d.death_date_hebrew}"`);
      }
    }

    await admin.from("grave_photos").update({ ai: { ...parsed, diffs }, ai_at: new Date().toISOString() }).eq("id", ph.id);
    if (diffs.length) {
      const note = "מצבה: " + diffs.join("; ");
      const cur = (d.notes ?? "").replace(/^✓ /, "");
      await admin.from("deceased").update({ notes: cur ? `${note}, ${cur}` : note }).eq("id", d.id);
    }
    return json({ ok: true, readable: parsed.readable, diffs, person: best ?? null });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
