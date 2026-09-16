import { useRef, useState } from "react";
import type { Match } from "@workspace/api-client-react";

// A draft owns the exact canonical match that the operator began editing.
// Query updates never rebase it; only explicitly discarding it permits a new version.
export function useMatchResultDrafts() {
  const snapshots = useRef<Record<number, Match>>({});
  const [drafts, setDrafts] = useState<Record<number, Match>>({});
  const [conflicts, setConflicts] = useState<Record<number, boolean>>({});
  const capture = (match: Match) => {
    if (!snapshots.current[match.id]) {
      snapshots.current = { ...snapshots.current, [match.id]: { ...match } };
      setDrafts(snapshots.current);
    }
    return snapshots.current[match.id];
  };
  const discard = (id: number) => {
    const next = { ...snapshots.current };
    delete next[id];
    snapshots.current = next;
    setDrafts(next);
    setConflicts(previous => { const next = { ...previous }; delete next[id]; return next; });
  };
  return { drafts, capture, discard,
    hasConflict: (id: number) => !!conflicts[id],
    markConflict: (id: number) => setConflicts(previous => ({ ...previous, [id]: true })),
    isStale: (match: Match) => !!conflicts[match.id] ||
      (!!drafts[match.id] && drafts[match.id].revision !== match.revision),
  };
}
