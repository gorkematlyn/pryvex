"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type SignupState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";

const initialState: SignupState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  if (state.success) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-lg font-semibold text-alloy">Check your inbox</h1>
        <p className="mt-2 text-sm text-alloy-dim">
          We sent a confirmation link to finish setting up your Pryvex account.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <h1 className="text-lg font-semibold text-alloy">Create your account</h1>
      <p className="mt-1 text-sm text-alloy-dim">Claim your Pryvex handle and start building.</p>

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <div>
          <Label htmlFor="username">Username</Label>
          <div className="flex items-center rounded-lg border border-border bg-shadow-raised focus-within:border-electric focus-within:ring-1 focus-within:ring-electric">
            <span className="pl-3.5 text-sm text-alloy-faint">pryvex.com/</span>
            <input
              id="username"
              name="username"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9_-]+"
              autoComplete="username"
              placeholder="yourname"
              className="w-full bg-transparent px-1.5 py-2.5 text-sm text-alloy outline-none placeholder:text-alloy-faint"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" />
        </div>

        <FieldError>{state.error}</FieldError>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-alloy-dim">
        Already have an account?{" "}
        <Link href="/login" className="text-electric hover:underline">
          Log in
        </Link>
      </p>
    </Card>
  );
}
