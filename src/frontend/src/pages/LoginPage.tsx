import { Link, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2, Lock } from "lucide-react";
import { type FormEvent, useState } from "react";

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

export function LoginPage() {
  const { loginApp, loginPending } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const ok = await loginApp({ email, password });
    if (ok) {
      void navigate({ to: "/dashboard" });
    } else {
      setError("Sign in failed. Check your credentials and try again.");
    }
  };

  return (
    <Card className="shadow-subtle">
      <CardHeader>
        <div className="mb-1 flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
          <Lock className="size-5 text-primary" />
        </div>
        <CardTitle className="font-display text-xl font-bold tracking-tight">
          Sign in to Vault
        </CardTitle>
        <CardDescription>
          Authenticate to access your encrypted vault.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          noValidate
        >
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
              data-ocid="login.email_input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              data-ocid="login.password_input"
            />
          </div>
          {error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              data-ocid="login.error_state"
            >
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={loginPending || !email || !password}
            data-ocid="login.submit_button"
          >
            {loginPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <KeyRound className="size-4" />
            )}
            {loginPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
            data-ocid="login.register_link"
          >
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
