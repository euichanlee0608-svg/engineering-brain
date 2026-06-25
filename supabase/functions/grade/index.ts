// grade — 답변 즉시 채점 Edge Function (Gemini)
// 텔레그램 eb_feedback.py 의 _SYS 루브릭·프롬프트·?key= 인증·키 폴백·JSON 파싱을 미러링.
// 시크릿(키·모델·루브릭·텔레그램토큰)은 소스/프론트에 없음 → 비공개 app_secrets 에서 service_role 로만 읽음.
// verify_jwt=true → 로그인/익명 사용자만 호출. 익명(이름만)은 3회까지 무료 실채점(서버측 제한).
// 채점 후 오너 텔레그램(COT봇)으로 [질문+답변+점수+이름] 알림.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const FREE_LIMIT = 3; // 익명(이름만) 사용자 무료 실채점 횟수

async function loadSecrets() {
  const url = Deno.env.get("SUPABASE_URL");
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const keys = "gemini_keys,gemini_model,grade_sys,telegram_notify_token,telegram_owner_chat";
  const r = await fetch(`${url}/rest/v1/app_secrets?select=key,value&key=in.(${keys})`,
    { headers: { apikey: svc, Authorization: `Bearer ${svc}` } });
  const rows = await r.json();
  const m = Object.fromEntries(rows.map((x) => [x.key, x.value]));
  return {
    url, svc,
    keys: (m["gemini_keys"] || "").split(",").map((k) => k.trim()).filter(Boolean),
    model: m["gemini_model"] || "gemini-flash-latest",
    sys: m["grade_sys"] || "",
    tgToken: m["telegram_notify_token"] || "",
    tgChat: m["telegram_owner_chat"] || "",
  };
}

async function gradedCount(url, svc, uid) {
  // 이 사용자가 이미 '채점까지 끝낸'(feedback 있는) 기여 수
  const r = await fetch(
    `${url}/rest/v1/contributions?select=id&user_id=eq.${uid}&feedback=not.is.null`,
    { headers: { apikey: svc, Authorization: `Bearer ${svc}` } });
  const rows = await r.json().catch(() => []);
  return Array.isArray(rows) ? rows.length : 0;
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

function cut(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n) + "…" : s; }
function esc(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

// JWT payload 를 UTF-8 안전하게 디코드(atob 은 Latin1 → 한글 이름 깨짐. base64url + TextDecoder 사용).
function jwtPayload(token) {
  let b64 = (token.split(".")[1] || "").replace(/-/g, "+").replace(/_/g, "/");
  b64 += "=".repeat((4 - (b64.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder("utf-8").decode(bytes));
}

async function notifyTelegram(s, info) {
  if (!s.tgToken || !s.tgChat) return;
  // HTML parse_mode + 안전 이모지(🌐만, 변형선택자 이모지 제외)로 클라이언트 호환성 확보. 딜레마 포함.
  const tag = info.anon ? "익명·무료" : "로그인";
  const text =
    `🌐 <b>웹 기여</b> — ${esc(info.name || "이름없음")} (${tag})\n\n` +
    `📌 <b>도메인</b>\n${esc(cut(info.domain, 80))}\n\n` +
    `🧩 <b>딜레마</b>\n${esc(cut(info.dilemma, 500))}\n\n` +
    `❓ <b>질문</b>\n${esc(cut(info.question, 300))}\n\n` +
    `📝 <b>답변</b>\n${esc(cut(info.answer, 800))}\n\n` +
    `📊 <b>채점</b> 타당성 ${info.v} · 돌파력 ${info.g}\n` +
    `🎯 <b>치명적 한계</b>\n${esc(cut(info.critique, 300))}`;
  try {
    const r = await fetch(`https://api.telegram.org/bot${s.tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ chat_id: s.tgChat, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    // HTML 파싱 실패(잘못된 태그 등) 시 plain 텍스트로 폴백
    if (!r.ok) {
      const plain = text.replace(/<\/?b>/g, "");
      await fetch(`https://api.telegram.org/bot${s.tgToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ chat_id: s.tgChat, text: plain, disable_web_page_preview: true }),
      });
    }
  } catch { /* 알림 실패는 채점에 영향 없음 */ }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  // 로그인/익명 사용자만(비인증 차단)
  let claims;
  try {
    const auth = req.headers.get("Authorization") || "";
    claims = jwtPayload(auth.replace("Bearer ", ""));
    if (claims.role !== "authenticated") return json({ error: "login_required" }, 401);
  } catch { return json({ error: "login_required" }, 401); }

  let body;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const dilemma = String(body.dilemma || "").slice(0, 4000);
  const question = String(body.prompt || body.question || "").slice(0, 2000);
  const answer = String(body.answer || "").slice(0, 6000);
  const domain = String(body.domain || "").slice(0, 200);
  if (!question || !answer) return json({ error: "missing" }, 400);

  const s = await loadSecrets();
  if (!s.keys.length || !s.sys) return json({ error: "not_configured" }, 500);

  const isAnon = claims.is_anonymous === true;
  const uid = claims.sub;
  const name = claims.user_metadata?.name || (claims.email ? claims.email.split("@")[0] : "");

  // 익명(이름만) 사용자 무료 3회 제한 — 초과 시 로그인 유도
  if (isAnon) {
    const used = await gradedCount(s.url, s.svc, uid);
    if (used >= FREE_LIMIT) return json({ error: "free_limit", limit: FREE_LIMIT }, 403);
  }

  const qtext = dilemma ? `[딜레마 상황]\n${dilemma}\n\n[질문]\n${question}` : question;
  const prompt = `${s.sys}\n\n[질문]\n${qtext}\n\n[응시자 답변]\n${answer}`;

  for (const key of s.keys) {
    let res;
    try { res = await callGemini(s.model, key, prompt); } catch { continue; }
    if (res.status === 200) {
      const parsed = parseScore(extract(res.data));
      if (parsed) {
        await notifyTelegram(s, {
          name, anon: isAnon, domain, dilemma, question, answer,
          v: parsed.validity, g: parsed.ingenuity, critique: parsed.critique,
        });
        return json(parsed);
      }
      continue;
    }
    continue;
  }
  return json({ error: "grading_unavailable" }, 503);
});
