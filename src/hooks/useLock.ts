"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Runs one async action at a time. While a task is running, any further call is ignored,
 * so a double click, a double tap or a repeated Enter can't fire the same request twice.
 * `busy` is true while a task runs, so a button can show it.
 *
 *   const { busy, run } = useLock();
 *   const remove = (id: string) => run(async () => { await api(...); });
 */
export function useLock() {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (task: () => Promise<void>): Promise<void> => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      await task();
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }, []);

  return { busy, run };
}
