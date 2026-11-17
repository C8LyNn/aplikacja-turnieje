import { useEffect, useRef, useState, type FormEvent } from "react";

/** 1 rezerwowy, 2–4 rezerwowi, 0 / 5+ rezerwowych. */
function reserveLabel(n: number): string {
  const units = n % 10, tens = n % 100;
  if (n === 1) return "1 rezerwowy";
  return units >= 2 && units <= 4 && (tens < 12 || tens > 14) ? `${n} rezerwowi` : `${n} rezerwowych`;
}
import { useQueryClient } from "@tanstack/react-query";
import { Crown, History, Loader2, Shield, UserMinus, UserPlus, Users } from "lucide-react";
import {
  getGetTournamentTeamsQueryKey,
  useAddTournamentTeamMember,
  useChangeTournamentTeamMemberRole,
  useGetTournamentTeamHistory,
  useGetTournamentTeams,
  useRemoveTournamentTeamMember,
  type TeamRole,
  type TeamSummary,
} from "@workspace/api-client-react";
import { getApiErrorMessage } from "@/lib/tournament-stages-ui";

const ROLE_LABEL: Record<TeamRole, string> = { captain: "Kapitan", player: "Zawodnik", reserve: "Rezerwowy" };

function TeamHistory({ tournamentId, entryId }: { tournamentId: number; entryId: number }) {
  const history = useGetTournamentTeamHistory(tournamentId, entryId, { query: { retry: false } as never });
  if (history.isLoading) return <p className="experimental-wizard-help"><Loader2 className="inline h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Wczytuję historię…</p>;
  if (history.isError || !history.data) return <p className="experimental-wizard-help">Nie udało się wczytać historii.</p>;
  if (history.data.history.length === 0) return <p className="experimental-wizard-help">Brak zmian w składzie.</p>;
  return (
    <ol className="experimental-team-history">
      {history.data.history.map((row) => (
        <li key={row.id} data-left={row.leftAt ? "true" : "false"}>
          <strong>{row.name}</strong> · {row.roleLabel}
          <span className="experimental-wizard-help">
            {" "}od {new Date(row.joinedAt).toLocaleString("pl-PL")}
            {row.leftAt ? ` do ${new Date(row.leftAt).toLocaleString("pl-PL")} (${row.leftReason === "role_change" ? "zmiana roli" : "usunięty"})` : " — w składzie"}
          </span>
        </li>
      ))}
    </ol>
  );
}

function TeamCard({ tournamentId, team, canEdit }: { tournamentId: number; team: TeamSummary; canEdit: boolean }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [role, setRole] = useState<TeamRole>(team.members.length === 0 ? "captain" : "player");
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetTournamentTeamsQueryKey(tournamentId) });
  const onError = (cause: unknown) => setError(getApiErrorMessage(cause));
  const add = useAddTournamentTeamMember({ mutation: { onSuccess: () => { setName(""); setRole("player"); setError(null); void refresh(); }, onError } });
  const change = useChangeTournamentTeamMemberRole({ mutation: { onSuccess: () => { setError(null); void refresh(); }, onError } });
  const remove = useRemoveTournamentTeamMember({ mutation: { onSuccess: () => { setError(null); void refresh(); }, onError } });
  const busy = add.isPending || change.isPending || remove.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    add.mutate({ id: tournamentId, entryId: team.entryId, data: { name: name.trim(), role } });
  };

  return (
    <li className="experimental-team-card" data-ready={team.ready ? "true" : "false"}>
      <header className="experimental-team-head">
        <span className="experimental-team-badge" aria-hidden="true">{team.shortCode ?? team.name.slice(0, 2).toUpperCase()}</span>
        <div className="min-w-0">
          <h4>{team.name}</h4>
          <p className="experimental-wizard-help">
            {team.starters} w podstawie · {reserveLabel(team.members.length - team.starters)}
            {team.formerMemberCount > 0 ? ` · ${team.formerMemberCount} w historii` : ""}
          </p>
        </div>
        <span className="experimental-team-state">{team.ready ? "Gotowa" : "Uzupełnij skład"}</span>
      </header>
      {team.issues.length > 0 && (
        <ul className="experimental-team-issues">
          {team.issues.map((issue) => <li key={issue.code} data-tone={issue.tone}>{issue.message}</li>)}
        </ul>
      )}
      {team.members.length > 0 ? (
        <ul className="experimental-team-members" aria-label={`Skład: ${team.name}`}>
          {team.members.map((member) => (
            <li key={member.id} data-role={member.role}>
              {member.role === "captain" ? <Crown className="h-3.5 w-3.5" aria-hidden="true" /> : member.role === "reserve" ? <Shield className="h-3.5 w-3.5" aria-hidden="true" /> : null}
              <span className="experimental-team-member-name">{member.name}</span>
              {!canEdit && <span className="experimental-team-member-role">{ROLE_LABEL[member.role]}</span>}
              {canEdit && (
                <span className="experimental-team-member-actions">
                  <select
                    aria-label={`Rola: ${member.name}`}
                    value={member.role}
                    disabled={busy}
                    onChange={(event) => change.mutate({ id: tournamentId, entryId: team.entryId, memberId: member.id, data: { role: event.target.value as TeamRole } })}
                  >
                    <option value="captain">Kapitan</option>
                    <option value="player">Zawodnik</option>
                    <option value="reserve">Rezerwowy</option>
                  </select>
                  <button type="button" aria-label={`Usuń ze składu: ${member.name}`} disabled={busy} onClick={() => remove.mutate({ id: tournamentId, entryId: team.entryId, memberId: member.id })}>
                    <UserMinus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="experimental-wizard-help">Brak zawodników w składzie.</p>
      )}
      {canEdit && (
        <form className="experimental-team-add" onSubmit={submit}>
          <input aria-label={`Nowy zawodnik: ${team.name}`} placeholder="Nick zawodnika" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} />
          <select aria-label={`Rola nowego zawodnika: ${team.name}`} value={role} onChange={(event) => setRole(event.target.value as TeamRole)}>
            <option value="captain">Kapitan</option>
            <option value="player">Zawodnik</option>
            <option value="reserve">Rezerwowy</option>
          </select>
          <button type="submit" className="experimental-v4-btn" disabled={busy || !name.trim()}>
            <UserPlus className="h-4 w-4" aria-hidden="true" /> Dodaj
          </button>
        </form>
      )}
      {error && <p role="alert" className="experimental-wizard-error">{error}</p>}
      <button type="button" className="experimental-team-history-toggle" aria-expanded={showHistory} onClick={() => setShowHistory((value) => !value)}>
        <History className="h-3.5 w-3.5" aria-hidden="true" /> {showHistory ? "Ukryj historię składu" : "Historia składu"}
      </button>
      {showHistory && <TeamHistory tournamentId={tournamentId} entryId={team.entryId} />}
    </li>
  );
}

/** V5 · Stage D — Experimental roster management for team tournaments. */
export function ExperimentalTeamRosters({ tournamentId, canEdit, entriesSignature = "" }: {
  tournamentId: number;
  canEdit: boolean;
  /** Changes whenever entries are added, removed or renamed elsewhere on the page. */
  entriesSignature?: string;
}) {
  const overview = useGetTournamentTeams(tournamentId, { query: { retry: false } as never });
  const lastSignature = useRef(entriesSignature);
  const { refetch } = overview;
  useEffect(() => {
    if (lastSignature.current === entriesSignature) return;
    lastSignature.current = entriesSignature;
    void refetch();
  }, [entriesSignature, refetch]);
  if (overview.isLoading) return <p className="experimental-wizard-help"><Loader2 className="inline h-4 w-4 animate-spin" aria-hidden="true" /> Wczytuję składy…</p>;
  if (overview.isError || !overview.data) return <p role="alert" className="experimental-wizard-error">Nie udało się wczytać składów drużyn.</p>;
  const data = overview.data;
  if (data.participantType !== "teams") return null;
  const limits = [
    data.rosterMin != null ? `minimum ${data.rosterMin} w podstawie` : null,
    data.rosterMax != null ? `maksimum ${data.rosterMax} osób` : null,
  ].filter(Boolean).join(", ");
  return (
    <section className="experimental-team-rosters" aria-labelledby="experimental-team-rosters-title">
      <header className="experimental-team-rosters-head">
        <Users className="h-5 w-5" aria-hidden="true" />
        <div>
          <h3 id="experimental-team-rosters-title">Składy drużyn</h3>
          <p className="experimental-wizard-help">
            {data.teams.length === 0
              ? "Dodaj drużyny powyżej (nazwy drużyn), a potem uzupełnij ich składy."
              : `${data.readyCount}/${data.teams.length} drużyn gotowych${limits ? ` · ${limits}` : ""}. Zmiany między meczami są zapisywane w historii.`}
          </p>
        </div>
      </header>
      {data.teams.length > 0 && (
        <ul className="experimental-team-grid">
          {data.teams.map((team) => <TeamCard key={team.entryId} tournamentId={tournamentId} team={team} canEdit={canEdit} />)}
        </ul>
      )}
    </section>
  );
}
