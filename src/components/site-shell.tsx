import { Link, useRouter } from "@tanstack/react-router";
import { LogOut, SquarePen } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { AppLogo, Button, ButtonLink, Card, StatusPill, cx } from "./ui";
import type { SessionData } from "@/features/auth/server";

export function SiteShell({
  session,
  children,
}: {
  session: SessionData | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[8%] top-0 h-[22rem] w-[22rem] rounded-full bg-[color:var(--accent-faint)] blur-3xl" />
        <div className="absolute bottom-0 right-[8%] h-[18rem] w-[18rem] rounded-full bg-white/80 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.7),transparent_30%),linear-gradient(180deg,rgba(250,248,243,0.95),rgba(242,237,229,0.95))]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--background-glass)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link to="/" className="shrink-0">
            <AppLogo />
          </Link>

          <nav className="hidden items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/70 p-1.5 md:flex">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/tests">Tests</NavLink>
            {session?.user ? <NavLink to="/me/responses">My Responses</NavLink> : null}
          </nav>

          <div className="flex items-center gap-3">
            {session?.user ? <SignedInActions session={session} /> : <SignedOutActions />}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-8 md:px-8 md:py-12">{children}</main>
    </div>
  );
}

function NavLink({
  to,
  children,
}: {
  to: "/" | "/tests" | "/me/responses";
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      activeProps={{
        className:
          "bg-[color:var(--foreground)] text-white shadow-[0_20px_30px_-18px_rgba(15,23,42,0.6)]",
      }}
      className="rounded-full px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--panel)]"
    >
      {children}
    </Link>
  );
}

function SignedOutActions() {
  return (
    <>
      <ButtonLink to="/auth" tone="ghost" className="hidden md:inline-flex">
        Sign in
      </ButtonLink>
      <ButtonLink to="/auth">Get started</ButtonLink>
    </>
  );
}

function SignedInActions({ session }: { session: SessionData }) {
  const router = useRouter();

  return (
    <>
      <ButtonLink to="/tests/new" preload={false} className="hidden md:inline-flex">
        <SquarePen className="mr-2 h-4 w-4" />
        New test
      </ButtonLink>
      <Card className="flex items-center gap-3 rounded-full px-3 py-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent-faint)] text-sm font-semibold text-[color:var(--accent-strong)]">
          {session.user.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="hidden min-w-0 md:block">
          <p className="truncate text-sm font-medium">{session.user.name}</p>
          <p className="truncate text-xs text-[color:var(--muted)]">{session.user.email}</p>
        </div>
        <Button
          tone="ghost"
          className="h-9 rounded-full px-3"
          onClick={async () => {
            await authClient.signOut();
            await router.invalidate();
            await router.navigate({ to: "/" });
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </Card>
    </>
  );
}

export function TestListRow({
  title,
  description,
  status,
  updatedAt,
  editorCount,
  responseCount,
  editHref,
  takeHref,
  responsesHref,
}: {
  title: string;
  description: string | null;
  status: string;
  updatedAt: string;
  editorCount: number;
  responseCount: number;
  editHref?: string;
  takeHref: string;
  responsesHref?: string;
}) {
  return (
    <Card className="group overflow-hidden px-5 py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
            <StatusPill tone={status === "published" ? "success" : "neutral"}>{status}</StatusPill>
          </div>
          <p className="max-w-[70ch] text-sm leading-6 text-[color:var(--muted)]">
            {description || "No description yet."}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
            <span>Updated {new Date(updatedAt).toLocaleString()}</span>
            <span>{editorCount} editors</span>
            <span>{responseCount} responses</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
          <a
            href={takeHref}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] px-4 text-sm font-medium transition hover:bg-white"
          >
            Open
          </a>
          {editHref ? (
            <a
              href={editHref}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] px-4 text-sm font-medium transition hover:bg-white"
            >
              Edit
            </a>
          ) : null}
          {responsesHref ? (
            <a
              href={responsesHref}
              className="inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--panel)]"
            >
              Responses
            </a>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function TabBar({
  value,
  items,
}: {
  value: string;
  items: Array<{ value: string; label: string; href: string }>;
}) {
  return (
    <div className="inline-flex rounded-full border border-[color:var(--border)] bg-white/70 p-1.5">
      {items.map((item) => (
        <a
          key={item.value}
          href={item.href}
          className={cx(
            "rounded-full px-4 py-2 text-sm font-medium transition",
            item.value === value
              ? "bg-[color:var(--foreground)] text-white"
              : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
          )}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}
