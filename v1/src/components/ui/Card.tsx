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
          "rounded-[var(--card-radius)] bg-[var(--bg-card)]",
          variant === "interactive" &&
            "cursor-pointer transition-[var(--transition)] hover:shadow-lg",
          className
        )}
        style={{ border: "var(--card-border)", boxShadow: "var(--card-shadow)" }}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
export default Card;
