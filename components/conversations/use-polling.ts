"use client";

import { useEffect, useRef } from "react";

/**
 * Runs `task` repeatedly while `enabled`, waiting `intervalMs` *after* each run
 * finishes, so requests never overlap. Pauses while the tab is hidden and runs
 * again as soon as it becomes visible. Changing `resetKey` restarts the loop
 * (e.g. when another conversation is selected). Errors thrown by `task` are
 * swallowed; the task is responsible for its own failure bookkeeping.
 */
export function usePolling(
  task: (signal: AbortSignal) => Promise<void>,
  { intervalMs, enabled, immediate = false, resetKey }: { intervalMs: number; enabled: boolean; immediate?: boolean; resetKey?: string },
) {
  const taskRef = useRef(task);
  useEffect(() => {
    taskRef.current = task;
  });

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | null = null;

    const isHidden = () => document.visibilityState === "hidden";

    async function run() {
      timer = undefined;
      if (stopped || isHidden()) return;
      controller = new AbortController();
      try {
        await taskRef.current(controller.signal);
      } catch {
        // Task handles its own errors; never let one stop the loop.
      } finally {
        controller = null;
      }
      schedule();
    }

    function schedule() {
      if (stopped || isHidden() || timer || controller) return;
      timer = setTimeout(run, intervalMs);
    }

    function onVisibilityChange() {
      if (isHidden()) {
        // Let an in-flight request finish, but don't schedule more.
        clearTimeout(timer);
        timer = undefined;
      } else if (!timer && !controller) {
        void run();
      }
    }

    if (immediate) void run();
    else schedule();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, intervalMs, immediate, resetKey]);
}
