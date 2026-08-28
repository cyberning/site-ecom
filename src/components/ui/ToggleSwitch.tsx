import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  activeColor?: string;
  className?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  activeColor = "bg-[var(--accent)]",
  className,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "inline-flex h-6 w-11 items-center rounded-full transition-[var(--transition)]",
        checked ? activeColor : "bg-[var(--text-muted)]",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}
