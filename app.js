// ──────────────────────────────────────────────────────────────
// Engineering Brain — web app logic
// Supabase 미설정이면 자동 데모 모드. 설정되면 실제 로그인 + DB 서빙.
// ──────────────────────────────────────────────────────────────
const CFG = window.EB_CONFIG || {};
const LIVE = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);

let supabase = null;
if (LIVE) {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  supabase = createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
}

const $ = (id) => document.getElementById(id);
const on = (sel, ev, fn) => document.querySelectorAll(sel).forEach((el) => el.addEventListener(ev, fn));

// ── sample questions (실제 은행에서 뽑은 난제들) ────────────────
const SAMPLE = [
  {
    domain: "유체역학 / ML 난류 모델링", difficulty: "extreme",
    dilemma: "RANS 시뮬레이션의 난류 점성 모델이 박리(separation) 영역에서 크게 틀려서, 고해상도 LES 데이터로 학습한 신경망으로 레이놀즈 응력을 보정하려 한다. 그런데 신경망 보정항을 넣는 순간 수치 솔버가 발산하거나, 학습 안 한 형상에선 비물리적 음의 에너지 생성이 터진다.",
    question: "솔버 안정성과 물리적 실현가능성(realizability)을 깨지 않으면서 데이터 기반 보정을 끼워넣으려면, 학습 대상과 제약을 어떻게 재정의하겠는가?",
    gloss: [["RANS", "시간평균 난류방정식(빠르지만 부정확)"], ["LES", "큰 소용돌이를 직접 푸는 고비용 정밀 해석"], ["realizability", "응력이 물리적으로 가능한 값 범위에 머무는 조건"]],
  },
  {
    domain: "사족보행 로봇 / Sim-to-Real 강화학습", difficulty: "extreme",
    dilemma: "MuJoCo에서 PPO로 학습한 보행 정책이 시뮬에선 거의 완벽한데, 실제 액추에이터의 기어 백래시·토크 포화·8ms 통신지연이 겹치면 접촉 타이밍이 어긋나 비틀거린다. 도메인 랜덤화를 넓히면 강인해지지만 평균 보행속도가 급락하고, 실하드웨어 롤아웃은 마모로 50 에피소드만 허용된다.",
    question: "강인성과 평균성능을 동시에 살리려면 랜덤화 '분포 자체'를 어떻게 설계·스케줄링하고, 그 50 에피소드를 어디에 쓰겠는가?",
    gloss: [["백래시", "기어 맞물림 틈에서 생기는 위치 사각지대"], ["도메인 랜덤화", "시뮬 물성을 무작위로 흔들어 강인성을 키우는 기법"]],
  },
  {
    domain: "압전 에너지 하베스팅 / 임베디드 신호처리", difficulty: "extreme",
    dilemma: "광대역 진동 환경에서 압전 캔틸레버로 에너지를 거두는데, 공진점이 단 하나라 외부 진동 스펙트럼이 시간에 따라 흔들리면 출력이 10배씩 출렁인다. 공진을 넓히려 질량을 키우면 출력 밀도가 죽고, 능동 튜닝을 넣으면 그 회로가 거둔 전력보다 더 먹어버리는 자기모순이 생긴다.",
    question: "순(net) 수확전력을 양수로 유지하면서 변동하는 진동 스펙트럼을 추종하려면, 어떤 물리적·회로적 우회로를 설계하겠는가?",
    gloss: [["임피던스 매칭", "발전소자와 부하의 전기적 특성을 맞춰 전력전달을 최대화"]],
  },
  {
    domain: "배터리 BMS / 친환경 스마트 에너지", difficulty: "hard",
    dilemma: "수천 셀이 밀집된 팩의 내부 미세단락을 전압 노이즈로 추적하는데, 냉각 블로워 팬과 구동 모터가 켜지는 순간 전원 라인에 대규모 서지·임피던스 강하가 생겨 셀 자체의 전압 요동을 완전히 덮어버린다(SNR 최악).",
    question: "외부 전력 간섭 속에서 셀 '내부 분리막 붕괴로 인한 진짜 전압 흔들림'만 가로채려면 알고리즘 State 단에 어떤 물리 변수나 마스킹 조건을 던지겠는가?",
    gloss: [["SNR", "신호대잡음비 — 높을수록 신호가 또렷"], ["서지", "순간적으로 치솟는 과전압·과전류"]],
  },
];

// ── quiz state (선언을 위로: LIVE 세션 복구가 참조하므로 TDZ 방지) ──
const state = { idx: 0, conf: 0, streak: 0, user: null, questions: SAMPLE };

// ── view switching ─────────────────────────────────────────────
const landing = $("landing");
const appView = $("app-view");

function showApp() {
  landing.classList.add("hidden");
  appView.classList.remove("hidden");
  window.scrollTo(0, 0);
  render();
}
function showLanding() {
  appView.classList.add("hidden");
  landing.classList.remove("hidden");
}

// ── auth modal ─────────────────────────────────────────────────
const modal = $("auth-modal");
const openModal = () => modal.classList.remove("hidden");
const closeModal = () => modal.classList.add("hidden");
on("[data-auth-open]", "click", openModal);
on("[data-auth-close]", "click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
on("[data-demo]", "click", () => { state.user = null; showApp(); });
on("[data-go-home]", "click", (e) => { e.preventDefault(); showLanding(); });

function note(msg, kind) {
  const n = $("auth-note");
  n.textContent = msg;
  n.className = "note " + kind;
}

$("magic-btn").addEventListener("click", async () => {
  const email = $("email").value.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return note("올바른 이메일을 입력하세요.", "err");
  if (!LIVE) {
    // 데모 모드: 백엔드 미연결 — 바로 데모로 입장
    state.user = { email, name: email.split("@")[0] };
    closeModal(); showApp();
    return;
  }
  $("magic-btn").disabled = true;
  const { error } = await supabase.auth.signInWithOtp({
    email, options: { emailRedirectTo: window.location.href },
  });
  $("magic-btn").disabled = false;
  if (error) return note("전송 실패: " + error.message, "err");
  note("✓ 이메일로 로그인 링크를 보냈습니다. 메일함을 확인하세요.", "ok");
});

$("google-btn").addEventListener("click", async () => {
  if (!LIVE) { state.user = { email: "demo@google", name: "Demo" }; closeModal(); showApp(); return; }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google", options: { redirectTo: window.location.href },
  });
  if (error) note("Google 로그인 실패: " + error.message, "err");
});

$("signout").addEventListener("click", async () => {
  if (LIVE && supabase) await supabase.auth.signOut();
  state.user = null;
  showLanding();
});

// 실연동 시 세션 복구
if (LIVE && supabase) {
  const { data } = await supabase.auth.getUser();
  if (data?.user) {
    state.user = { email: data.user.email, name: data.user.user_metadata?.name || data.user.email.split("@")[0] };
  }
  supabase.auth.onAuthStateChange((_e, session) => {
    if (session?.user) {
      state.user = { email: session.user.email, name: session.user.user_metadata?.name || session.user.email.split("@")[0] };
      closeModal(); showApp();
    }
  });
}

// ── quiz data loading ──────────────────────────────────────────
async function loadQuestions() {
  if (!LIVE || !supabase) return; // 데모: 샘플 사용
  try {
    const { data, error } = await supabase
      .from("questions").select("*").eq("status", "pending").limit(30);
    if (!error && data?.length) {
      state.questions = data.map((q) => ({
        domain: q.domain, difficulty: q.difficulty, dilemma: q.dilemma,
        question: q.question, gloss: q.gloss || [], qid: q.qid,
      }));
    }
  } catch (_) { /* 폴백: 샘플 유지 */ }
}

function render() {
  const q = state.questions[state.idx % state.questions.length];
  $("q-domain").textContent = q.domain;
  $("q-diff").textContent = (q.difficulty || "hard").toUpperCase();
  $("q-prog").textContent = `R1 · ${String((state.idx % state.questions.length) + 1).padStart(2, "0")}`;
  $("q-dilemma").textContent = q.dilemma;
  $("q-question").textContent = q.question;

  const ul = $("q-gloss"); ul.innerHTML = "";
  (q.gloss || []).forEach(([t, d]) => {
    const li = document.createElement("li");
    li.innerHTML = `• <b>${t}</b> = ${d}`;
    ul.appendChild(li);
  });
  $("q-glossbox").style.display = (q.gloss && q.gloss.length) ? "block" : "none";

  // user chrome
  const u = state.user;
  $("avatar").textContent = u ? (u.name?.[0] || "?").toUpperCase() : "◆";
  $("streak").textContent = state.streak ? `연속 ${state.streak}` : "";
  $("demo-badge").style.display = LIVE ? "none" : "inline-flex";

  // reset
  state.conf = 0;
  $("answer").value = ""; $("answer").disabled = false;
  document.querySelectorAll(".scale button").forEach((b) => b.classList.remove("sel"));
  $("feedback").classList.remove("show");
  $("saved").classList.remove("show");
  $("submit").disabled = true;
  $("submit").style.display = ""; $("skip").style.display = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function buildScale() {
  const s = $("scale");
  for (let i = 1; i <= 10; i++) {
    const b = document.createElement("button");
    b.textContent = i;
    b.addEventListener("click", () => {
      state.conf = i;
      document.querySelectorAll(".scale button").forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel");
      checkReady();
    });
    s.appendChild(b);
  }
}
function checkReady() {
  $("submit").disabled = !(state.conf > 0 && $("answer").value.trim().length > 0);
}
$("answer").addEventListener("input", checkReady);

// ── mock grading (데모). 실연동 시 Edge Function 으로 교체 ──────
function mockGrade(answer) {
  const len = answer.trim().length;
  const hasPhysics = /(임피던스|분포|제약|손실|위상|마스킹|보존|에너지|주파수|공진|토크|랜덤|보정|경계|스케줄)/.test(answer);
  let v = Math.min(88, 30 + Math.floor(len / 6) + (hasPhysics ? 22 : 0));
  let g = Math.min(84, 24 + Math.floor(len / 8) + (hasPhysics ? 26 : 0));
  v += Math.floor(Math.random() * 8) - 4;
  g += Math.floor(Math.random() * 8) - 4;
  v = Math.max(12, Math.min(92, v)); g = Math.max(10, Math.min(90, g));
  const crits = [
    "방향은 타당하나, 학습 안 한 경계조건으로의 외삽 실패 모드가 여전히 무방비다.",
    "정성적 서술에 머문다. 실제로 어떤 변수를 어떤 순서로 조정할지 정량 절차가 빠졌다.",
    "트레이드오프의 한쪽만 막았다. 반대편(성능·전력·속도) 손실을 어떻게 보상할지가 비어있다.",
    "아이디어는 영리하나, 과도구간(켜지는 순간)의 동특성을 무시해 오검출/발산 위험이 남는다.",
  ];
  return { v, g, c: crits[len % crits.length] };
}

async function gradeAnswer(q, answer, conf) {
  // 실연동(LIVE_GRADING)면 Edge Function 호출, 아니면 mock
  if (LIVE && CFG.LIVE_GRADING && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke("grade", {
        body: { prompt: q.question, dilemma: q.dilemma, answer, confidence: conf },
      });
      if (!error && data) return { v: data.validity, g: data.ingenuity, c: data.critique };
    } catch (_) { /* 폴백 */ }
  }
  return mockGrade(answer);
}

async function saveAnswer(q, answer, conf) {
  if (!LIVE || !supabase || !state.user) return; // 데모: 저장 안 함
  try {
    await supabase.from("contributions").insert({
      qid: q.qid || null, domain: q.domain, question: q.question,
      answer_raw: answer, confidence: conf,
    });
  } catch (_) { /* 무손실 원칙: 실패해도 UI는 진행, 추후 재시도 가능 */ }
}

function animateNum(id, to) {
  let n = 0; const step = Math.max(1, Math.round(to / 22));
  const t = setInterval(() => { n += step; if (n >= to) { n = to; clearInterval(t); } $(id).textContent = n; }, 22);
}

$("submit").addEventListener("click", async () => {
  const q = state.questions[state.idx % state.questions.length];
  const answer = $("answer").value.trim();
  $("answer").disabled = true;
  $("submit").style.display = "none"; $("skip").style.display = "none";

  await saveAnswer(q, answer, state.conf);
  $("saved").classList.add("show");

  const fb = await gradeAnswer(q, answer, state.conf);
  $("critique").textContent = fb.c;
  $("v-num").textContent = "0"; $("g-num").textContent = "0";
  $("v-bar").style.width = "0"; $("g-bar").style.width = "0";
  $("feedback").classList.add("show");
  setTimeout(() => {
    $("v-bar").style.width = fb.v + "%"; $("g-bar").style.width = fb.g + "%";
    animateNum("v-num", fb.v); animateNum("g-num", fb.g);
  }, 60);
  state.streak++;
  $("streak").textContent = `연속 ${state.streak}`;
});

$("next").addEventListener("click", () => { state.idx++; render(); });
$("skip").addEventListener("click", () => { state.idx++; render(); });

// ── nav scroll state + scroll reveal ───────────────────────────
const nav = $("nav");
addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 8), { passive: true });

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// ── init ────────────────────────────────────────────────────────
buildScale();
await loadQuestions();
if (state.user) showApp(); // 세션 복구된 경우
