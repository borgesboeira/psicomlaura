"use client";

import React, { useEffect } from "react";

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-3xl bg-white sticker p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              className="rounded-full border px-3 py-1 text-sm"
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
