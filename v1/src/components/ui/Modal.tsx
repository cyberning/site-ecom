"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Ref pour onClose : les appels passent des fonctions fléchées inline, donc une
  // nouvelle référence à chaque render du parent. Sans ref, l'effet du focus trap
  // se re-déclencherait à chaque render (focus réinitialisé, restauration cassée).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Mémoriser l'élément focalisé avant l'ouverture
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    // Focus initial sur le conteneur de la modale
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.focus();
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }

    // Focus trap : boucler la navigation Tab entre le premier et le dernier élément
    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTab);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
      document.body.style.overflow = "";
      // Restaurer le focus sur l'élément qui avait le focus avant l'ouverture
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === overlayRef.current && onCloseRef.current()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-xl outline-none",
          className
        )}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 id={titleId} className="text-lg font-bold text-[var(--text-primary)]">
              {title}
            </h2>
            <button
              onClick={() => onCloseRef.current()}
              className="text-[var(--text-muted)] transition-all duration-300 hover:text-[var(--text-primary)]"
              aria-label="Fermer la fenêtre"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
