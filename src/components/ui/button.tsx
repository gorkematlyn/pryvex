import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-alloy text-shadow hover:bg-white focus-visible:ring-electric disabled:bg-alloy-faint disabled:text-shadow/60",
  secondary:
    "bg-shadow-elevated text-alloy border border-border hover:border-alloy-faint hover:bg-shadow-raised focus-visible:ring-electric disabled:opacity-50",
  ghost:
    "bg-transparent text-alloy-dim hover:text-alloy hover:bg-shadow-elevated focus-visible:ring-electric disabled:opacity-50",
  danger:
    "bg-transparent text-red-400 border border-red-900/60 hover:bg-red-950/40 focus-visible:ring-red-500 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-base px-5 py-3 rounded-xl gap-2",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(({ className, variant = "primary", size = "md", ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-shadow",
        "disabled:cursor-not-allowed active:scale-[0.98]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";
