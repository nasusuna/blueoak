import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative">
    <select
      className={cn(
        "h-11 w-full appearance-none rounded-lg border border-input bg-card px-3 pr-10 text-base text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
    >
      <path fill="currentColor" d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
    </svg>
  </div>
);
