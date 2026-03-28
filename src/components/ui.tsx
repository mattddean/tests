import { Link } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function AppLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] shadow-[0_18px_30px_-22px_rgba(12,35,24,0.4)]">
        <div className="h-5 w-5 rounded-full border-2 border-[color:var(--accent)]" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">
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
  return (
    <button
      className={cx(
        "inline-flex h-11 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition duration-200 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50",
        tone === "primary" &&
          "border-[color:var(--accent-strong)] bg-[color:var(--accent)] text-white shadow-[0_20px_30px_-18px_rgba(13,148,136,0.8)] hover:bg-[color:var(--accent-strong)] hover:text-white",
        tone === "secondary" &&
          "border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] text-[color:var(--foreground)] hover:border-[color:var(--border-strong)] hover:bg-white hover:text-[color:var(--foreground)]",
        tone === "ghost" &&
          "border-transparent bg-transparent text-[color:var(--foreground)] hover:bg-white/85 hover:text-[color:var(--foreground)]",
        tone === "danger" && "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  className,
  tone = "primary",
  ...props
}: any & {
  children: ReactNode;
  className?: string;
  tone?: "primary" | "secondary" | "ghost";
}) {
  return (
    <Link
      className={cx(
        "inline-flex whitespace-nowrap h-11 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition duration-200 active:translate-y-px",
        tone === "primary" &&
          "border-[color:var(--accent-strong)] bg-[color:var(--accent)] text-white shadow-[0_20px_30px_-18px_rgba(13,148,136,0.8)] hover:bg-[color:var(--accent-strong)] hover:text-white",
        tone === "secondary" &&
          "border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] text-[color:var(--foreground)] hover:border-[color:var(--border-strong)] hover:bg-white hover:text-[color:var(--foreground)]",
        tone === "ghost" &&
          "border-transparent bg-transparent text-[color:var(--foreground)] hover:bg-white/85 hover:text-[color:var(--foreground)]",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--panel)] shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
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
          <p className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--muted)]">
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
        <p className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
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
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]",
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
      <label className="text-sm font-medium text-[color:var(--foreground)]">{label}</label>
      {helper ? <p className="text-xs text-[color:var(--muted)]">{helper}</p> : null}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "h-11 w-full rounded-2xl border border-[color:var(--border-strong)] bg-white px-4 text-sm text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent-faint)]",
        props.className,
      )}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(
        "w-full rounded-2xl border border-[color:var(--border-strong)] bg-white px-4 py-3 text-sm text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent-faint)]",
        props.className,
      )}
    />
  );
}

export function SurfaceMeta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted)]">{label}</p>
      <div className="text-sm text-[color:var(--foreground)]">{value}</div>
    </div>
  );
}
