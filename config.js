// ──────────────────────────────────────────────────────────────
// Engineering Brain — runtime config
//
// Supabase 미설정(빈 값)이면 사이트는 자동으로 "데모 모드"로 동작한다.
//   - 로그인 없이 둘러보기/체험 가능 (채점은 로컬 mock)
// 실제 로그인·데이터 수집을 켜려면 아래 두 값을 채운다:
//   1) Supabase 대시보드 > Project Settings > API 에서
//   2) Project URL 과 anon(public) key 를 복사
// anon key 는 공개되어도 되는 키다(RLS로 보호). service_role 키는 절대 넣지 말 것.
// ──────────────────────────────────────────────────────────────
window.EB_CONFIG = {
  SUPABASE_URL: "https://kjlknxwzpmdzawwrurva.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_ztvNwHATDKSWTPlhQsLGcw_k5IGKiOz", // publishable(공개키, RLS로 보호)

  // 채점: 아직 Edge Function 미연결 → mock 유지. 붙이면 true 로.
  LIVE_GRADING: false,
};
