import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type Strength = "weak" | "fair" | "good" | "strong";

const strengthMeta: Record<
  Strength,
  { label: string; bar: string; text: string }
> = {
  weak: { label: "Weak", bar: "bg-destructive", text: "text-destructive" },
  fair: { label: "Fair", bar: "bg-warning", text: "text-warning" },
  good: { label: "Good", bar: "bg-primary", text: "text-primary" },
  strong: {
    label: "Strong",
    bar: "bg-success",
    text: "text-success",
  },
};

function evaluatePassword(password: string): {
  score: number;
  checks: { label: string; met: boolean }[];
} {
  const checks = [
    { label: "At least 8 characters", met: password.length >= 8 },
    {
      label: "Uppercase & lowercase",
      met: /[A-Z]/.test(password) && /[a-z]/.test(password),
    },
    { label: "At least one number", met: /\d/.test(password) },
    { label: "At least one symbol", met: /[^A-Za-z0-9]/.test(password) },
  ];
  return { score: checks.filter((check) => check.met).length, checks };
}

function strengthFromScore(score: number): Strength {
  if (score <= 1) return "weak";
  if (score === 2) return "fair";
  if (score === 3) return "good";
  return "strong";
}

export function RegisterPage() {
  const { register, registerPending } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { score, checks } = useMemo(
    () => evaluatePassword(password),
    [password],
  );
  const strength = strengthFromScore(score);
  const meta = strengthMeta[strength];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const ok = await register({ name, email, password });
    if (ok) {
      void navigate({ to: "/dashboard" });
    } else {
      setError("Registration failed. Please review the details and try again.");
    }
  };

  return (
    <Card className="shadow-subtle">
      <CardHeader>
        <div className="mb-1 flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
          <ShieldCheck className="size-5 text-primary" />
        </div>
        <CardTitle className="font-display text-xl font-bold tracking-tight">
          Create your account
        </CardTitle>
        <CardDescription>
          Register with a strong password to start securing files.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Ada Lovelace"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              data-ocid="register.name_input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              data-ocid="register.email_input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              data-ocid="register.password_input"
            />
          </div>

          {/* Strength indicator */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Password strength
              </span>
              <span
                className={cn(
                  "font-mono text-xs font-semibold tracking-widest",
                  meta.text,
                )}
                data-ocid="register.strength_label"
              >
                {password ? meta.label.toUpperCase() : "—"}
              </span>
            </div>
            <div
              className="flex gap-1.5"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={4}
              aria-valuenow={score}
              aria-label="Password strength"
              data-ocid="register.strength_meter"
            >
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1.5 flex-1 rounded-full bg-border transition-colors",
                    password && index < score && meta.bar,
                  )}
                />
              ))}
            </div>
            <ul className="mt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {checks.map((check) => {
                const Icon = check.met ? Check : X;
                return (
                  <li
                    key={check.label}
                    className={cn(
                      "flex items-center gap-1.5 text-xs",
                      check.met
                        ? "text-muted-foreground"
                        : "text-muted-foreground/60",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-3.5 shrink-0",
                        check.met ? "text-success" : "text-muted-foreground/50",
                      )}
                      aria-hidden
                    />
                    {check.label}
                  </li>
                );
              })}
            </ul>
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              data-ocid="register.error_state"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={
              registerPending || !name || !email || !password || score < 4
            }
            data-ocid="register.submit_button"
          >
            {registerPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Lock className="size-4" />
            )}
            {registerPending ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary hover:underline"
            data-ocid="register.login_link"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
