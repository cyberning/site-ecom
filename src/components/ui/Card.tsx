import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "interactive";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-neumorphic)]",
          variant === "interactive" &&
            "cursor-pointer transition-[var(--transition)] hover:shadow-lg",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
export default Card;
