import { useEffect, useRef } from "react";

/**
 * Owns only the asynchronous CSV file read, not the tournament CSV parser or API.
 * Both identity and selection generation must match before a callback can touch UI.
 * Aborted FileReaders may still have queued callbacks, so abort alone is insufficient.
 */
export function useTournamentCsvFileReader(
  tournamentId: number,
  handlers: {
    onLoad: (contents: string) => void;
    onError: () => void;
  },
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const currentTournamentIdRef = useRef(tournamentId);
  currentTournamentIdRef.current = tournamentId;

  const generationRef = useRef(0);
  const activeReaderRef = useRef<FileReader | null>(null);

  function invalidate() {
    generationRef.current += 1;
    const previous = activeReaderRef.current;
    activeReaderRef.current = null;
    if (previous?.readyState === FileReader.LOADING) previous.abort();
  }

  // Invalidates old requests on a route ID change and on component unmount.
  useEffect(() => () => invalidate(), [tournamentId]);

  function read(file: File) {
    // A late event from a previous render must not cancel a newer B selection.
    if (currentTournamentIdRef.current !== tournamentId) return;
    invalidate();
    const generation = generationRef.current;
    const ownerId = tournamentId;
    const reader = new FileReader();
    activeReaderRef.current = reader;

    const isCurrent = () =>
      currentTournamentIdRef.current === ownerId &&
      generationRef.current === generation &&
      activeReaderRef.current === reader;

    reader.onload = () => {
      if (!isCurrent()) return;
      activeReaderRef.current = null;
      handlersRef.current.onLoad(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => {
      if (!isCurrent()) return;
      activeReaderRef.current = null;
      handlersRef.current.onError();
    };
    reader.readAsText(file);
  }

  return { read, invalidate };
}
