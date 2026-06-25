# Engineering Brain — Web

융합공학 추론 짐의 웹 버전. 텔레그램 `@leechan_COT_bot` 과 같은 컨셉을 외부 유입용 웹앱으로.

- **프론트**: vanilla HTML/CSS/JS (빌드 스텝 없음) → GitHub Pages **프로젝트 사이트**로 배포
- **백엔드**: Supabase (Auth · DB · 추후 Edge Function 채점)
- **디자인**: 라이트 에디토리얼, 포레스트그린 단일 액센트, 모바일 반응형, 다크모드 자동 대응

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
