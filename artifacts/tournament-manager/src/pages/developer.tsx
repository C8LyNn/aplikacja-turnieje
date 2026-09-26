import { Code2, Sparkles } from "lucide-react";
import { RoleSelectionLink } from "@/components/app-navigation";

export default function DeveloperPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground dark px-4">
      <div className="w-full max-w-xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Code2 className="w-16 h-16 text-purple-500 opacity-80" />
              <Sparkles className="w-6 h-6 text-yellow-400 absolute -bottom-1 -right-1" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Panel Developera</h1>
          <p className="text-sm text-muted-foreground mb-8">DEV / NARZĘDZIA</p>
        </div>
        <a
          href="/dev/animated-effects/"
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-purple-500/60 hover:bg-purple-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        >
          <Sparkles aria-hidden="true" className="h-7 w-7 shrink-0 text-purple-400" />
          <span>
            <strong className="block text-lg">Animated Effects</strong>
            <span className="text-sm text-muted-foreground">Efekty streamowe — edytor efektów</span>
          </span>
        </a>
        <div className="mt-8 text-center">
          <RoleSelectionLink />
        </div>
      </div>
    </div>
  );
}
