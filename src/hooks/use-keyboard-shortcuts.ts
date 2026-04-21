"use client";

import { useEffect, useRef } from "react";

export type ShortcutHandlers = {
  onNext?: () => void;
  onPrev?: () => void;
  onResetRow?: () => void;
  onFlush?: () => void;
  onFocusSearch?: () => void;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return true;
  if (target.isContentEditable) return true;
  if (target.getAttribute("role") === "combobox") return true;
  return false;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const editable = isEditableTarget(e.target);
      const cmdOrCtrl = e.metaKey || e.ctrlKey;

      if (cmdOrCtrl && e.key === "Enter") {
        e.preventDefault();
        ref.current.onFlush?.();
        return;
      }

      if (editable) return;
      if (e.altKey || e.metaKey || e.ctrlKey) return;

      switch (e.key) {
        case "j":
          e.preventDefault();
          ref.current.onNext?.();
          break;
        case "k":
          e.preventDefault();
          ref.current.onPrev?.();
          break;
        case "r":
          e.preventDefault();
          ref.current.onResetRow?.();
          break;
        case "/":
          e.preventDefault();
          ref.current.onFocusSearch?.();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
