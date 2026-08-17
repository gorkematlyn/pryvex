"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";

const initialState: LoginState = {};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  return (
    <Card className="p-8">
      <h1 className="text-lg font-semibold text-alloy">Welcome back</h1>
      <p className="mt-1 text-sm text-alloy-dim">Log in to manage your Pryvex profile.</p>

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <input type="hidden" name="next" value={next} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="mb-1.5">Password</Label>
            <Link href="/forgot-password" className="mb-1.5 text-xs text-electric hover:underline">
              Forgot?
            </Link>
          </div>
          <Input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
        </div>

        <FieldError>{state.error}</FieldError>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-alloy-dim">
        New to Pryvex?{" "}
        <Link href="/signup" className="text-electric hover:underline">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
