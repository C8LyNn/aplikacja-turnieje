import { useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import type { Role } from "@/lib/auth";
import { Trophy, Code2, UserCog, Users, Eye } from "lucide-react";

const ROLES: { id: Role; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    id: "developer",
    label: "Developer",
    desc: "Zarządzanie aplikacją i konfiguracja systemu.",
    icon: <Code2 className="w-8 h-8" />,
    color: "hover:border-purple-500/60 hover:bg-purple-500/10 group-hover:text-purple-400",
  },
  {
    id: "organizer",
    label: "Organizator turnieju",
    desc: "Pełne zarządzanie turniejem, graczami i drabinką. Wymaga hasła organizatora.",
    icon: <UserCog className="w-8 h-8" />,
    color: "hover:border-primary/60 hover:bg-primary/10 group-hover:text-primary",
  },
  {
    id: "support",
    label: "Wsparcie organizatora",
    desc: "Wprowadzanie wyników i obsługa meczów. Wymaga hasła wsparcia i nicka.",
    icon: <Users className="w-8 h-8" />,
    color: "hover:border-green-500/60 hover:bg-green-500/10 group-hover:text-green-400",
  },
  {
    id: "fan",
    label: "Kibic turnieju",
    desc: "Widok publiczny — drabinka i wyniki na żywo. Bez edycji.",
    icon: <Eye className="w-8 h-8" />,
    color: "hover:border-orange-500/60 hover:bg-orange-500/10 group-hover:text-orange-400",
  },
];

export default function Landing() {
  const { role, setRole } = useAuth();
  const [, navigate] = useLocation();

  function handleSelect(r: Role) {
    setRole(r);
    if (r === "developer") navigate("/developer");
    else if (r === "organizer") navigate("/dashboard");
    else if (r === "support") navigate("/support");
    else navigate("/fan");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground dark px-4 py-12">
      <div className="flex items-center gap-3 mb-3">
        <Trophy className="w-10 h-10 text-primary" />
        <span className="text-4xl font-bold tracking-tight text-primary">TM_SYS</span>
      </div>
      <p className="text-muted-foreground text-base mb-10 text-center max-w-sm">
        System zarządzania turniejami. Wybierz swoją rolę, aby kontynuować.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => handleSelect(r.id)}
            className={`group relative text-left border border-border rounded-xl p-6 bg-card transition-all duration-200 ${r.color} focus:outline-none focus:ring-2 focus:ring-primary`}
          >
            <div className={`mb-4 text-muted-foreground transition-colors ${r.color}`}>
              {r.icon}
            </div>
            <h3 className="text-lg font-bold mb-1">{r.label}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
            {role === r.id && (
              <span className="absolute top-3 right-3 text-xs font-semibold text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                aktywna
              </span>
            )}
          </button>
        ))}
      </div>

      {role && (
        <p className="mt-8 text-xs text-muted-foreground">
          Aktualna rola: <strong className="text-foreground">{ROLES.find((r) => r.id === role)?.label}</strong>
          {" "}·{" "}
          <button className="underline hover:text-foreground" onClick={() => handleSelect(role)}>
            kontynuuj
          </button>
        </p>
      )}
    </div>
  );
}
