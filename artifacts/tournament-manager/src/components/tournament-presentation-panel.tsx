import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Palette } from "lucide-react";
import { useDeadlockTheme } from "@/hooks/use-deadlock-theme";

interface TournamentPresentationPanelProps {
  tournamentId: number;
  isDeadlock: boolean;
}

export function TournamentPresentationPanel({
  tournamentId,
  isDeadlock,
}: TournamentPresentationPanelProps) {
  const [deadlockTheme, setDeadlockTheme] = useDeadlockTheme(tournamentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Wizualia
        </CardTitle>
        <CardDescription>
          Ustawienia prezentacyjne turnieju. Można zmieniać niezależnie od statusu turnieju — nie wpływają na reguły rozgrywki.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isDeadlock ? (
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="space-y-0.5">
              <Label htmlFor="deadlock-theme-switch" className="text-sm font-medium cursor-pointer">
                Motyw Deadlock
              </Label>
              <p className="text-xs text-muted-foreground">
                Beżowo-ciemnobrązowa paleta z Valve Pulp Bold — aktywna na wszystkich widokach tego turnieju.
              </p>
            </div>
            <Switch
              id="deadlock-theme-switch"
              checked={deadlockTheme}
              onCheckedChange={setDeadlockTheme}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ustawienia motywu wizualnego są dostępne dla turniejów Deadlock.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
