// ============================================================
//  LexUz — СИ Ёрдамчи учун Gemini Edge Function
//  Файл: supabase/functions/si-yordamchi/index.ts
//  Бу функция Google Gemini API'га хавфсиз сўров юборади.
//  API калит фақат серверда сақланади, браузерга чиқмайди.
// ============================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const MODEL = "gemini-2.5-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY созланмаган");
    }

    // Браузердан: system (тизим кўрсатмаси) ва messages (суҳбат тарихи)
    const { system, messages } = await req.json();

    // Суҳбат тарихини Gemini форматига айлантириш
    const contents = (messages || []).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      MODEL + ":generateContent";

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system || "" }] },
        contents: contents,
        generationConfig: { maxOutputTokens: 1500, temperature: 0.4 },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error("Gemini API хатоси: " + response.status + " " + errText);
    }

    const data = await response.json();
    const answer = (data.candidates?.[0]?.content?.parts || [])
      .map((p: any) => p.text)
      .join("\n")
      .trim();

    // Жавобни браузерга оддий форматда қайтариш
    return new Response(
      JSON.stringify({ answer: answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
