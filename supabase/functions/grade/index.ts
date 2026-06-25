// grade — 답변 즉시 채점 Edge Function (Gemini)
// 텔레그램 eb_feedback.py 의 _SYS 루브릭·프롬프트·?key= 인증·키 폴백·JSON 파싱을 미러링.
// 시크릿(키·모델·루브릭)은 소스/프론트에 없음 → 비공개 app_secrets 테이블에서 service_role 로만 읽는다.
// verify_jwt=true → 로그인 사용자만 호출(데모/익명은 게이트에서 막혀 앱이 mock 으로 폴백).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function loadSecrets() {
  const url = Deno.env.get("SUPABASE_URL");
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const r = await fetch(
    `${url}/rest/v1/app_secrets?select=key,value&key=in.(gemini_keys,gemini_model,grade_sys)`,
    { headers: { apikey: svc, Authorization: `Bearer ${svc}` } },
  );
  const rows = await r.json();
  const map = Object.fromEntries(rows.map((x) => [x.key, x.value]));
  return {
    keys: (map["gemini_keys"] || "").split(",").map((k) => k.trim()).filter(Boolean),
    model: map["gemini_model"] || "gemini-flash-latest",
    sys: map["grade_sys"] || "",
  };
}

function parseScore(raw) {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const d = JSON.parse(m[0]);
    const clamp = (n) => Math.max(0, Math.min(100, parseInt(String(n)) || 0));
    return { validity: clamp(d.validity), ingenuity: clamp(d.ingenuity), critique: String(d.critique ?? "").trim() };
  } catch { return null; }
}

async function callGemini(model, key, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.6, topP: 0.9 } }),
  });
  const data = await resp.json().catch(() => ({}));
  return { status: resp.status, data };
}

function extract(data) {
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts.filter((p) => "text" in p).map((p) => p.text).join("").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  // 로그인 사용자만(익명/데모 차단) — 무료 Gemini 쿼터 남용 방지.
  try {
    const auth = req.headers.get("Authorization") || "";
    const payload = JSON.parse(atob(auth.replace("Bearer ", "").split(".")[1] || ""));
    if (payload.role !== "authenticated") return json({ error: "login_required" }, 401);
  } catch { return json({ error: "login_required" }, 401); }

  let body;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const dilemma = String(body.dilemma || "").slice(0, 4000);
  const question = String(body.prompt || body.question || "").slice(0, 2000);
  const answer = String(body.answer || "").slice(0, 6000);
  if (!question || !answer) return json({ error: "missing" }, 400);

  const { keys, model, sys } = await loadSecrets();
  if (!keys.length || !sys) return json({ error: "not_configured" }, 500);

  const qtext = dilemma ? `[딜레마 상황]\n${dilemma}\n\n[질문]\n${question}` : question;
  const prompt = `${sys}\n\n[질문]\n${qtext}\n\n[응시자 답변]\n${answer}`;

  for (const key of keys) {
    let res;
    try { res = await callGemini(model, key, prompt); } catch { continue; }
    if (res.status === 200) {
      const parsed = parseScore(extract(res.data));
      if (parsed) return json(parsed);
      continue;
    }
    continue;
  }
  return json({ error: "grading_unavailable" }, 503);
});
