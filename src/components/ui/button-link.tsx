import type { ComponentProps, ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ButtonLink({
  children,
  className,
  variant = "default",
  ...props
}: ComponentProps<typeof Link> & {
  children: ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "ghost";
}) {
  return (
    <Link className={cn(buttonVariants({ variant }), className)} {...props}>
      {children}
    </Link>
  );
}
