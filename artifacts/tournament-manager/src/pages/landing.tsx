import { useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import type { Role } from "@/lib/auth";
import { Trophy, Code2, UserCog, Users, Eye } from "lucide-react";

const ROLES: {
  id: Role;
  label: string;
  desc: string;
  icon: React.ReactNode;
  cardHover: string;
  iconHover: string;
}[] = [
  {
    id: "developer",
    label: "Developer",
    desc: "Zarządzanie aplikacją i konfiguracja systemu.",
    icon: <Code2 className="w-11 h-11" />,
    cardHover: "hover:border-purple-500/60 hover:bg-purple-500/10",
    iconHover: "group-hover:text-purple-400",
  },
  {
    id: "organizer",
    label: "Organizator turnieju",
    desc: "Pełne zarządzanie turniejem, graczami i drabinką. Wymaga hasła organizatora.",
    icon: <UserCog className="w-11 h-11" />,
    cardHover: "hover:border-primary/60 hover:bg-primary/10",
    iconHover: "group-hover:text-primary",
  },
  {
    id: "support",
    label: "Wsparcie organizatora",
    desc: "Wprowadzanie wyników i obsługa meczów. Wymaga hasła wsparcia i nicka.",
    icon: <Users className="w-11 h-11" />,
    cardHover: "hover:border-green-500/60 hover:bg-green-500/10",
    iconHover: "group-hover:text-green-400",
  },
  {
    id: "fan",
    label: "Kibic turnieju",
    desc: "Widok publiczny — drabinka i wyniki na żywo. Bez edycji.",
    icon: <Eye className="w-11 h-11" />,
    cardHover: "hover:border-orange-500/60 hover:bg-orange-500/10",
    iconHover: "group-hover:text-orange-400",
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
        <span className="text-4xl font-bold tracking-tight text-primary">
          TM_SYS
        </span>
      </div>
      <p className="text-muted-foreground text-base mb-10 text-center max-w-sm">
        System zarządzania turniejami. Wybierz swoją rolę, aby kontynuować.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => handleSelect(r.id)}
            className={`group relative cursor-pointer text-left border border-border rounded-xl p-6 bg-card transition-all duration-200 ${r.cardHover} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
          >
            <div
              className={`pointer-events-none mb-5 text-muted-foreground transition-colors ${r.iconHover}`}
            >
              {r.icon}
            </div>
            <h3 className="text-[20px] font-semibold mb-1 leading-snug">{r.label}</h3>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              {r.desc}
            </p>
            {role === r.id && (
              <span className="pointer-events-none absolute top-3 right-3 text-xs font-semibold text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                aktywna
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
