import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border bg-shadow-raised px-3.5 py-2.5 text-sm text-alloy placeholder:text-alloy-faint",
        "outline-none transition-colors focus:border-electric focus:ring-1 focus:ring-electric",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border bg-shadow-raised px-3.5 py-2.5 text-sm text-alloy placeholder:text-alloy-faint",
        "outline-none transition-colors focus:border-electric focus:ring-1 focus:ring-electric resize-none",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full appearance-none rounded-lg border border-border bg-shadow-raised px-3.5 py-2.5 text-sm text-alloy",
        "outline-none transition-colors focus:border-electric focus:ring-1 focus:ring-electric",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        // Chevron drawn inline so the control needs no icon import or wrapper element.
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 stroke=%22%23848c9b%22 stroke-width=%221.75%22 viewBox=%220 0 24 24%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9",
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-xs font-medium text-alloy-dim mb-1.5 block", className)} {...props} />;
}
