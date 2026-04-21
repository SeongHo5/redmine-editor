import { IssuesView } from "@/components/issue-table/issues-view";

export default function Home() {
  return (
    <main className="flex-1 px-6 py-10">
      <header className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          Redmine Quick Editor
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          내게 할당된 이슈를 한 화면에서 인라인으로 편집하고 일괄 반영합니다.
        </p>
      </header>
      <section className="mx-auto mt-8 max-w-6xl">
        <IssuesView />
      </section>
    </main>
  );
}
