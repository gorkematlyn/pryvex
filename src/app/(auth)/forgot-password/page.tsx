"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  if (state.success) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-lg font-semibold text-alloy">Check your inbox</h1>
        <p className="mt-2 text-sm text-alloy-dim">
          If an account exists for that email, a password reset link is on its way.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-electric hover:underline">
          Back to login
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <h1 className="text-lg font-semibold text-alloy">Reset your password</h1>
      <p className="mt-1 text-sm text-alloy-dim">We&rsquo;ll email you a secure link.</p>

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        </div>

        <FieldError>{state.error}</FieldError>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-alloy-dim">
        <Link href="/login" className="text-electric hover:underline">
          Back to login
        </Link>
      </p>
    </Card>
  );
}
