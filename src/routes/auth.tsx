import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { AlertCircle, ArrowRight } from "lucide-react";
import { sessionQueryOptions } from "@/features/auth/queries";
import { authClient } from "@/lib/auth-client";
import { Button, Card, FieldLabel, TextInput } from "@/components/ui";

export const Route = createFileRoute("/auth")({
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());

    if (session?.user) {
      throw redirect({ to: "/" });
    }
  },
  component: AuthPage,
});

function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSuspenseQuery(sessionQueryOptions());

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setError(null);

      const result = isSignUp
        ? await authClient.signUp.email({
            name: value.name,
            email: value.email,
            password: value.password,
          })
        : await authClient.signIn.email({
            email: value.email,
            password: value.password,
          });

      if (result.error) {
        setError(result.error.message ?? "Authentication failed");
        return;
      }

      window.location.assign("/");
    },
  });

  if (session?.user) {
    return null;
  }

  return (
    <div className="grid min-h-[70dvh] gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="overflow-hidden">
        <div className="grid h-full gap-6 p-8 md:p-10">
          <div>
            <p className="text-[11px] tracking-[0.28em] text-[color:var(--muted)] uppercase">
              Access
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em]">
              {isSignUp ? "Create your workspace." : "Sign in and keep building."}
            </h1>
            <p className="mt-5 max-w-[58ch] text-base leading-7 text-[color:var(--muted)]">
              Tests stay private until you publish them. Invite editors by email, autosave responses
              for takers, and reopen completed submissions in the same document view.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AuthFeature
              title="Draft first"
              text="Tests stay hidden until the owner explicitly publishes them."
            />
            <AuthFeature
              title="Invite collaborators"
              text="Owners can add editors by registered email without opening the whole workspace."
            />
            <AuthFeature
              title="Autosave responses"
              text="Takers can pause and return to a draft response before submission."
            />
            <AuthFeature
              title="Review in context"
              text="Responses reopen in the original test layout, not a detached answer dump."
            />
          </div>
        </div>
      </Card>

      <Card className="p-8 md:p-10">
        <p className="text-[11px] tracking-[0.28em] text-[color:var(--muted)] uppercase">
          {isSignUp ? "Create account" : "Welcome back"}
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight">
          {isSignUp ? "Set up your account" : "Sign in"}
        </h2>

        <form
          className="mt-8 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          {isSignUp ? (
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <FieldLabel label="Name" helper="Shown as the editor and responder identity." />
                  <TextInput
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Alex Morgan"
                    required
                  />
                </div>
              )}
            </form.Field>
          ) : null}

          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <FieldLabel label="Email" helper="Use the address collaborators can invite." />
                <TextInput
                  type="email"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="alex@example.com"
                  required
                />
              </div>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <FieldLabel label="Password" helper="Minimum eight characters." />
                <TextInput
                  type="password"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
            )}
          </form.Field>

          {error ? (
            <div className="flex items-start gap-3 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" className="w-full">
                {isSubmitting ? "Working..." : isSignUp ? "Create account" : "Sign in"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </form.Subscribe>
        </form>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsSignUp((value) => !value);
          }}
          className="mt-5 text-sm text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
        >
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Create one"}
        </button>
      </Card>
    </div>
  );
}

function AuthFeature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-white/70 p-5">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{text}</p>
    </div>
  );
}
