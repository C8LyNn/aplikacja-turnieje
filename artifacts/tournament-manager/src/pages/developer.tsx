import { Code2, Construction } from "lucide-react";
import { RoleSelectionLink } from "@/components/app-navigation";

export default function DeveloperPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground dark px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Code2 className="w-16 h-16 text-purple-500 opacity-80" />
            <Construction className="w-6 h-6 text-yellow-400 absolute -bottom-1 -right-1" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Panel Developera</h1>
        <p className="text-muted-foreground mb-2">
          Ta sekcja jest w przygotowaniu.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Funkcje dla developerów (diagnostyka, konfiguracja systemu, narzędzia administracyjne) zostaną dodane w przyszłej wersji.
        </p>
        <RoleSelectionLink />
      </div>
    </div>
  );
}
