import { cn } from "@/lib/utils";
import { Check, Info, AlertCircle } from "lucide-react";

interface AlertProps {
  type?: "success" | "error" | "info";
  message: string;
  className?: string;
  onDismiss?: () => void;
}

const ICONS = {
  success: Check,
  error: AlertCircle,
  info: Info,
};

export default function Alert({ type = "info", message, className, onDismiss }: AlertProps) {
  const Icon = ICONS[type];
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-sm)] border px-4 py-3 text-sm",
        type === "success" && "border-green-200 bg-green-50 text-green-700",
        type === "error" && "border-red-200 bg-red-50 text-red-700",
        type === "info" && "border-blue-200 bg-blue-50 text-blue-700",
        className
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-[var(--text-muted)] transition-[var(--transition)] hover:text-[var(--text-primary)]"
          aria-label="Fermer"
        >
          ✕
        </button>
      )}
    </div>
  );
}
