# Redmine Quick Editor

내게 할당된 Redmine 이슈를 한 화면에서 인라인으로 편집하고, **반영** 한 번으로 변경된 이슈만 일괄 PUT하는 개인용 웹 툴.

Redmine 본체 UI에서 "이슈 하나 → 수정 → 저장 → 목록으로 돌아가기"를 반복할 필요가 없도록 만든 것이 핵심.

## 스택

- Next.js 15 (App Router) + TypeScript strict
- TanStack Query v5 (서버 상태 + 캐싱)
- shadcn/ui + Tailwind CSS v4
- Zod (응답·환경변수 검증)
- 배포: Vercel

## 로컬 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.local.example .env.local
# .env.local에 본인 Redmine URL과 API Key 채우기

# 개발 서버 (http://localhost:3000)
npm run dev
```

`npm run build` / `npm run start`로 프로덕션 모드 확인 가능. `npm run lint`로 ESLint 실행.

## Redmine API Key 발급

1. Redmine에 로그인.
2. 우측 상단의 **내 계정** (또는 `<base>/my/account`) 클릭.
3. 우측 사이드바의 **API 접근 키** 섹션에서 **표시** 클릭. 키가 없다면 **재설정**.
4. 표시된 키를 `.env.local`의 `REDMINE_API_KEY`에 복사.
5. Redmine 관리자가 REST API를 활성화한 상태여야 함 (관리 → 설정 → API → "REST 웹서비스 활성화").

> API Key는 `X-Redmine-API-Key` 헤더로 **서버 라우트 핸들러에서만** 사용된다. 브라우저 번들에는 절대 포함되지 않는다.

## 환경변수

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `REDMINE_BASE_URL` | ✅ | `https://redmine.example.com` 형식. 끝의 `/`는 자동으로 제거됨. |
| `REDMINE_API_KEY` | ✅ | 위 절차로 발급한 키. |

값이 누락되거나 형식이 잘못되면 앱 시작 시 명시적인 에러로 throw된다 (`src/lib/env.ts`).

## 키보드 단축키

| 키 | 동작 |
| --- | --- |
| `j` / `k` | 행 이동 (포커스 행 하이라이트, 자동 스크롤) |
| `r` | 현재 포커스 행의 변경 되돌리기 |
| `⌘/Ctrl + Enter` | 변경된 모든 이슈 일괄 반영 |
| `/` | 제목/ID 검색 인풋 포커스 |

입력 중에는 단축키가 비활성화되며, `⌘/Ctrl + Enter`만 어디서든 동작한다.

## 동작 메모

- **Bulk update API 없음**: Redmine은 이슈별 PUT만 지원하므로 `Promise.allSettled`로 병렬 PUT 후 성공/실패를 각각 처리한다.
- **메타데이터 캐싱**: `상태 / 트래커 / 우선순위 / 현재 사용자` 정보는 자주 바뀌지 않아 `staleTime: Infinity`로 캐시.
- **담당자 후보**: 현재는 화면에 보이는 이슈들의 담당자 + 본인을 후보로 노출. 더 넓은 후보가 필요하면 프로젝트 멤버십 조회 엔드포인트를 추가하면 된다.
- **Dirty 처리**: `Map<issueId, { status_id?, priority_id?, assigned_to_id? }>`. 값을 원본으로 되돌리면 자동으로 dirty에서 제거됨.
- **반영 결과**: 성공 행은 0.6초 녹색 flash 후 dirty에서 제거, 실패 행은 빨간 outline + 이슈 ID 링크의 tooltip에 Redmine 에러 메시지 노출.

## Vercel 배포

1. 이 레포를 Vercel 프로젝트로 import.
2. **Project Settings → Environment Variables**에 다음을 추가:
   - `REDMINE_BASE_URL`
   - `REDMINE_API_KEY`

   세 환경(`Production` / `Preview` / `Development`) 모두에 같은 값을 넣는다.
3. 빌드 명령은 기본값(`next build`) 그대로 두면 된다.
4. 사내 Redmine이라 외부에서 접근 불가하면, Vercel은 도달할 수 없다. 이 경우:
   - Tailscale Funnel 등으로 Redmine을 인터넷에 노출하거나,
   - 직접 호스팅(예: VPN 안의 서버, Docker)으로 돌리거나,
   - `vercel dev` 로컬에서만 사용하는 식으로 운용.
5. 배포 후, 배포 URL에는 본인 외에 접근하지 않도록 **Password Protection** (Pro 플랜) 또는 [Vercel Authentication](https://vercel.com/docs/security/deployment-protection) 적용을 권장. 노출된 URL이 Redmine API Key를 가진 백엔드 프록시이기 때문.

## 디렉토리 구조

```
src/
  app/
    api/redmine/
      issues/route.ts          GET 내 이슈 목록 (assigned_to_id=me&status_id=open)
      issues/[id]/route.ts     GET 단일 이슈 / PUT 부분 업데이트
      meta/route.ts            GET 상태/트래커/우선순위/현재 사용자
    layout.tsx, page.tsx, providers.tsx
  components/
    ui/                        shadcn 프리미티브
    issue-table/               IssuesView, IssueTable, InlineSelect, format
  hooks/
    use-meta.ts                staleTime: Infinity로 메타 캐시
    use-issues.ts              내 이슈 fetch
    use-update-issues.ts       Promise.allSettled 기반 bulk PUT
    use-dirty-issues.ts        Map<id, DirtyFields> 정규화
    use-keyboard-shortcuts.ts  j/k/r/⌘+Enter//
  lib/
    env.ts                     server-only Zod 환경 검증
    api-client.ts              브라우저용 fetch + Zod 파서
    query-keys.ts              TanStack Query key factory
    redmine/
      client.ts                서버용 Redmine fetch (API Key 헤더)
      route-helpers.ts         RedmineApiError → JSON
      schemas.ts               Issue/Status/Tracker/Priority/Membership Zod
```

## 라이선스

개인 프로젝트. 외부 공개 시 `LICENSE` 파일을 추가할 것.
