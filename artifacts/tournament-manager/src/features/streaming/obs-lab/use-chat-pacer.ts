import { useEffect, useMemo, useRef } from "react";
import { ChatPacer, chatPaceIntervalMs } from "./chat-events";

/**
 * Calm chat for React: a pacer for the current limit (0 = every message at once). Messages still waiting when the
 * limit changes or the component unmounts are dropped with the old pacer.
 */
export function useChatPacer<T>(limit: number, release: (item: T) => void): ChatPacer<T> {
  const releaseRef = useRef(release);
  useEffect(() => {
    releaseRef.current = release;
  });
  const pacer = useMemo(() => new ChatPacer<T>(chatPaceIntervalMs(limit), (item) => releaseRef.current(item)), [limit]);
  useEffect(() => () => pacer.dispose(), [pacer]);
  return pacer;
}
