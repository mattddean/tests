import { Link } from "@tanstack/react-router";
import { LogOut, SquarePen } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { AppLogo, StatusPill } from "./ui";
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
        <div className="absolute top-0 left-[8%] h-[22rem] w-[22rem] rounded-full bg-[color:var(--accent-faint)] blur-3xl" />
        <div className="absolute right-[8%] bottom-0 h-[18rem] w-[18rem] rounded-full bg-white/80 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.7),transparent_30%),linear-gradient(180deg,rgba(250,248,243,0.95),rgba(242,237,229,0.95))]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--background-glass)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-5 py-4 md:gap-4 md:px-8">
          <Link to="/" className="shrink-0">
            <AppLogo />
          </Link>

          <nav className="hidden shrink items-center gap-1 rounded-full border border-[color:var(--border)] bg-white/70 p-1.5 md:flex lg:gap-2">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/tests">Tests</NavLink>
            {session?.user ? (
              <NavLink to="/me/responses">
                <span className="lg:hidden">Responses</span>
                <span className="hidden lg:inline">My Responses</span>
              </NavLink>
            ) : null}
          </nav>

          <div className="flex shrink-0 items-center gap-2 lg:gap-3">
            {session?.user ? <SignedInActions session={session} /> : <SignedOutActions />}
          </div>
        </div>

        <div className="flex justify-center px-5 pb-3 md:hidden">
          <nav className="mx-auto inline-flex max-w-full items-center gap-2 overflow-x-auto rounded-[1.6rem] border border-[color:var(--border)] bg-white/70 p-1.5">
            <MobileNavLink to="/">Home</MobileNavLink>
            <MobileNavLink to="/tests">Tests</MobileNavLink>
            {session?.user ? (
              <>
                <MobileNavLink to="/me/responses">Responses</MobileNavLink>
                <MobileActionLink to="/tests/new">
                  <SquarePen className="h-4 w-4" />
                  <span>New</span>
                </MobileActionLink>
              </>
            ) : (
              <MobileActionLink to="/auth">Sign in</MobileActionLink>
            )}
          </nav>
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
      inactiveProps={{
        className:
          "text-[color:var(--foreground)] hover:bg-white hover:text-[color:var(--foreground)] hover:shadow-[0_18px_30px_-22px_rgba(15,23,42,0.25)]",
      }}
      activeProps={{
        className:
          "bg-[color:var(--foreground)] text-white shadow-[0_20px_30px_-18px_rgba(15,23,42,0.6)] hover:bg-[color:var(--foreground)] hover:text-white",
      }}
      className="rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition lg:px-4"
    >
      {children}
    </Link>
  );
}

function SignedOutActions() {
  return (
    <>
      <div className="hidden md:block">
        <ButtonLink to="/auth" variant="ghost" className="px-3 whitespace-nowrap lg:px-4">
          Sign in
        </ButtonLink>
      </div>
      <ButtonLink to="/auth" className="px-3 whitespace-nowrap lg:px-4">
        Get started
      </ButtonLink>
    </>
  );
}

function SignedInActions({ session }: { session: SessionData }) {
  return (
    <>
      <div className="hidden md:block">
        <ButtonLink to="/tests/new" preload={false} className="px-3 whitespace-nowrap lg:px-4">
          <SquarePen className="mr-2 h-4 w-4" />
          <span className="xl:hidden">New</span>
          <span className="hidden xl:inline">New test</span>
        </ButtonLink>
      </div>
      <Card className="flex max-w-[min(42vw,22rem)] items-center gap-2 rounded-full px-2 py-2 lg:gap-3 lg:px-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent-faint)] text-sm font-semibold text-[color:var(--accent-strong)]">
          {session.user.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-medium">{session.user.name}</p>
          <p className="truncate text-xs text-[color:var(--muted)] xl:block">
            {session.user.email}
          </p>
        </div>
        <Button
          variant="ghost"
          className="h-9 rounded-full px-2 lg:px-3"
          onClick={async () => {
            await authClient.signOut();
            window.location.assign("/");
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </Card>
    </>
  );
}

function MobileNavLink({
  to,
  children,
}: {
  to: "/" | "/tests" | "/me/responses";
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      inactiveProps={{
        className:
          "text-[color:var(--foreground)] hover:bg-white hover:text-[color:var(--foreground)]",
      }}
      activeProps={{
        className:
          "bg-[color:var(--foreground)] text-white hover:bg-[color:var(--foreground)] hover:text-white",
      }}
      className="inline-flex h-10 shrink-0 items-center justify-center rounded-[1.15rem] px-3 text-sm font-medium whitespace-nowrap transition"
    >
      {children}
    </Link>
  );
}

function MobileActionLink({
  to,
  children,
}: {
  to: "/auth" | "/tests/new";
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[1.15rem] border border-[color:var(--accent-strong)] bg-[color:var(--accent-strong)] px-3 text-sm font-medium whitespace-nowrap text-white shadow-[0_18px_28px_-20px_rgba(13,148,136,0.8)] transition hover:border-[#07574e] hover:bg-[#07574e] hover:text-white"
    >
      {children}
    </Link>
  );
}

export function TestListRow({
  title,
  description,
  status,
  testId,
  updatedAt,
  editorCount,
  responseCount,
  canEdit,
  canViewResponses,
}: {
  title: string;
  description: string | null;
  status: string;
  testId: string;
  updatedAt: string;
  editorCount: number;
  responseCount: number;
  canEdit?: boolean;
  canViewResponses?: boolean;
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
          <div className="flex flex-wrap items-center gap-4 text-xs tracking-[0.18em] text-[color:var(--muted)] uppercase">
            <span>Updated {new Date(updatedAt).toLocaleString()}</span>
            <span>{editorCount} editors</span>
            <span>{responseCount} responses</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/tests/$testId"
            params={{ testId }}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] px-4 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-white hover:text-[color:var(--foreground)]"
          >
            Open
          </Link>
          {canEdit ? (
            <Link
              to="/tests/$testId/edit"
              params={{ testId }}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--panel-solid)] px-4 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-white hover:text-[color:var(--foreground)]"
            >
              Edit
            </Link>
          ) : null}
          {canViewResponses ? (
            <Link
              to="/tests/$testId/responses"
              params={{ testId }}
              search={{
                page: 1,
                query: "",
                status: "all",
                sortBy: "submittedAt",
                direction: "desc",
              }}
              className="inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--panel)] hover:text-[color:var(--foreground)]"
            >
              Responses
            </Link>
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
        <Link
          key={item.value}
          to={item.href}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition",
            item.value === value
              ? "bg-[color:var(--foreground)] text-white"
              : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
