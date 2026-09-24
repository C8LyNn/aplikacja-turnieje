import { RoleSelectionLink } from "@/components/app-navigation";
import { DrawLabExtracted } from "./developer/draw-lab/DrawLabExtracted";

export default function DeveloperPage() {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Draw Lab</h1>
            <p className="text-sm text-muted-foreground">
              Izolowane środowisko testowe mechanizmów losowania
            </p>
          </div>

          <RoleSelectionLink />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Karty v8 — extracted test</h2>
          <p className="text-sm text-muted-foreground">
            Rozdzielona wersja testowa: HTML + CSS + JavaScript.
          </p>
        </div>

        <DrawLabExtracted />
      </main>
    </div>
  );
}

