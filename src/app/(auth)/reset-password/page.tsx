"use client";

import { Suspense, useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updatePassword, type ResetPasswordState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";

const initialState: ResetPasswordState = {};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  useEffect(() => {
    if (state.success) {
      const timeout = setTimeout(() => router.push("/dashboard"), 1500);
      return () => clearTimeout(timeout);
    }
  }, [state.success, router]);

  if (state.success) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-lg font-semibold text-alloy">Password updated</h1>
        <p className="mt-2 text-sm text-alloy-dim">Taking you to your dashboard…</p>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-lg font-semibold text-alloy">Invalid link</h1>
        <p className="mt-2 text-sm text-alloy-dim">This password reset link is missing its token.</p>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <h1 className="text-lg font-semibold text-alloy">Set a new password</h1>

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <input type="hidden" name="token" value={token} />
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" />
        </div>

        <FieldError>{state.error}</FieldError>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save password"}
        </Button>
      </form>
    </Card>
  );
}
