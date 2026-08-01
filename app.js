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
    "hero.lead": "공학의 여러 분야가 충돌하는 지점의 난제를 하나씩. 양식 없이, 날것 그대로 답하면 까칠하게 채점한다. 쌓이는 건 당신의 사고 과정 그 자체.",
    "hero.ctaEng": "🔧 공학 난제 풀기", "hero.ctaPhil": "🤔 철학 딜레마 풀기",
    "hero.note1b": "무가입 3문제", "hero.note1t": "이름만 입력", "hero.note2b": "즉시 채점", "hero.note2t": "타당성·돌파력", "hero.note3b": "원문 무손실", "hero.note3t": "한 글자도 안 바꿈",
    "sample.kicker": "맛보기", "sample.h2": "이런 문제가 나온다", "sample.lead": "정답이 정해진 시험이 아니다. 트레이드오프가 살아있는 실전 딜레마 하나.", "sample.ctaSolve": "이 문제 직접 풀어보기",
    "sample.dilemma": "RANS 시뮬레이션의 난류 점성 모델이 박리 영역에서 크게 틀려, 고해상도 LES 데이터로 학습한 신경망으로 레이놀즈 응력을 보정하려 한다. 그런데 보정항을 넣는 순간 솔버가 발산하거나, 학습 안 한 형상에선 비물리적 음의 에너지 생성이 터진다.",
    "sample.question": "솔버 안정성과 물리적 실현가능성을 깨지 않으면서 데이터 기반 보정을 끼워넣으려면, 학습 대상과 제약을 어떻게 재정의하겠는가?",
    "sample.g1": "• <b>RANS</b> = 시간평균 난류방정식(빠르지만 부정확)", "sample.g2": "• <b>realizability</b> = 응력이 물리적으로 가능한 범위에 머무는 조건",
    "samplePhil.kicker": "또 다른 코너", "samplePhil.h2": "철학 딜레마도 있다", "samplePhil.lead": "정답 없는 질문에 당신의 입장을 걸어라. 공학과는 다른 결의 사고실험.",
    "samplePhil.dilemma": "폭주하는 트롤리가 선로에 묶인 5명을 향해 달려간다. 당신 옆의 레버를 당기면 트롤리는 다른 선로로 빠지지만, 그 선로엔 1명이 묶여 있다. 아무것도 안 하면 5명이 죽고, 레버를 당기면 5명은 살지만 당신의 행동으로 1명이 죽는다.",
    "samplePhil.question": "레버를 당기겠는가? '아무것도 안 함'과 '내 손으로 죽임'은 도덕적으로 같은가, 다른가?",
    "card.dilemma": "딜레마 상황", "card.question": "질문", "card.cardsToggle": "🃏 참고 카드 (넘어서도 됨)",
    "how.kicker": "어떻게 작동하나", "how.h2": "생각하는 과정을 데이터로 남긴다", "how.lead": "맞히는 시험이 아니다. 막힌 곳에서 어떻게 우회로를 뚫는지, 그 사고의 흔적을 모은다.",
    "how.s1t": "난제 한 개", "how.s1d": "도메인·딜레마·질문이 담긴 카드를 받는다. 교과서 연습문제는 없다. 매번 트레이드오프가 살아있는 실전 딜레마.",
    "how.s2t": "날것으로 답한다", "how.s2d": "먼저 자신도(1~10)를 찍고, 양식 없이 자유롭게 쓴다. 당신이 쓴 원문은 한 글자도 바뀌지 않고 그대로 저장된다.",
    "how.s3t": "까칠한 채점", "how.s3d": "공학적 타당성과 우회 돌파력을 점수로, 치명적 한계를 한 줄로. 아첨 없이. 그리고 다음 문제로.",
    "dom.kicker": "도메인", "dom.h2": "풀고 싶은 분야를 골라서", "dom.lead": "공학과 철학, 각각 세부 분야를 골라 바로 풀 수 있다.",
    "dom.engHead": "🔧 공학 분야", "dom.philHead": "🤔 철학 갈래",
    "phil.kicker": "왜 이렇게", "phil.h2": "정제하지 않은 사고가<br>가장 비싼 데이터다", "phil.lead": "매끄럽게 다듬은 정답보다, 막히고 더듬으며 길을 찾는 과정이 진짜 공학 지능이다.",
    "phil.i1t": "원문 무손실", "phil.i1d": "당신이 쓴 답은 채점·정규화보다 먼저 그대로 적재된다. 손실 없이 보존하니 나중에 어떤 용도로든 쓸 수 있다.",
    "phil.i2t": "아첨 0%의 채점", "phil.i2d": "\"좋은 시도예요\" 같은 말은 없다. 타당성과 돌파력을 숫자로 보고, 가장 치명적인 약점 하나를 정면으로 짚는다.",
    "phil.i3t": "내 데이터는 따로", "phil.i3d": "참여자의 답변은 각자 분리 보관된다. 로그인은 당신의 진행 상황과 답변을 안전하게 잇기 위한 것이다.",
    "cta.h2": "한 문제면 감이 온다", "cta.lead": "이름만 입력하면 3문제까지 무료로 채점받을 수 있다. 더 풀고 데이터를 남기려면 로그인.", "cta.start": "지금 시작하기",
    "foot.copy": "© 2026 Engineering Brain · 융합공학 추론 데이터셋 프로젝트",
    "app.exit": "나가기",
    "card.confidence": "먼저, 얼마나 아는가", "card.confhint": "1 = 감 없음 · 10 = 완전 자신", "card.answer": "내 답 · 양식 없음, 날것 그대로", "card.placeholder": "물리적 인과를 붙잡고 우회로를 설계해봐…", "card.placeholder.phil": "당신의 입장을 정하고, 왜 그런지 논증해봐…", "card.submit": "제출하고 채점받기", "card.skip": "건너뛰기", "card.saved": "✓ 답변 저장됨 (원문 무손실)", "card.grading": "채점 중…",
    "fb.title": "즉석 채점", "fb.tag": "아첨 0%", "fb.validity": "공학적 타당성", "fb.validity.phil": "논증적 정합성", "fb.ingenuity": "우회 돌파력", "fb.ingenuity.phil": "통찰의 참신함", "fb.critique": "치명적 한계 · ", "fb.hint": "힌트 · ", "fb.retry": "다시 답변하기", "fb.next": "다음 질문으로",
    "limit.title": "무료 3문제를 다 풀었어요", "limit.body": "로그인하면 계속 풀 수 있고, 답변과 채점이 당신의 데이터셋으로 저장됩니다.", "limit.cta": "로그인하고 계속하기",
    "badge.demo": "데모 모드 · 채점은 샘플입니다",
    "modal.title": "Engineering Brain 시작", "modal.sub": "이름만 입력하면 바로 3문제를 무료로 풀고 채점받을 수 있어요.", "modal.nameLabel": "이름 (또는 닉네임)", "modal.freeStart": "무료로 시작 (3문제)", "modal.divider": "더 풀고 데이터를 남기려면", "modal.google": "Google로 계속하기", "modal.emailLabel": "이메일로 로그인 링크 받기", "modal.magicBtn": "로그인 링크 받기", "modal.foot": "계속하면 답변 데이터의 수집·저장 및 제3자(채점 모델) 전송에 동의하는 것으로 봅니다.",
    "free.left": (n) => `무료 ${n}/3`,
  },
  en: {
    "nav.how": "How it works", "nav.domains": "Domains", "nav.login": "Sign in",
    "hero.kicker": "Fusion-Engineering Reasoning Gym",
    "hero.title1": "Design the", "hero.titleEm": "workaround", "hero.title2": ", not the answer",
    "hero.lead": "Hard problems where different fields of engineering collide, one at a time. Answer raw, no format, and get graded without flattery. What accumulates is your reasoning itself.",
    "hero.ctaEng": "🔧 Engineering challenges", "hero.ctaPhil": "🤔 Philosophy dilemmas",
    "hero.note1b": "3 free", "hero.note1t": "name only", "hero.note2b": "Instant grading", "hero.note2t": "validity · ingenuity", "hero.note3b": "Lossless", "hero.note3t": "your words, unchanged",
    "sample.kicker": "Preview", "sample.h2": "A problem looks like this", "sample.lead": "Not a test with a fixed answer. One real dilemma with live trade-offs.", "sample.ctaSolve": "Solve this one yourself",
    "sample.dilemma": "The eddy-viscosity model in a RANS simulation is badly wrong in separation regions, so you correct the Reynolds stresses with a neural network trained on high-resolution LES data. But the moment you add the correction term, the solver diverges, or on untrained geometries it produces unphysical negative energy generation.",
    "sample.question": "To embed a data-driven correction without breaking solver stability or physical realizability, how would you redefine the learning target and its constraints?",
    "sample.g1": "• <b>RANS</b> = Time-averaged turbulence equations (fast but inaccurate)", "sample.g2": "• <b>realizability</b> = The condition that stresses stay within physically possible values",
    "samplePhil.kicker": "Another corner", "samplePhil.h2": "There's philosophy too", "samplePhil.lead": "Stake your position on a question with no right answer. A different flavor of thought experiment.",
    "samplePhil.dilemma": "A runaway trolley is about to kill 5 people tied to the tracks. Pulling the lever beside you diverts it to another track, where 1 person is tied. Do nothing and 5 die; pull the lever and 5 live, but your action kills 1.",
    "samplePhil.question": "Would you pull the lever? Is 'doing nothing' morally the same as 'killing with your own hands', or different?",
    "card.dilemma": "Dilemma", "card.question": "Question", "card.cardsToggle": "🃏 Reference cards (feel free to go beyond)",
    "how.kicker": "How it works", "how.h2": "We capture the reasoning, not the answer", "how.lead": "Not a quiz to ace. We collect the trace of how you carve a path out when you're stuck.",
    "how.s1t": "One hard problem", "how.s1d": "A card with domain, dilemma and question. No textbook exercises. A real dilemma with live trade-offs every time.",
    "how.s2t": "Answer raw", "how.s2d": "Rate your confidence (1-10) first, then write freely with no format. Your words are stored exactly, unchanged.",
    "how.s3t": "Blunt grading", "how.s3d": "Engineering validity and breakthrough ingenuity as scores, the fatal flaw in one line. No flattery. Then the next problem.",
    "dom.kicker": "Domains", "dom.h2": "Pick the field you want", "dom.lead": "Engineering and philosophy, each broken into fields you can jump straight into.",
    "dom.engHead": "🔧 Engineering fields", "dom.philHead": "🤔 Philosophy branches",
    "phil.kicker": "Why this way", "phil.h2": "Unpolished reasoning<br>is the costliest data", "phil.lead": "More than a clean final answer, the process of fumbling toward a path is real engineering intelligence.",
    "phil.i1t": "Lossless capture", "phil.i1d": "Your answer is stored as-is, before any grading or normalization. Preserved losslessly so it can serve any later use.",
    "phil.i2t": "Zero flattery", "phil.i2d": "No \"nice try\" here. Validity and ingenuity as numbers, and the single most fatal weakness called out head-on.",
    "phil.i3t": "Your data, separate", "phil.i3d": "Each participant's answers are stored separately. Sign-in just links your progress and answers safely.",
    "cta.h2": "One problem and you'll get it", "cta.lead": "Enter just your name for 3 free graded problems. Sign in to keep going and save your data.", "cta.start": "Start now",
    "foot.copy": "© 2026 Engineering Brain · Fusion-engineering reasoning dataset",
    "app.exit": "Exit",
    "card.confidence": "First, how well do you know this", "card.confhint": "1 = no clue · 10 = fully sure", "card.answer": "Your answer · no format, raw", "card.placeholder": "Grab the physical causality and design a workaround…", "card.placeholder.phil": "Take a stance, then argue why…", "card.submit": "Submit and get graded", "card.skip": "Skip", "card.saved": "✓ Answer saved (lossless)", "card.grading": "Grading…",
    "fb.title": "Instant grading", "fb.tag": "0% flattery", "fb.validity": "Engineering validity", "fb.validity.phil": "Argumentative rigor", "fb.ingenuity": "Breakthrough ingenuity", "fb.ingenuity.phil": "Novel insight", "fb.critique": "Fatal flaw · ", "fb.hint": "Hint · ", "fb.retry": "Try again", "fb.next": "Next problem",
    "limit.title": "You've used your 3 free problems", "limit.body": "Sign in to keep going, and your answers and grades are saved as your dataset.", "limit.cta": "Sign in to continue",
    "badge.demo": "Demo mode · grading is sample",
    "modal.title": "Start Engineering Brain", "modal.sub": "Enter just your name to solve 3 problems free with grading.", "modal.nameLabel": "Name (or nickname)", "modal.freeStart": "Start free (3 problems)", "modal.divider": "To keep going and save data", "modal.google": "Continue with Google", "modal.emailLabel": "Get a sign-in link by email", "modal.magicBtn": "Send sign-in link", "modal.foot": "By continuing you agree to collection/storage of answer data and transfer to a third-party grading model.",
    "free.left": (n) => `Free ${n}/3`,
  },
};
let LANG = localStorage.getItem("eb_lang") || (navigator.language?.startsWith("en") ? "en" : "ko");

function tr(key) { return (T[LANG] && T[LANG][key]) ?? (T.ko[key] ?? ""); }

// 공학/철학 카테고리에 따라 채점 라벨·답변 placeholder를 다르게(고정 id라 data-i18n 재적용에 안 덮임).
function applyCategoryLabels() {
  const isPhil = state.category === "philosophy";
  const vLabel = $("v-label"); if (vLabel) vLabel.textContent = tr(isPhil ? "fb.validity.phil" : "fb.validity");
  const gLabel = $("g-label"); if (gLabel) gLabel.textContent = tr(isPhil ? "fb.ingenuity.phil" : "fb.ingenuity");
  const answerEl = $("answer"); if (answerEl) answerEl.placeholder = tr(isPhil ? "card.placeholder.phil" : "card.placeholder");
}

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
  applyCategoryLabels();
  // render()는 호출하지 않음 — 앱 진행 중 언어 전환이 입력/진행을 지우지 않게.
}
on("#lang-toggle button", "click", (e) => {
  LANG = e.currentTarget.dataset.lang;
  localStorage.setItem("eb_lang", LANG);
  applyLang();
});

// ── domains (실제 데이터 기반, 카테고리별 세부분야 — 토큰 없이 도메인 문자열 키워드로 분류) ──
const DOMAIN_GROUP_LABELS = {
  engineering: {
    space_air: ["우주·항공", "Aerospace & Space"],
    medical: ["의료·바이오공학", "Medical & Bio"],
    energy: ["에너지·전력", "Energy & Power"],
    semiconductor: ["반도체·정밀계측", "Semiconductor & Precision"],
    robotics: ["로보틱스·제어·임베디드", "Robotics, Control & Embedded"],
    materials: ["재료·제조·구조", "Materials & Structures"],
    fluids_civil: ["열유체·화공·토목", "Thermal/Fluids & Civil"],
  },
  philosophy: {
    mind_identity: ["마음·정체성·인식론", "Mind, Identity & Epistemology"],
    life_ethics: ["생명·응용윤리", "Life & Applied Ethics"],
    politics_society: ["정치·사회철학", "Politics & Society"],
    tech_aesthetics: ["기술·미학·가치론", "Technology, Aesthetics & Value"],
  },
};
function domainGroupLabel(category, group) {
  const entry = (DOMAIN_GROUP_LABELS[category] || {})[group];
  if (!entry) return group;
  return entry[LANG === "en" ? 1 : 0];
}

function enterDomainGroup(category, group) {
  state.category = category;
  state.domainGroup = group;
  state.user = null;
  showApp();
}

function buildDomainGrid(gridId, category) {
  const grid = $(gridId);
  if (!grid) return;
  const list = state.questionsByCategory[category] || [];
  const counts = {};
  list.forEach((q) => { const g = q.domain_group || ""; if (g) counts[g] = (counts[g] || 0) + 1; });
  grid.innerHTML = "";
  Object.keys(counts).sort((a, b) => counts[b] - counts[a]).forEach((g) => {
    const el = document.createElement("button");
    el.className = "domain-chip active-now";
    el.innerHTML = `<span>${domainGroupLabel(category, g)}</span><span class="soon-tag">${counts[g]}</span>`;
    el.addEventListener("click", () => enterDomainGroup(category, g));
    grid.appendChild(el);
  });
}

function renderDomains() {
  buildDomainGrid("domain-grid-eng", "engineering");
  buildDomainGrid("domain-grid-phil", "philosophy");
}

// ── view switching ─────────────────────────────────────────────
const landing = $("landing");
const appView = $("app-view");
function showApp() {
  landing.classList.add("hidden");
  appView.classList.remove("hidden");
  const list = state.questionsByCategory[state.category] || SAMPLE;
  state.questions = state.domainGroup ? list.filter((q) => (q.domain_group || "") === state.domainGroup) : list;
  if (!state.questions.length) state.questions = list; // 필터 결과가 비면 안전하게 전체로 폴백
  state.idx = 0;
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
on("[data-demo]", "click", (e) => {
  state.user = null;
  state.category = e.currentTarget.dataset.category || state.category || "engineering";
  state.domainGroup = null;
  showApp();
});
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
const state = { idx: 0, conf: 0, streak: 0, user: null, questions: [], questionsByCategory: {},
  category: "engineering", domainGroup: null, freeUsed: 0, pendingName: null };

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
    gloss_en: [["RANS", "Time-averaged turbulence equations; fast but inaccurate"], ["Realizability", "The condition that stresses stay within physically possible values"]],
    cards: ["보정항을 응력에 직접 더하면 realizability를 깨기 쉽다", "보정을 물리모델의 계수(eddy-viscosity)에 곱하는 형태로 제한하면 발산 위험이 줄어든다",
      "학습 도메인 밖 형상에서 신경망 출력은 외삽이라 신뢰 불가", "솔버와 신경망을 매 타임스텝 강결합하면 불안정, 느슨결합(post-hoc)이 더 안정적",
      "물리적 사전(anisotropy invariant 등)으로 신경망 출력공간을 제한할 수 있다", "훈련 데이터(LES)가 커버 못한 레이놀즈수 영역에서는 보정을 끄는 폴백이 필요하다",
      "보정 크기에 상한(clip)을 걸면 발산은 막지만 보정 효과도 줄어든다", "앙상블로 불확실성을 추정해 불확실성이 큰 영역만 보정을 약화시킬 수 있다"],
    cards_en: ["Adding the correction directly to the stresses easily breaks realizability", "Constraining the correction to a coefficient (eddy-viscosity) reduces divergence risk",
      "Network output on out-of-distribution geometries is extrapolation, hence untrustworthy", "Tight per-timestep coupling with the solver is unstable; loose/post-hoc coupling is more stable",
      "A physical prior (e.g. anisotropy invariants) can constrain the network's output space", "Regions of Reynolds number not covered by LES training data need a fallback that disables correction",
      "Clipping the correction magnitude prevents divergence but also weakens the correction", "An ensemble can estimate uncertainty and damp correction where uncertainty is high"],
    domain_group: "fluids_civil" },
  { domain: "사족보행 로봇 / Sim-to-Real 강화학습", difficulty: "extreme",
    dilemma: "MuJoCo에서 PPO로 학습한 보행 정책이 시뮬에선 거의 완벽한데, 실제 액추에이터의 기어 백래시·토크 포화·8ms 통신지연이 겹치면 접촉 타이밍이 어긋나 비틀거린다. 도메인 랜덤화를 넓히면 강인해지지만 평균 보행속도가 급락하고, 실하드웨어 롤아웃은 마모로 50 에피소드만 허용된다.",
    question: "강인성과 평균성능을 동시에 살리려면 랜덤화 '분포 자체'를 어떻게 설계·스케줄링하고, 그 50 에피소드를 어디에 쓰겠는가?",
    gloss: [["백래시", "기어 맞물림 틈에서 생기는 위치 사각지대"], ["도메인 랜덤화", "시뮬 물성을 무작위로 흔들어 강인성을 키우는 기법"]],
    domain_en: "Quadruped robots / Sim-to-Real reinforcement learning",
    dilemma_en: "A walking policy trained with PPO in MuJoCo is nearly flawless in simulation, but on real hardware the combination of actuator gear backlash, torque saturation, and an 8 ms communication delay throws off the contact timing and the robot staggers. Widening domain randomization buys robustness but sharply drops average speed, and real-hardware rollouts are limited to 50 episodes by wear.",
    question_en: "To preserve both robustness and average performance, how would you design and schedule the randomization 'distribution itself,' and where would you spend those 50 episodes?",
    gloss_en: [["Backlash", "Positional dead zone from the clearance between meshing gear teeth"], ["Domain randomization", "Randomly perturbing simulator properties to build robustness"]],
    cards: ["랜덤화 범위를 넓히면 정책이 평균적으로 보수화돼 속도가 떨어진다", "커리큘럼(점진적 확장)으로 랜덤화 범위를 늘리면 최종 강인성은 유지하며 수렴을 도울 수 있다",
      "50 에피소드는 학습이 아니라 검증(sim-to-real gap 측정)에 쓰는 것이 정보량이 크다", "통신지연은 액션 지연 보상(action delay compensation)으로 시뮬 안에서 흉내낼 수 있다",
      "백래시·토크포화는 액추에이터 모델을 시뮬에 넣어야 실제로 랜덤화 효과가 생긴다", "실하드웨어 데이터로 시뮬 파라미터 분포를 사후 보정(system identification)할 수 있다",
      "평균성능과 강인성은 근본적으로 트레이드오프 — 둘 다 최대화는 파레토 경계 문제다", "에피소드를 정책 미세조정(fine-tune)에 쓰면 실패시 회수 불가능한 자산 소모다"],
    cards_en: ["Widening the randomization range makes the policy conservative on average, dropping speed", "A curriculum (gradually expanding the range) can aid convergence while preserving final robustness",
      "Spending the 50 episodes on validation (measuring the sim-to-real gap) rather than training yields more information", "Communication delay can be emulated in simulation via action delay compensation",
      "Backlash and torque saturation only produce a real randomization effect if the actuator model is added to the simulator", "Real-hardware data can be used to post-hoc correct the simulator's parameter distribution (system identification)",
      "Average performance and robustness are fundamentally a trade-off — maximizing both is a Pareto-frontier problem", "Spending episodes on policy fine-tuning risks non-recoverable asset loss on failure"],
    domain_group: "robotics" },
];

const SAMPLE_PHIL = [
  { domain: "고전 윤리학 · 트롤리 문제", difficulty: "hard",
    dilemma: "폭주하는 트롤리가 선로에 묶인 5명을 향해 달려간다. 당신 옆의 레버를 당기면 트롤리는 다른 선로로 빠지지만, 그 선로엔 1명이 묶여 있다. 아무것도 안 하면 5명이 죽고, 레버를 당기면 5명은 살지만 당신의 행동으로 1명이 죽는다.",
    question: "레버를 당기겠는가? '아무것도 안 함'과 '내 손으로 죽임'은 도덕적으로 같은가, 다른가?",
    gloss: [["공리주의", "최대다수의 최대행복(결과의 총합)을 옳고 그름의 기준으로 삼는 입장"], ["의무론", "결과와 무관하게 특정 행위 자체가 옳거나 그르다고 보는 입장"]],
    domain_en: "Classical ethics · The trolley problem",
    dilemma_en: "A runaway trolley is about to kill 5 people tied to the tracks. Pulling the lever beside you diverts it to another track, where 1 person is tied. Do nothing and 5 die; pull the lever and 5 live, but your action kills 1.",
    question_en: "Would you pull the lever? Is 'doing nothing' morally the same as 'killing with your own hands', or different?",
    gloss_en: [["Utilitarianism", "The view that the sum of outcomes (greatest happiness for the greatest number) determines right and wrong"], ["Deontology", "The view that certain acts are right or wrong in themselves, regardless of outcome"]],
    cards: ["결과만 보면 5명 생존 > 1명 생존이 산술적으로 낫다", "행위와 부작위(하지 않음)는 도덕적 책임의 무게가 다르다는 직관이 널리 존재한다",
      "레버를 당기는 순간 그 1명은 '수단'으로 취급된다(칸트적 반론)", "아무것도 안 해도 5명의 죽음에 방관자로서 책임이 없다고 보기 어렵다",
      "직관은 상황을 조금만 바꿔도(뚱뚱한 남자를 미는 변형) 크게 흔들린다 — 직관 자체가 신뢰할 근거인가", "법적 책임과 도덕적 책임은 이 상황에서 갈릴 수 있다",
      "구조적으로 '선택하지 않을 선택지'는 없다 — 당신은 이미 이 상황에 개입돼 있다", "숫자만 세는 도덕은 개별 인간의 존엄을 계산 대상으로 격하시킨다는 비판이 있다"],
    cards_en: ["Counting only outcomes, 5 survivors beats 1 survivor arithmetically", "A widespread intuition holds that action and inaction carry different weights of moral responsibility",
      "The moment you pull the lever, that 1 person is treated as a mere means (a Kantian objection)", "It's hard to say doing nothing carries no responsibility as a bystander to 5 deaths",
      "The intuition flips sharply under small variations (e.g. pushing a large man) — is the intuition itself trustworthy?", "Legal responsibility and moral responsibility can diverge here",
      "Structurally there is no 'opt out' — you are already implicated in this situation", "A morality that only counts numbers has been criticized for reducing individual dignity to a calculation"],
    domain_group: "life_ethics" },
  { domain: "가치론 · 경험기계와 진짜 행복", difficulty: "hard",
    dilemma: "당신을 평생 완벽한 가상현실(경험기계)에 연결하면, 원하는 모든 성취·사랑·행복을 실제처럼 느끼며 살 수 있다. 기계 안에 있다는 사실 자체는 절대 알 수 없고, 주관적 경험의 질은 현실과 완전히 동일하거나 더 낫다.",
    question: "당신은 접속하겠는가? 접속을 거부한다면, 그 이유는 '경험의 질' 너머의 무엇인가?",
    gloss: [["경험기계", "노직이 제시한 사고실험 — 완벽한 가상 행복을 제공하는 가상의 기계"], ["쾌락주의", "쾌락(즐거운 경험)이 유일하게 본질적으로 좋은 것이라는 입장"]],
    domain_en: "Value theory · The experience machine and real happiness",
    dilemma_en: "If you could plug into a perfect virtual-reality machine for life, you'd feel every achievement, love, and happiness as vividly as real, with no way to ever know you're inside it, and the subjective quality would be equal to or better than reality.",
    question_en: "Would you plug in? If you'd refuse, what is your reason beyond 'quality of experience'?",
    gloss_en: [["Experience machine", "Nozick's thought experiment — a hypothetical machine delivering perfect simulated happiness"], ["Hedonism", "The view that pleasure (enjoyable experience) is the only intrinsically good thing"]],
    cards: ["쾌락주의라면 접속을 거부할 이유가 없다 — 경험의 질이 전부이기 때문이다", "많은 사람이 직관적으로 거부한다 — 이는 쾌락 이상의 무언가(진정성·성취)가 가치 있다는 증거일 수 있다",
      "'진짜로 성취했다'는 사실 자체가 그 경험과 별개로 가치를 더한다는 입장이 있다", "거부 직관은 현실에 대한 손실 회피 편향일 뿐, 합리적 근거가 아닐 수 있다",
      "기계 안에서도 당신은 여전히 '누군가'로 남는다 — 정체성은 경험의 출처와 무관하다는 반론도 가능하다", "타인과의 '진짜' 관계가 기계 안 관계보다 본질적으로 더 가치 있다고 보기는 입증이 어렵다",
      "이미 우리의 지각도 뇌가 구성한 시뮬레이션이라면, 경험기계와 현실의 경계는 생각보다 흐릿하다", "접속을 거부하는 사람도 실제로는 편안·오락(작은 경험기계들)을 일상적으로 추구한다는 지적이 있다"],
    cards_en: ["Under hedonism there is no reason to refuse — quality of experience is all that matters", "Many refuse intuitively — which may be evidence that something beyond pleasure (authenticity, achievement) has value",
      "Some hold that 'actually having achieved it' adds value independent of the experience itself", "The refusal intuition may just be loss-aversion about reality, not a rational ground",
      "Inside the machine you remain 'someone' — one could object that identity doesn't depend on the source of experience", "It's hard to prove 'real' relationships with others are intrinsically more valuable than ones inside the machine",
      "If our perception is already a simulation constructed by the brain, the line between the experience machine and reality is blurrier than it seems", "Even those who refuse routinely pursue comfort and entertainment (small experience machines) in daily life"],
    domain_group: "tech_aesthetics" },
];

async function loadQuestions() {
  state.questionsByCategory = { engineering: SAMPLE, philosophy: SAMPLE_PHIL };
  state.questions = state.questionsByCategory[state.category];
  if (!LIVE || !supabase) return;
  for (const cat of ["engineering", "philosophy"]) {
    try {
      const { data, error } = await supabase.from("questions").select("*").eq("status", "pending").eq("category", cat).limit(150);
      if (!error && data?.length) {
        // 셔플(매번 같은 순서 방지)
        const arr = data.map((q) => ({ domain: q.domain, difficulty: q.difficulty, dilemma: q.dilemma, question: q.question, gloss: q.gloss || [], qid: q.qid,
          domain_en: q.domain_en, dilemma_en: q.dilemma_en, question_en: q.question_en, gloss_en: q.gloss_en,
          cards: q.cards || [], cards_en: q.cards_en || [], domain_group: q.domain_group || "" }));
        for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
        state.questionsByCategory[cat] = arr;
      }
    } catch (_) { /* 폴백: 카테고리별 SAMPLE 유지 */ }
  }
  state.questions = state.questionsByCategory[state.category];
}

function render() {
  const q = state.questions[state.idx % state.questions.length];
  // 영어 페이지에선 영어 본문으로 완전 대체(없으면 한국어 폴백)
  const en = LANG === "en";
  const domain = (en && q.domain_en) || q.domain;
  const dilemma = (en && q.dilemma_en) || q.dilemma;
  const question = (en && q.question_en) || q.question;
  const gloss = (en && q.gloss_en && q.gloss_en.length) ? q.gloss_en : (q.gloss || []);
  $("q-domain").textContent = domain;
  $("q-diff").textContent = (q.difficulty || "hard").toUpperCase();
  $("q-prog").textContent = `R1 · ${String((state.idx % state.questions.length) + 1).padStart(2, "0")}`;
  $("q-dilemma").textContent = dilemma;
  $("q-question").textContent = question;

  const ul = $("q-gloss"); ul.innerHTML = "";
  gloss.forEach(([t, d]) => { const li = document.createElement("li"); li.innerHTML = `• <b>${t}</b> = ${d}`; ul.appendChild(li); });
  $("q-glossbox").style.display = gloss.length ? "block" : "none";

  const cards = (en && q.cards_en && q.cards_en.length) ? q.cards_en : (q.cards || []);
  const cardsUl = $("q-cards"); cardsUl.innerHTML = "";
  cards.forEach((c) => { const li = document.createElement("li"); li.textContent = `• ${c}`; cardsUl.appendChild(li); });
  $("q-cardbox").style.display = cards.length ? "block" : "none";
  $("q-cardbox").open = false;

  applyCategoryLabels();

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
  const kwRe = state.category === "philosophy"
    ? /(직관|전제|반례|정합|입장|책임|자유의지|공리|의무론|정의|권리|자격)/
    : /(임피던스|분포|제약|손실|위상|마스킹|보존|에너지|주파수|공진|토크|랜덤|보정|경계|스케줄)/;
  const hasSignal = kwRe.test(answer);
  let v = Math.min(88, 30 + Math.floor(len / 6) + (hasSignal ? 22 : 0));
  let g = Math.min(84, 24 + Math.floor(len / 8) + (hasSignal ? 26 : 0));
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
        body: { prompt: q.question, dilemma: q.dilemma, domain: q.domain, answer, confidence: conf, lang: LANG, category: state.category },
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
      answer_raw: answer, confidence: conf, name: state.user.name || null, category: state.category,
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
renderDomains();
if (state.user) showApp();
