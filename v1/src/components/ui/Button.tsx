import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] font-[weight:var(--btn-font-weight)] transition-[var(--transition)] disabled:cursor-not-allowed disabled:opacity-50",
          "rounded-[var(--btn-radius)]",
          // Variants
          variant === "primary" && "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
          variant === "secondary" &&
            "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]",
          variant === "ghost" &&
            "text-[var(--text-secondary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)]",
          variant === "danger" && "bg-red-500 text-white hover:bg-red-600",
          // Sizes (ne contrôlent plus que la taille du texte)
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          size === "lg" && "text-base",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
