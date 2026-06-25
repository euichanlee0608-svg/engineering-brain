// ──────────────────────────────────────────────────────────────
// Engineering Brain — web app logic
// Supabase 미설정이면 자동 데모 모드. 설정되면 익명(이름만)/로그인 + 실채점.
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

// ── i18n (한/영 토글 스캐폴드: UI 크롬만. 질문 본문은 추후 lang 컬럼) ──────────
const T = {
  ko: {
    "nav.how": "작동 방식", "nav.domains": "도메인", "nav.login": "로그인",
    "hero.kicker": "Fusion-Engineering Reasoning Gym",
    "hero.title1": "정답이 아니라", "hero.titleEm": "우회로", "hero.title2": "를 설계하라",
    "hero.lead": "기계공학과 AI가 충돌하는 지점의 난제를 하나씩. 양식 없이, 날것 그대로 답하면 까칠하게 채점한다. 쌓이는 건 당신의 사고 과정 그 자체.",
    "hero.ctaStart": "시작하기", "hero.ctaDemo": "먼저 한 문제 풀어보기",
    "hero.note1b": "무가입 3문제", "hero.note1t": "이름만 입력", "hero.note2b": "즉시 채점", "hero.note2t": "타당성·돌파력", "hero.note3b": "원문 무손실", "hero.note3t": "한 글자도 안 바꿈",
    "sample.kicker": "맛보기", "sample.h2": "이런 문제가 나온다", "sample.lead": "정답이 정해진 시험이 아니다. 트레이드오프가 살아있는 실전 딜레마 하나.", "sample.ctaSolve": "이 문제 직접 풀어보기",
    "sample.dilemma": "RANS 시뮬레이션의 난류 점성 모델이 박리 영역에서 크게 틀려, 고해상도 LES 데이터로 학습한 신경망으로 레이놀즈 응력을 보정하려 한다. 그런데 보정항을 넣는 순간 솔버가 발산하거나, 학습 안 한 형상에선 비물리적 음의 에너지 생성이 터진다.",
    "sample.question": "솔버 안정성과 물리적 실현가능성을 깨지 않으면서 데이터 기반 보정을 끼워넣으려면, 학습 대상과 제약을 어떻게 재정의하겠는가?",
    "sample.g1": "• <b>RANS</b> = 시간평균 난류방정식(빠르지만 부정확)", "sample.g2": "• <b>realizability</b> = 응력이 물리적으로 가능한 범위에 머무는 조건",
    "card.dilemma": "딜레마 상황", "card.question": "질문",
    "how.kicker": "어떻게 작동하나", "how.h2": "생각하는 과정을 데이터로 남긴다", "how.lead": "맞히는 시험이 아니다. 막힌 곳에서 어떻게 우회로를 뚫는지, 그 사고의 흔적을 모은다.",
    "how.s1t": "난제 한 개", "how.s1d": "도메인·딜레마·질문이 담긴 카드를 받는다. 교과서 연습문제는 없다. 매번 트레이드오프가 살아있는 실전 딜레마.",
    "how.s2t": "날것으로 답한다", "how.s2d": "먼저 자신도(1~10)를 찍고, 양식 없이 자유롭게 쓴다. 당신이 쓴 원문은 한 글자도 바뀌지 않고 그대로 저장된다.",
    "how.s3t": "까칠한 채점", "how.s3d": "공학적 타당성과 우회 돌파력을 점수로, 치명적 한계를 한 줄로. 아첨 없이. 그리고 다음 문제로.",
    "dom.kicker": "도메인", "dom.h2": "풀고 싶은 분야를 골라서", "dom.lead": "지금은 융합공학 난제가 한데 섞여 나온다. 곧 도메인별로 골라 풀 수 있게 확장된다.", "dom.note": "※ 도메인 선택은 준비 중입니다. 질문 품질 검증 후 분야별로 순차 오픈됩니다.",
    "dom.all": "융합 난제 (전체)", "dom.d1": "로보틱스 / 제어", "dom.d2": "유체 · 열 · 에너지", "dom.d3": "신호처리 / 임베디드", "dom.d4": "재료 · 구조", "dom.d5": "배터리 / 전력", "dom.now": "지금 풀기", "dom.soon": "준비중",
    "phil.kicker": "왜 이렇게", "phil.h2": "정제하지 않은 사고가<br>가장 비싼 데이터다", "phil.lead": "매끄럽게 다듬은 정답보다, 막히고 더듬으며 길을 찾는 과정이 진짜 공학 지능이다.",
    "phil.i1t": "원문 무손실", "phil.i1d": "당신이 쓴 답은 채점·정규화보다 먼저 그대로 적재된다. 손실 없이 보존하니 나중에 어떤 용도로든 쓸 수 있다.",
    "phil.i2t": "아첨 0%의 채점", "phil.i2d": "\"좋은 시도예요\" 같은 말은 없다. 타당성과 돌파력을 숫자로 보고, 가장 치명적인 약점 하나를 정면으로 짚는다.",
    "phil.i3t": "내 데이터는 따로", "phil.i3d": "참여자의 답변은 각자 분리 보관된다. 로그인은 당신의 진행 상황과 답변을 안전하게 잇기 위한 것이다.",
    "cta.h2": "한 문제면 감이 온다", "cta.lead": "이름만 입력하면 3문제까지 무료로 채점받을 수 있다. 더 풀고 데이터를 남기려면 로그인.", "cta.start": "지금 시작하기",
    "foot.copy": "© 2026 Engineering Brain · 융합공학 추론 데이터셋 프로젝트",
    "app.exit": "나가기",
    "card.confidence": "먼저, 얼마나 아는가", "card.confhint": "1 = 감 없음 · 10 = 완전 자신", "card.answer": "내 답 · 양식 없음, 날것 그대로", "card.placeholder": "물리적 인과를 붙잡고 우회로를 설계해봐…", "card.submit": "제출하고 채점받기", "card.skip": "건너뛰기", "card.saved": "✓ 답변 저장됨 (원문 무손실)", "card.grading": "채점 중…",
    "fb.title": "즉석 채점", "fb.tag": "아첨 0%", "fb.validity": "공학적 타당성", "fb.ingenuity": "우회 돌파력", "fb.critique": "치명적 한계 · ", "fb.hint": "힌트 · ", "fb.retry": "다시 답변하기", "fb.next": "다음 질문으로",
    "limit.title": "무료 3문제를 다 풀었어요", "limit.body": "로그인하면 계속 풀 수 있고, 답변과 채점이 당신의 데이터셋으로 저장됩니다.", "limit.cta": "로그인하고 계속하기",
    "badge.demo": "데모 모드 · 채점은 샘플입니다",
    "modal.title": "Engineering Brain 시작", "modal.sub": "이름만 입력하면 바로 3문제를 무료로 풀고 채점받을 수 있어요.", "modal.nameLabel": "이름 (또는 닉네임)", "modal.freeStart": "무료로 시작 (3문제)", "modal.divider": "더 풀고 데이터를 남기려면", "modal.google": "Google로 계속하기", "modal.emailLabel": "이메일로 로그인 링크 받기", "modal.magicBtn": "로그인 링크 받기", "modal.foot": "계속하면 답변 데이터의 수집·저장 및 제3자(채점 모델) 전송에 동의하는 것으로 봅니다.",
    "free.left": (n) => `무료 ${n}/3`,
  },
  en: {
    "nav.how": "How it works", "nav.domains": "Domains", "nav.login": "Sign in",
    "hero.kicker": "Fusion-Engineering Reasoning Gym",
    "hero.title1": "Design the", "hero.titleEm": "workaround", "hero.title2": ", not the answer",
    "hero.lead": "Hard problems where mechanical engineering collides with AI, one at a time. Answer raw, no format, and get graded without flattery. What accumulates is your reasoning itself.",
    "hero.ctaStart": "Get started", "hero.ctaDemo": "Try one problem first",
    "hero.note1b": "3 free", "hero.note1t": "name only", "hero.note2b": "Instant grading", "hero.note2t": "validity · ingenuity", "hero.note3b": "Lossless", "hero.note3t": "your words, unchanged",
    "sample.kicker": "Preview", "sample.h2": "A problem looks like this", "sample.lead": "Not a test with a fixed answer. One real dilemma with live trade-offs.", "sample.ctaSolve": "Solve this one yourself",
    "sample.dilemma": "The eddy-viscosity model in a RANS simulation is badly wrong in separation regions, so you correct the Reynolds stresses with a neural network trained on high-resolution LES data. But the moment you add the correction term, the solver diverges, or on untrained geometries it produces unphysical negative energy generation.",
    "sample.question": "To embed a data-driven correction without breaking solver stability or physical realizability, how would you redefine the learning target and its constraints?",
    "sample.g1": "• <b>RANS</b> = Time-averaged turbulence equations (fast but inaccurate)", "sample.g2": "• <b>realizability</b> = The condition that stresses stay within physically possible values",
    "card.dilemma": "Dilemma", "card.question": "Question",
    "how.kicker": "How it works", "how.h2": "We capture the reasoning, not the answer", "how.lead": "Not a quiz to ace. We collect the trace of how you carve a path out when you're stuck.",
    "how.s1t": "One hard problem", "how.s1d": "A card with domain, dilemma and question. No textbook exercises. A real dilemma with live trade-offs every time.",
    "how.s2t": "Answer raw", "how.s2d": "Rate your confidence (1-10) first, then write freely with no format. Your words are stored exactly, unchanged.",
    "how.s3t": "Blunt grading", "how.s3d": "Engineering validity and breakthrough ingenuity as scores, the fatal flaw in one line. No flattery. Then the next problem.",
    "dom.kicker": "Domains", "dom.h2": "Pick the field you want", "dom.lead": "For now, fusion-engineering problems come mixed. Soon you'll pick problems by domain.", "dom.note": "* Domain selection is in preparation. Fields open gradually after question quality is validated.",
    "dom.all": "Fusion (all)", "dom.d1": "Robotics / Control", "dom.d2": "Fluids · Heat · Energy", "dom.d3": "Signal / Embedded", "dom.d4": "Materials · Structures", "dom.d5": "Battery / Power", "dom.now": "Solve now", "dom.soon": "Soon",
    "phil.kicker": "Why this way", "phil.h2": "Unpolished reasoning<br>is the costliest data", "phil.lead": "More than a clean final answer, the process of fumbling toward a path is real engineering intelligence.",
    "phil.i1t": "Lossless capture", "phil.i1d": "Your answer is stored as-is, before any grading or normalization. Preserved losslessly so it can serve any later use.",
    "phil.i2t": "Zero flattery", "phil.i2d": "No \"nice try\" here. Validity and ingenuity as numbers, and the single most fatal weakness called out head-on.",
    "phil.i3t": "Your data, separate", "phil.i3d": "Each participant's answers are stored separately. Sign-in just links your progress and answers safely.",
    "cta.h2": "One problem and you'll get it", "cta.lead": "Enter just your name for 3 free graded problems. Sign in to keep going and save your data.", "cta.start": "Start now",
    "foot.copy": "© 2026 Engineering Brain · Fusion-engineering reasoning dataset",
    "app.exit": "Exit",
    "card.confidence": "First, how well do you know this", "card.confhint": "1 = no clue · 10 = fully sure", "card.answer": "Your answer · no format, raw", "card.placeholder": "Grab the physical causality and design a workaround…", "card.submit": "Submit and get graded", "card.skip": "Skip", "card.saved": "✓ Answer saved (lossless)", "card.grading": "Grading…",
    "fb.title": "Instant grading", "fb.tag": "0% flattery", "fb.validity": "Engineering validity", "fb.ingenuity": "Breakthrough ingenuity", "fb.critique": "Fatal flaw · ", "fb.hint": "Hint · ", "fb.retry": "Try again", "fb.next": "Next problem",
    "limit.title": "You've used your 3 free problems", "limit.body": "Sign in to keep going, and your answers and grades are saved as your dataset.", "limit.cta": "Sign in to continue",
    "badge.demo": "Demo mode · grading is sample",
    "modal.title": "Start Engineering Brain", "modal.sub": "Enter just your name to solve 3 problems free with grading.", "modal.nameLabel": "Name (or nickname)", "modal.freeStart": "Start free (3 problems)", "modal.divider": "To keep going and save data", "modal.google": "Continue with Google", "modal.emailLabel": "Get a sign-in link by email", "modal.magicBtn": "Send sign-in link", "modal.foot": "By continuing you agree to collection/storage of answer data and transfer to a third-party grading model.",
    "free.left": (n) => `Free ${n}/3`,
  },
};
let LANG = localStorage.getItem("eb_lang") || (navigator.language?.startsWith("en") ? "en" : "ko");

function tr(key) { return (T[LANG] && T[LANG][key]) ?? (T.ko[key] ?? ""); }
function applyLang() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = tr(el.getAttribute("data-i18n"));
    if (v) el.innerHTML = v;
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    const v = tr(el.getAttribute("data-i18n-ph"));
    if (v) el.placeholder = v;
  });
  document.querySelectorAll("#lang-toggle button").forEach((b) =>
    b.classList.toggle("active", b.dataset.lang === LANG));
  renderDomains();
  // render()는 호출하지 않음 — 앱 진행 중 언어 전환이 입력/진행을 지우지 않게.
}
on("#lang-toggle button", "click", (e) => {
  LANG = e.currentTarget.dataset.lang;
  localStorage.setItem("eb_lang", LANG);
  applyLang();
});

// ── domains (목업: 전체만 활성, 나머지 준비중) ──────────────────
function renderDomains() {
  const grid = $("domain-grid");
  if (!grid) return;
  const items = [
    { key: "dom.all", now: true },
    { key: "dom.d1" }, { key: "dom.d2" }, { key: "dom.d3" }, { key: "dom.d4" }, { key: "dom.d5" },
  ];
  grid.innerHTML = "";
  items.forEach((it) => {
    const el = document.createElement(it.now ? "button" : "div");
    el.className = "domain-chip " + (it.now ? "active-now" : "soon");
    el.innerHTML = `<span>${tr(it.key)}</span><span class="soon-tag">${it.now ? tr("dom.now") : tr("dom.soon")}</span>`;
    if (it.now) el.addEventListener("click", openModal);
    grid.appendChild(el);
  });
}

// ── view switching ─────────────────────────────────────────────
const landing = $("landing");
const appView = $("app-view");
function showApp() {
  landing.classList.add("hidden");
  appView.classList.remove("hidden");
  window.scrollTo(0, 0);
  render();
}
function showLanding() { appView.classList.add("hidden"); landing.classList.remove("hidden"); }

// ── auth modal ─────────────────────────────────────────────────
const modal = $("auth-modal");
const openModal = () => modal.classList.remove("hidden");
const closeModal = () => modal.classList.add("hidden");
on("[data-auth-open]", "click", openModal);
on("[data-auth-close]", "click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
on("[data-demo]", "click", () => { state.user = null; showApp(); });
on("[data-go-home]", "click", (e) => { e.preventDefault(); showLanding(); });

function note(msg, kind) { const n = $("auth-note"); n.textContent = msg; n.className = "note " + kind; }

// 이름만 입력 → 익명 로그인(3문제 무료 실채점)
$("free-btn").addEventListener("click", async () => {
  const name = $("nick").value.trim() || (LANG === "en" ? "Guest" : "익명");
  if (!LIVE || !supabase) { state.user = { name, anon: true }; state.freeUsed = 0; closeModal(); showApp(); return; }
  $("free-btn").disabled = true;
  const { error } = await supabase.auth.signInAnonymously({ options: { data: { name } } });
  $("free-btn").disabled = false;
  if (error) return note((LANG === "en" ? "Anonymous start failed: " : "익명 시작 실패: ") + error.message, "err");
  // onAuthStateChange 가 입장 처리. 이름 보강.
  state.pendingName = name;
});

$("magic-btn").addEventListener("click", async () => {
  const email = $("email").value.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return note(LANG === "en" ? "Enter a valid email." : "올바른 이메일을 입력하세요.", "err");
  if (!LIVE) { state.user = { email, name: email.split("@")[0] }; closeModal(); showApp(); return; }
  $("magic-btn").disabled = true;
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
  $("magic-btn").disabled = false;
  if (error) return note((LANG === "en" ? "Send failed: " : "전송 실패: ") + error.message, "err");
  note(LANG === "en" ? "✓ Sign-in link sent. Check your inbox." : "✓ 이메일로 로그인 링크를 보냈습니다. 메일함을 확인하세요.", "ok");
});

$("google-btn").addEventListener("click", async () => {
  if (!LIVE) { state.user = { email: "demo@google", name: "Demo" }; closeModal(); showApp(); return; }
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href } });
  if (error) note((LANG === "en" ? "Google sign-in failed: " : "Google 로그인 실패: ") + error.message, "err");
});

$("signout").addEventListener("click", async () => {
  if (LIVE && supabase) await supabase.auth.signOut();
  state.user = null; showLanding();
});

// ── quiz state ─────────────────────────────────────────────────
const state = { idx: 0, conf: 0, streak: 0, user: null, questions: [], freeUsed: 0, pendingName: null };

function setUserFromSession(session) {
  const u = session?.user;
  if (!u) return;
  const anon = u.is_anonymous === true;
  const name = u.user_metadata?.name || state.pendingName || (u.email ? u.email.split("@")[0] : (LANG === "en" ? "Guest" : "익명"));
  state.user = { name, anon, email: u.email || null };
}

if (LIVE && supabase) {
  const { data } = await supabase.auth.getUser();
  if (data?.user) setUserFromSession({ user: data.user });
  supabase.auth.onAuthStateChange((_e, session) => {
    if (session?.user) { setUserFromSession(session); closeModal(); showApp(); }
  });
}

// ── sample questions (실제 은행에서 뽑은 난제들 — DB 비었을 때 폴백) ──────────
const SAMPLE = [
  { domain: "유체역학 / ML 난류 모델링", difficulty: "extreme",
    dilemma: "RANS 시뮬레이션의 난류 점성 모델이 박리(separation) 영역에서 크게 틀려서, 고해상도 LES 데이터로 학습한 신경망으로 레이놀즈 응력을 보정하려 한다. 그런데 신경망 보정항을 넣는 순간 수치 솔버가 발산하거나, 학습 안 한 형상에선 비물리적 음의 에너지 생성이 터진다.",
    question: "솔버 안정성과 물리적 실현가능성(realizability)을 깨지 않으면서 데이터 기반 보정을 끼워넣으려면, 학습 대상과 제약을 어떻게 재정의하겠는가?",
    gloss: [["RANS", "시간평균 난류방정식(빠르지만 부정확)"], ["realizability", "응력이 물리적으로 가능한 값 범위에 머무는 조건"]],
    domain_en: "Fluid dynamics / ML turbulence modeling",
    dilemma_en: "The eddy-viscosity model in a RANS simulation is badly wrong in separation regions, so you want to correct the Reynolds stresses with a neural network trained on high-resolution LES data. But the moment you insert the NN correction term, the solver diverges, or on geometries it was not trained on it produces unphysical negative energy generation.",
    question_en: "To embed a data-driven correction without breaking solver stability or physical realizability, how would you redefine the learning target and its constraints?",
    gloss_en: [["RANS", "Time-averaged turbulence equations; fast but inaccurate"], ["Realizability", "The condition that stresses stay within physically possible values"]] },
  { domain: "사족보행 로봇 / Sim-to-Real 강화학습", difficulty: "extreme",
    dilemma: "MuJoCo에서 PPO로 학습한 보행 정책이 시뮬에선 거의 완벽한데, 실제 액추에이터의 기어 백래시·토크 포화·8ms 통신지연이 겹치면 접촉 타이밍이 어긋나 비틀거린다. 도메인 랜덤화를 넓히면 강인해지지만 평균 보행속도가 급락하고, 실하드웨어 롤아웃은 마모로 50 에피소드만 허용된다.",
    question: "강인성과 평균성능을 동시에 살리려면 랜덤화 '분포 자체'를 어떻게 설계·스케줄링하고, 그 50 에피소드를 어디에 쓰겠는가?",
    gloss: [["백래시", "기어 맞물림 틈에서 생기는 위치 사각지대"], ["도메인 랜덤화", "시뮬 물성을 무작위로 흔들어 강인성을 키우는 기법"]],
    domain_en: "Quadruped robots / Sim-to-Real reinforcement learning",
    dilemma_en: "A walking policy trained with PPO in MuJoCo is nearly flawless in simulation, but on real hardware the combination of actuator gear backlash, torque saturation, and an 8 ms communication delay throws off the contact timing and the robot staggers. Widening domain randomization buys robustness but sharply drops average speed, and real-hardware rollouts are limited to 50 episodes by wear.",
    question_en: "To preserve both robustness and average performance, how would you design and schedule the randomization 'distribution itself,' and where would you spend those 50 episodes?",
    gloss_en: [["Backlash", "Positional dead zone from the clearance between meshing gear teeth"], ["Domain randomization", "Randomly perturbing simulator properties to build robustness"]] },
];

async function loadQuestions() {
  state.questions = SAMPLE;
  if (!LIVE || !supabase) return;
  try {
    const { data, error } = await supabase.from("questions").select("*").eq("status", "pending").limit(50);
    if (!error && data?.length) {
      // 셔플(매번 같은 순서 방지)
      const arr = data.map((q) => ({ domain: q.domain, difficulty: q.difficulty, dilemma: q.dilemma, question: q.question, gloss: q.gloss || [], qid: q.qid,
        domain_en: q.domain_en, dilemma_en: q.dilemma_en, question_en: q.question_en, gloss_en: q.gloss_en }));
      for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
      state.questions = arr;
    }
  } catch (_) { /* 폴백: SAMPLE */ }
}

function render() {
  const q = state.questions[state.idx % state.questions.length];
  // 영어 페이지에선 영어 본문으로 완전 대체(없으면 한국어 폴백)
  const en = LANG === "en";
  const domain = (en && q.domain_en) || q.domain;
  const dilemma = (en && q.dilemma_en) || q.dilemma;
  const question = (en && q.question_en) || q.question;
  const gloss = (en && q.gloss_en) ? q.gloss_en : (q.gloss || []);
  $("q-domain").textContent = domain;
  $("q-diff").textContent = (q.difficulty || "hard").toUpperCase();
  $("q-prog").textContent = `R1 · ${String((state.idx % state.questions.length) + 1).padStart(2, "0")}`;
  $("q-dilemma").textContent = dilemma;
  $("q-question").textContent = question;

  const ul = $("q-gloss"); ul.innerHTML = "";
  gloss.forEach(([t, d]) => { const li = document.createElement("li"); li.innerHTML = `• <b>${t}</b> = ${d}`; ul.appendChild(li); });
  $("q-glossbox").style.display = gloss.length ? "block" : "none";

  const u = state.user;
  $("avatar").textContent = u ? (u.name?.[0] || "?").toUpperCase() : "◆";
  // 무료 사용자 남은 횟수 표시
  if (u?.anon) $("streak").textContent = tr("free.left")(Math.min(state.freeUsed, 3));
  else $("streak").textContent = state.streak ? (LANG === "en" ? `Streak ${state.streak}` : `연속 ${state.streak}`) : "";
  // 실채점 대상이면 데모뱃지 숨김
  const realGrading = !!(u && LIVE && CFG.LIVE_GRADING);
  $("demo-badge").style.display = realGrading ? "none" : "inline-flex";

  state.conf = 0;
  $("answer").value = ""; $("answer").disabled = false;
  document.querySelectorAll(".scale button").forEach((b) => b.classList.remove("sel"));
  $("feedback").classList.remove("show");
  $("limit-box").classList.remove("show");
  $("saved").classList.remove("show");
  $("grading").classList.remove("show");
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
      b.classList.add("sel"); checkReady();
    });
    s.appendChild(b);
  }
}
function checkReady() { $("submit").disabled = !(state.conf > 0 && $("answer").value.trim().length > 0); }
$("answer").addEventListener("input", checkReady);

// ── mock grading (데모/익명한도초과·비로그인). 실연동은 grade Edge Function ──
function mockGrade(answer) {
  const len = answer.trim().length;
  const hasPhysics = /(임피던스|분포|제약|손실|위상|마스킹|보존|에너지|주파수|공진|토크|랜덤|보정|경계|스케줄)/.test(answer);
  let v = Math.min(88, 30 + Math.floor(len / 6) + (hasPhysics ? 22 : 0));
  let g = Math.min(84, 24 + Math.floor(len / 8) + (hasPhysics ? 26 : 0));
  v += Math.floor(Math.random() * 8) - 4; g += Math.floor(Math.random() * 8) - 4;
  v = Math.max(12, Math.min(92, v)); g = Math.max(10, Math.min(90, g));
  const crits = [
    "방향은 타당하나, 학습 안 한 경계조건으로의 외삽 실패 모드가 여전히 무방비다.",
    "정성적 서술에 머문다. 실제로 어떤 변수를 어떤 순서로 조정할지 정량 절차가 빠졌다.",
    "트레이드오프의 한쪽만 막았다. 반대편(성능·전력·속도) 손실을 어떻게 보상할지가 비어있다.",
  ];
  const hints = [
    "최악의 실패 케이스를 하나 정해, 그 조건에서도 안 깨지는 제약을 먼저 못 박아봐.",
    "핵심 변수 하나를 골라 '무엇을·어떤 신호로·언제' 조절할지 정량으로 닫아봐.",
    "막은 쪽 말고 희생된 쪽을 명시하고, 그 손실을 어디서 되찾을지 한 수 더 둬봐.",
  ];
  return { v, g, c: crits[len % crits.length], h: hints[len % hints.length] };
}

async function gradeAnswer(q, answer, conf) {
  if (LIVE && CFG.LIVE_GRADING && supabase && state.user) {
    try {
      const { data, error } = await supabase.functions.invoke("grade", {
        body: { prompt: q.question, dilemma: q.dilemma, domain: q.domain, answer, confidence: conf, lang: LANG },
      });
      if (error) {
        try { const e = await error.context.json(); if (e.error === "free_limit") return { limit: true }; } catch (_) {}
        return mockGrade(answer); // 그 외 오류 → mock 폴백
      }
      if (data && typeof data.validity === "number") return { v: data.validity, g: data.ingenuity, c: data.critique, h: data.hint };
    } catch (_) { /* 폴백 */ }
  }
  return mockGrade(answer);
}

async function saveAnswer(q, answer, conf) {
  if (!LIVE || !supabase || !state.user) return null;
  try {
    const { data } = await supabase.from("contributions").insert({
      qid: q.qid || null, domain: q.domain, question: q.question,
      answer_raw: answer, confidence: conf, name: state.user.name || null,
    }).select("id").single();
    return data?.id || null;
  } catch (_) { return null; }
}
async function saveFeedback(id, fb) {
  if (!id || !LIVE || !supabase) return;
  try {
    await supabase.from("contributions").update({ feedback: { validity: fb.v, ingenuity: fb.g, critique: fb.c } }).eq("id", id);
  } catch (_) {}
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

  const contribId = await saveAnswer(q, answer, state.conf);
  if (contribId) $("saved").classList.add("show");  // 실제 저장된 경우만(데모는 표시 안 함)
  $("grading").classList.add("show");               // 채점 중 표시(Gemini 1~3초)

  const fb = await gradeAnswer(q, answer, state.conf);
  $("grading").classList.remove("show");
  if (fb && fb.limit) {                       // 익명 무료 3회 초과
    state.freeUsed = 3;
    $("limit-box").classList.add("show");
    if (state.user?.anon) $("streak").textContent = tr("free.left")(3);
    return;
  }
  saveFeedback(contribId, fb);
  if (state.user?.anon) { state.freeUsed++; $("streak").textContent = tr("free.left")(Math.min(state.freeUsed, 3)); }

  $("critique").textContent = fb.c;
  $("hint").textContent = fb.h || "";
  $("hint-line").style.display = fb.h ? "block" : "none";
  $("v-num").textContent = "0"; $("g-num").textContent = "0";
  $("v-bar").style.width = "0"; $("g-bar").style.width = "0";
  $("feedback").classList.add("show");
  setTimeout(() => { $("v-bar").style.width = fb.v + "%"; $("g-bar").style.width = fb.g + "%"; animateNum("v-num", fb.v); animateNum("g-num", fb.g); }, 60);
  if (!state.user?.anon) { state.streak++; $("streak").textContent = LANG === "en" ? `Streak ${state.streak}` : `연속 ${state.streak}`; }
});

$("next").addEventListener("click", () => { state.idx++; render(); });
$("skip").addEventListener("click", () => { state.idx++; render(); });
// 다시 답변하기 — 같은 질문을 그대로 다시(idx 유지). 답변·자신도 초기화, 새 답안은 새 기여로 적재(원문 무손실).
$("retry").addEventListener("click", () => { render(); });

// ── nav scroll state + scroll reveal ───────────────────────────
const nav = $("nav");
addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 8), { passive: true });
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// ── init ────────────────────────────────────────────────────────
buildScale();
applyLang();
await loadQuestions();
if (state.user) showApp();
