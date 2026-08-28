import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-[var(--accent-light)] text-[var(--accent)]",
        variant === "success" && "bg-green-100 text-green-700",
        variant === "warning" && "bg-yellow-100 text-yellow-700",
        variant === "danger" && "bg-red-100 text-red-700",
        variant === "info" && "bg-blue-100 text-blue-700",
        className
      )}
    >
      {children}
    </span>
  );
}
