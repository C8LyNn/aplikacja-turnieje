import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette } from "lucide-react";

/**
 * Panel ustawień wizualnych turnieju.
 * Kontrolki prezentacyjne (np. motyw Deadlock) trafiają tutaj — bez blokady statusu.
 * Miejsce docelowe dla TournamentPresentationPanel z Task #15.
 */
export function TournamentPresentationPanel() {
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
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Ustawienia motywu wizualnego (np. motyw Deadlock) pojawią się tutaj.
        </p>
      </CardContent>
    </Card>
  );
}
