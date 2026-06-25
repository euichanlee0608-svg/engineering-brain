# Engineering Brain — Web

융합공학 추론 짐의 웹 버전. 텔레그램 `@leechan_COT_bot` 과 같은 컨셉을 외부 유입용 웹앱으로.

- **프론트**: vanilla HTML/CSS/JS (빌드 스텝 없음) → GitHub Pages **프로젝트 사이트**로 배포
- **백엔드**: Supabase (Auth · DB · 추후 Edge Function 채점)
- **디자인**: 라이트 에디토리얼, 포레스트그린 단일 액센트, 모바일 반응형, 다크모드 자동 대응

## 현재 상태 (2026-06-25)
- **라이브**: https://euichanlee0608-svg.github.io/engineering-brain/
- 레포: `euichanlee0608-svg/engineering-brain` (public)
- Supabase `kjlknxwzpmdzawwrurva`(서울) · `contributions`/`questions`/`app_secrets` + RLS · 공개키 입력 → **실연동 ON**.
- **실채점 ON**(`LIVE_GRADING:true`): `grade` Edge Function 배포됨. 로그인 사용자 → Gemini 실채점(검증 200), 익명/데모 → mock 폴백. 키는 비공개 `app_secrets`(service_role만 읽음).
- **질문 30개 백필됨**. 이후 텔레그램 리필 시 자동 동기화(아래).

### 무료 흐름 / 로그인 / 알림
- **이름만 입력 → 3문제 무료 실채점**: Supabase 익명 로그인(이름은 메타데이터). `grade` 함수가 익명 사용자의 채점 횟수를 세어 **서버측 3회 제한**(초과 시 로그인 유도). 답변은 익명이라도 `contributions`에 이름 태그로 저장.
- **더 풀기/저장**: 이메일 매직링크 또는 구글 로그인.
- **웹 사용 시 텔레그램 알림**: 채점 성공하면 `grade` 함수가 **오너 COT봇(@leechan_COT_bot)**으로 `[질문+답변+점수+이름]` 메시지 발송(`app_secrets`의 telegram_notify_token/owner_chat). 검증됨.
- **한/영 토글**: 상단 KO/EN(UI 크롬 i18n 스캐폴드). 질문 본문 영문화는 추후(`questions.lang`).
- **도메인 선택**: 섹션 목업(전체=활성, 분야별=준비중). 질문 품질 검증 후 오픈.

### 남은 사용자 단계 (3가지, 대시보드/.env)
1. **로그인 Site URL (대시보드)**: Authentication > URL Configuration 의 **Site URL** + **Redirect URLs** 에 Pages 주소 추가. (구글은 Providers OAuth 등록 추가. 매직링크는 Site URL만으로 동작.)
2. **익명 로그인 허용 (대시보드)**: Authentication > Sign In / Providers 에서 **Anonymous sign-ins 켜기** → 그래야 "이름만 입력 3문제 무료"가 동작.
3. **질문 자동 동기화 (.env 1줄)**: `~/second_brain/engineering_brain/.env` 에
   `SUPABASE_URL=https://kjlknxwzpmdzawwrurva.supabase.co` 와 `SUPABASE_SERVICE_KEY=<service_role 키>` 추가
   (Settings>API>service_role, **서버 전용 비밀키 — 프론트/깃 금지**). 넣는 즉시 적용(봇 재시작 불필요).

## 질문 동기화 (텔레그램 → 웹)
`~/second_brain/engineering_brain/eb_sync_web.py`. `ebcore.add_questions`(seed·refill 공통)가 신규
`audience:"all"` 질문만 Supabase `questions` 로 push(오너 전용 후속질문은 웹 노출 안 함). 멱등(qid PK).
수동 전체 동기화: `python eb_sync_web.py`. 키 없으면 조용히 no-op(생성 흐름 불간섭).

## 모드 2가지
`config.js` 가 비어있으면 **데모 모드**(로그인 없이 둘러보기/체험, 채점은 로컬 mock).
값을 채우면 **실연동 모드**(실제 로그인 + 답변 DB 저장 + 질문 DB 서빙).

## 로컬 미리보기
```bash
cd ~/eng_quiz_web && python3 -m http.server 8731
# http://localhost:8731 접속
```

## GitHub Pages 배포 (프로젝트 사이트)
대표 사이트(`아이디.github.io`)가 아니라 **레포별 프로젝트 사이트**로 나온다 → 여러 개 가능.
```bash
cd ~/eng_quiz_web
git init && git add -A && git commit -m "init: engineering brain web"
gh repo create engineering-brain --public --source=. --push
# GitHub > 레포 > Settings > Pages > Source: main / root
```
→ `https://<아이디>.github.io/engineering-brain/` 에서 열림.
모든 경로가 상대경로라 서브경로에서도 정상 동작한다.

## Supabase 실연동 (로그인 켜기)
1. 기존 프로젝트(`euichanlee0608-svg's Project`, 서울 리전)를 **Restore**(현재 일시정지 상태).
2. Project Settings > API 에서 **Project URL** 과 **anon public key** 복사 → `config.js` 에 입력.
3. Authentication > Providers 에서 **Email**(매직링크) 활성(기본 ON). Google 쓰려면 OAuth 클라이언트 등록.
4. Authentication > URL Configuration 의 **Site URL / Redirect URLs** 에 Pages 주소 추가.
5. 아래 스키마 적용:

```sql
-- 외부 참여자 답변 (텔레그램 contrib 과 동일하게 분리 보관)
create table contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) default auth.uid(),
  qid text, domain text, question text,
  answer_raw text not null, confidence int,
  feedback jsonb, created_at timestamptz default now()
);
alter table contributions enable row level security;
create policy "own rows" on contributions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 질문 은행 (읽기 공개, 쓰기는 service_role 만)
create table questions (
  qid text primary key, domain text, dilemma text, question text,
  gloss jsonb, difficulty text, status text default 'pending'
);
alter table questions enable row level security;
create policy "read all" on questions for select using (true);
```

6. (선택) 즉시 채점을 실제로 켜려면 `grade` Edge Function 을 만들어 Gemini 호출 후
   `{validity, ingenuity, critique}` 반환 → `config.js` 의 `LIVE_GRADING: true`.

## 파일
| 파일 | 역할 |
|---|---|
| `index.html` | 랜딩 + 퀴즈 앱 뷰 + 로그인 모달 (단일 페이지) |
| `styles.css` | 라이트 에디토리얼 디자인 시스템 (다크모드 자동) |
| `app.js` | Supabase auth · 퀴즈 로직 · mock 채점 · 데모 폴백 |
| `config.js` | Supabase URL/anon key · 채점 플래그 (공개 OK, service_role 금지) |
| `.nojekyll` | Pages 가 파일을 Jekyll 처리하지 않게 |

## 보안 메모
- `anon key` 는 공개되어도 되는 키. **RLS** 로 데이터를 지킨다. `service_role` 키는 절대 프론트에 두지 말 것.
- 답변 데이터는 RLS 로 작성자 본인만 접근. 오너 데이터(텔레그램 `answers.jsonl`)와는 완전히 별개 저장소.
