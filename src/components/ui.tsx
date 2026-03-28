import { Link } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Button as ShadButton, buttonVariants } from "@/components/ui/button";
import { Card as ShadCard } from "@/components/ui/card";
import { Input as ShadInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea as ShadTextarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function cx(...values: Array<string | false | null | undefined>) {
  return cn(...values);
}

export function AppLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] shadow-[0_18px_30px_-22px_rgba(12,35,24,0.4)]">
        <div className="h-5 w-5 rounded-full border-2 border-[color:var(--accent)]" />
      </div>
      <div>
        <p className="text-[10px] tracking-[0.28em] text-[color:var(--muted)] uppercase">
          Test Builder
        </p>
        <p className="text-lg font-semibold tracking-tight text-[color:var(--foreground)]">
          Field Notes
        </p>
      </div>
    </div>
  );
}

export function Button({
  children,
  className,
  tone = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variant =
    tone === "primary"
      ? "default"
      : tone === "secondary"
        ? "secondary"
        : tone === "ghost"
          ? "ghost"
          : "destructive";

  return (
    <ShadButton className={cn("w-auto", className)} variant={variant} {...props}>
      {children}
    </ShadButton>
  );
}

export function ButtonLink({
  children,
  className,
  tone = "primary",
  ...props
}: ComponentProps<typeof Link> & {
  children: ReactNode;
  className?: string;
  tone?: "primary" | "secondary" | "ghost";
}) {
  const variant = tone === "primary" ? "default" : tone === "secondary" ? "secondary" : "ghost";

  return (
    <Link className={cn(buttonVariants({ variant }), className)} {...props}>
      {children}
    </Link>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <ShadCard className={className}>{children}</ShadCard>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-[11px] tracking-[0.28em] text-[color:var(--muted)] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)] md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-[70ch] text-sm leading-6 text-[color:var(--muted)] md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-dashed px-8 py-12 text-center">
      <div className="mx-auto max-w-lg space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-[color:var(--muted)] uppercase">
          Empty state
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">
          {title}
        </h2>
        <p className="text-sm leading-6 text-[color:var(--muted)]">{description}</p>
        {action ? <div className="pt-3">{action}</div> : null}
      </div>
    </Card>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning";
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-[0.18em] uppercase",
        tone === "neutral" && "bg-[color:var(--panel-solid)] text-[color:var(--muted)]",
        tone === "accent" && "bg-[color:var(--accent-faint)] text-[color:var(--accent-strong)]",
        tone === "success" && "bg-emerald-50 text-emerald-700",
        tone === "warning" && "bg-amber-50 text-amber-700",
      )}
    >
      {children}
    </span>
  );
}

export function LoadingBlock({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40dvh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-full border border-[color:var(--border)] bg-[color:var(--panel-solid)] px-5 py-3 text-sm text-[color:var(--muted)]">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        <span>{label ?? "Loading"}</span>
      </div>
    </div>
  );
}

export function FieldLabel({ label, helper }: { label: string; helper?: string }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {helper ? <p className="text-xs text-[color:var(--muted)]">{helper}</p> : null}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <ShadInput {...props} className={props.className} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <ShadTextarea {...props} className={props.className} />;
}

export function SurfaceMeta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] tracking-[0.24em] text-[color:var(--muted)] uppercase">{label}</p>
      <div className="text-sm text-[color:var(--foreground)]">{value}</div>
    </div>
  );
}
