import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-2xl border border-[color:var(--border-strong)] bg-white px-4 text-sm text-[color:var(--foreground)] transition outline-none placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent-faint)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
