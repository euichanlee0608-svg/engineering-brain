# Engineering Brain — Web

융합공학 추론 짐의 웹 버전. 텔레그램 `@leechan_COT_bot` 과 같은 컨셉을 외부 유입용 웹앱으로.
빌드 스텝 없는 정적 프론트(GitHub Pages) + Supabase(Auth·DB·Edge Function) 한 장짜리 구조.

---

## 🚀 새 비슷한 프로젝트 부트스트랩 체크리스트 (이 구조 그대로 재사용)

> "정적 사이트 + Supabase 인증 + 익명/소셜 로그인 + Edge Function로 LLM 호출(키 숨김)" 패턴을 다시 쓸 때 순서대로.

1. **레포·배포**: `git init` → `gh repo create <name> --public --source=. --push` → GitHub Settings>Pages>Source `main / root`. 사이트 = `https://<id>.github.io/<name>/`. **모든 경로 상대경로**(`./...`)로 두면 서브경로에서 동작. `.nojekyll` 추가.
2. **Supabase 프로젝트** 생성 → `config.js`에 **Project URL + anon(publishable) key**만 넣음(공개 OK, RLS로 보호). `service_role` 키는 절대 프론트/깃에 두지 않음.
3. **DB 스키마 + RLS** 적용(아래 [스키마](#스키마-현재) SQL). 데이터 테이블은 RLS 켜고 `auth.uid()` 정책. 비밀값은 `app_secrets`(service_role만).
4. **인증 켜기**(아래 [인증 셋업](#인증-셋업-재사용-핵심)): ① Anonymous sign-ins 토글 ② Google OAuth(클라이언트 생성→등록→**URL Configuration의 Site URL/Redirect URLs**) ③ OAuth 동의화면 **프로덕션 게시**(기본 스코프는 무검수·무료).
5. **LLM 호출은 Edge Function으로**: 키·프롬프트(루브릭)는 `app_secrets`에 두고 `verify_jwt=true` 함수가 service_role로만 읽음. 프론트는 `supabase.functions.invoke()`만. (아래 [grade Edge Function](#grade-edge-function))
6. **남이 못 보게 할 데이터**(오너 전용)는 애초에 서버로 안 보냄. 외부 기여 데이터와 핵심 데이터는 **저장소 자체를 분리**.
7. **트러블슈팅**은 Supabase MCP `get_logs(service:"auth"/"edge-function")`로 토큰 0 진단. 흔한 함정은 아래 [트러블슈팅](#트러블슈팅) 참고.

---

## 아키텍처
- **프론트**: vanilla HTML/CSS/JS(빌드 없음). `index.html`(랜딩+퀴즈앱+로그인 모달 단일 페이지) / `styles.css`(라이트 에디토리얼, 다크모드 자동) / `app.js`(auth·퀴즈·채점 호출·i18n) / `config.js`(URL·anon키·플래그).
- **백엔드**: Supabase — Auth(익명/매직링크/Google) · Postgres(`questions`·`contributions`·`app_secrets`) · Edge Function `grade`(Gemini 채점).
- **질문 공급**: 텔레그램 `engineering_brain` 파이프라인이 단일 출처(`bank/questions.jsonl`) → `eb_sync_web.py`가 일반질문을 `questions`로 동기화.

## 현재 상태 (2026-06-26)
- 라이브: https://euichanlee0608-svg.github.io/engineering-brain/ · 레포 `euichanlee0608-svg/engineering-brain`(public)
- Supabase `kjlknxwzpmdzawwrurva`(서울). 로그인 **익명+매직링크+Google 전부 ON**, OAuth **프로덕션 게시 완료**(누구나 Google 로그인).
- 실채점 ON: `grade` Edge Function. 로그인/익명 → Gemini 실채점, 그 외 mock 폴백.
- 질문 38개(영어 포함) 서빙. 텔레그램 리필 시 신규 일반질문이 **한+영 같이 자동 동기화**.

---

## 인증 셋업 (재사용 핵심)

코드(`app.js`)는 그대로 두고 **대시보드 설정만** 하면 된다. 세 방법:

### ① 익명(이름만, 3문제 무료)
- Supabase → Authentication → Providers/Sign In → **Anonymous sign-ins 켜기**.
- `app.js`가 `signInAnonymously({ options:{ data:{ name } } })`. 익명도 `contributions`에 이름 태그로 저장됨(데모 "먼저 한 문제"만 미저장).

### ② Google OAuth (가장 많이 쓰는 로그인) — 정확한 순서
1. **Google Cloud Console → API/사용자 인증 정보 → OAuth 클라이언트 ID(웹)**:
   - 승인된 JavaScript 원본: `https://euichanlee0608-svg.github.io`
   - 승인된 리디렉션 URI(= Supabase 콜백, 정확히): `https://kjlknxwzpmdzawwrurva.supabase.co/auth/v1/callback`
2. **Supabase → Auth → Providers → Google**: Enable + ①의 Client ID/Secret 입력.
3. **Supabase → Auth → URL Configuration** (← 이거 빠뜨리면 동의 후 튕김):
   - Site URL: `https://euichanlee0608-svg.github.io/engineering-brain/`
   - Redirect URLs: `https://euichanlee0608-svg.github.io/engineering-brain/**`
4. **OAuth 동의 화면**: "테스트"=등록한 테스트 사용자만 / **"프로덕션 게시"=누구나**. 기본 스코프(email·profile·openid)는 **무검수·무료**.

### ③ 이메일 매직링크(비번 없는 링크 로그인)
- ②의 **Redirect URLs**만 있으면 동작. 기본 SMTP는 전송 한도가 빡빡 → 사용자 많아지면 커스텀 SMTP(Resend 등) 연결.

> 디버깅: `provider is not enabled`(=프로바이더 OFF/자격증명 없음), 동의 후 튕김(=Redirect URLs 누락). Supabase MCP `get_logs(service:"auth")`로 확인.

---

## grade Edge Function
`supabase/functions/grade/index.ts`. **유료 채점 로직을 서버에 숨기는 패턴**.
- `verify_jwt=true` → 로그인/익명만 호출. 익명은 **서버측 3회 무료**(`FREE_LIMIT`, `feedback` 있는 기여 수로 카운트).
- 비밀값은 **`app_secrets`에서 service_role로만** 읽음: `gemini_keys`(콤마구분, 순차 폴백)·`gemini_model`·`grade_sys`(루브릭)·`telegram_notify_token`·`telegram_owner_chat`.
- 입력 `{ prompt, dilemma, domain, answer, confidence, lang }` → 출력 `{ validity, ingenuity, critique, hint }`.
- `lang:"en"`이면 critique·hint를 영어로. 채점 후 오너 텔레그램(COT봇)으로 `[질문+답변+점수+한계+힌트]` 발송.
- **채점 기준은 `app_secrets.grade_sys`(DB)** — 코드 재배포 없이 수정. 현재 설계: *아이디어 질×근거 단단함*으로 채점, **근거 빈약하면 상한 35**, 36↑은 메커니즘/정량/구체 인과가 있을 때만, 비답변·헛소리 0~5. 냉정·아첨0.
- 배포: Supabase MCP `deploy_edge_function`(또는 `supabase functions deploy grade`).

## 스키마 (현재)
```sql
-- 외부 참여자 답변(오너 텔레그램 데이터와 별개 저장소)
create table contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) default auth.uid(),
  qid text, domain text, question text,
  answer_raw text not null, confidence int,
  feedback jsonb, name text, created_at timestamptz default now()
);
alter table contributions enable row level security;
create policy "own rows" on contributions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 질문 은행(읽기 공개, 쓰기는 service_role). *_en = 영어 페이지 완전대체용
create table questions (
  qid text primary key, domain text, dilemma text, question text,
  gloss jsonb, difficulty text, status text default 'pending',
  domain_en text, dilemma_en text, question_en text, gloss_en jsonb,
  created_at timestamptz default now()
);
alter table questions enable row level security;
create policy "read all" on questions for select using (true);

-- 비밀값(키·루브릭·텔레그램 토큰) — service_role 만 접근
create table app_secrets (
  key text primary key, value text, updated_at timestamptz default now()
);
alter table app_secrets enable row level security;  -- 정책 없음 → anon/auth 접근 0, service_role만
```

## 영어화 / i18n
- **UI 문자열**: `app.js`의 `T` 객체(ko/en), `[data-i18n]`로 토글. 랜딩 샘플카드도 i18n.
- **질문 본문**: `LANG==="en"`이면 `render()`가 `*_en` 컬럼 사용(없으면 한국어 폴백). 영어 답변 → 영어 채점.
- **동시 생성**: `generate.py` PERSONA가 한국어 질문 만들 때 영어도 함께 생성 → `ebcore.add_questions`가 bank에 적재 → `eb_sync_web`가 `*_en`까지 동기화.

## 질문 동기화 & 자동 생성 (텔레그램 → 웹)
- 단일 출처 = `~/second_brain/engineering_brain/bank/questions.jsonl`. `ebcore.add_questions`가 신규 **`audience:"all"`** 질문만 `eb_sync_web.push`로 Supabase에 upsert(qid PK, 멱등). **오너 전용 후속질문은 웹 노출 안 함.**
- **자동**: 오너가 풀어 pending<3이면 봇이 `generate.py refill`(서브프로세스, 최신코드, 봇 재시작 불필요) → 신규 일반질문이 영어와 함께 자동 동기화.
- 수동 전체 동기화: `python eb_sync_web.py`(키 없으면 no-op). 키는 `engineering_brain/.env`의 `SUPABASE_URL`/`SUPABASE_SERVICE_KEY`(서버 전용).
- **오염 차단**: 회귀테스트가 `add_questions`→`push`로 prod에 새지 않게 `test_ebcore`가 `eb_sync_web.push`를 스텁. 생성 다양성 위해 `generate.py`가 기존 도메인을 프롬프트에 넘겨 중복 회피.

## 프론트 기능 메모
- **힌트 + 다시 답변하기**: 채점 후 초록 힌트 1줄 + `다시 답변하기`(같은 질문 재응답, 새 기여로 적재=무손실).
- **한글 줄바꿈**: `word-break:keep-all`(어절 단위). **데모/실연동 2모드**: `config.js` 비면 데모(mock 채점).

## 로컬 미리보기 / 배포
```bash
cd ~/eng_quiz_web && python3 -m http.server 8731   # http://localhost:8731
git add -A && git commit -m "..." && git push        # main 푸시 → Pages 자동 재빌드(~1분)
```

## 보안
- `anon key`는 공개 OK(RLS로 보호). **`service_role` 키는 절대 프론트/깃 금지**(Edge Function·`.env`에만).
- 외부 답변은 RLS로 작성자 본인만. 오너 핵심 데이터(텔레그램 `answers.jsonl`)와 **저장소 자체가 별개**.

## 트러블슈팅
| 증상 | 원인 / 해결 |
|---|---|
| `provider is not enabled` (Google) | 프로바이더 OFF 또는 자격증명 없음 → Auth>Providers 등록·활성 |
| 동의 후 화면 튕김 | URL Configuration의 **Redirect URLs** 누락 → `.../engineering-brain/**` 추가 |
| 매직링크 메일 안 옴 | 기본 SMTP 한도 → 커스텀 SMTP(Resend) |
| 외부인 Google 로그인 차단 | OAuth 동의화면 "테스트" 모드 → **프로덕션 게시** |
| 질문풀에 정크(`A`,`d1` 등) | 테스트가 prod로 push → `add_questions` 경유 테스트는 push 스텁 |
| 채점이 너무 후/짜다 | `app_secrets.grade_sys` 수정(재배포 불필요) |

## 파일
| 파일 | 역할 |
|---|---|
| `index.html` | 랜딩 + 퀴즈 앱 + 로그인 모달(단일 페이지) |
| `styles.css` | 라이트 에디토리얼 디자인 시스템(다크모드 자동) |
| `app.js` | Supabase auth · 퀴즈 로직 · 채점 호출(hint/retry) · i18n · mock 폴백 |
| `config.js` | Supabase URL/anon key · `LIVE_GRADING` 플래그(공개 OK) |
| `supabase/functions/grade/index.ts` | Gemini 채점 Edge Function(키·루브릭 숨김) |
| `.nojekyll` | Pages Jekyll 처리 방지 |
