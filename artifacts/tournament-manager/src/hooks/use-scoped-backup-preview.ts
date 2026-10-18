import { useEffect, useRef } from "react";
import { parseTournamentBackupFile, type TournamentBackupFile } from "@/lib/backup-file";

/**
 * Scopes each asynchronous backup preview read to a source identity and file
 * selection. Abort alone cannot prevent callbacks already queued by a browser.
 * This hook changes neither the Backup V2/V3 parser nor import semantics.
 */
export function useScopedBackupPreview(
  scope: string | number,
  handlers: {
    onPreview: (backup: TournamentBackupFile) => void;
    onError: (message: string) => void;
  },
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const generationRef = useRef(0);
  const activeReaderRef = useRef<FileReader | null>(null);

  const invalidate = () => {
    generationRef.current += 1;
    const previous = activeReaderRef.current;
    activeReaderRef.current = null;
    if (previous?.readyState === FileReader.LOADING) previous.abort();
  };

  // Aborts a read from a previous route/scope and on unmount. The identity
  // guard also rejects events before this passive-effect cleanup executes.
  useEffect(() => () => invalidate(), [scope]);

  const read = (file: File) => {
    if (scopeRef.current !== scope) return;
    invalidate();
    const generation = generationRef.current;
    const ownerScope = scope;
    const reader = new FileReader();
    activeReaderRef.current = reader;

    const isCurrent = () =>
      scopeRef.current === ownerScope &&
      generationRef.current === generation &&
      activeReaderRef.current === reader;

    reader.onload = () => {
      if (!isCurrent()) return;
      activeReaderRef.current = null;
      const parsed = parseTournamentBackupFile(String(reader.result ?? ""));
      if (parsed.ok) handlersRef.current.onPreview(parsed.backup);
      else handlersRef.current.onError(parsed.error);
    };
    reader.onerror = () => {
      if (!isCurrent()) return;
      activeReaderRef.current = null;
      handlersRef.current.onError("Nie udało się odczytać pliku backupu. Wybierz plik ponownie.");
    };
    try {
      reader.readAsText(file);
    } catch {
      if (!isCurrent()) return;
      activeReaderRef.current = null;
      handlersRef.current.onError("Nie udało się odczytać pliku backupu. Wybierz plik ponownie.");
    }
  };

  return { read, invalidate };
}
