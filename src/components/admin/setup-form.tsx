"use client";

import { useActionState } from "react";
import { createFirstAdmin, type SetupState } from "@/app/setup/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";

const initialState: SetupState = {};

export function SetupForm() {
  const [state, formAction, pending] = useActionState(createFirstAdmin, initialState);

  return (
    <Card className="p-8">
      <form action={formAction} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="username">Username</Label>
          <div className="flex items-center rounded-lg border border-border bg-shadow-raised focus-within:border-electric focus-within:ring-1 focus-within:ring-electric">
            <span className="pl-3.5 text-sm text-alloy-faint">/</span>
            <input
              id="username"
              name="username"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9_-]+"
              autoComplete="username"
              placeholder="owner"
              className="w-full bg-transparent px-1.5 py-2.5 text-sm text-alloy outline-none placeholder:text-alloy-faint"
            />
          </div>
          <p className="mt-1.5 text-xs text-alloy-faint">
            The owner gets a normal public page too — pick a handle you want.
          </p>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            placeholder="At least 12 characters"
          />
          <p className="mt-1.5 text-xs text-alloy-faint">
            This account can change every plan, price and user on the instance.
          </p>
        </div>

        <FieldError>{state.error}</FieldError>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating owner account…" : "Create owner account"}
        </Button>
      </form>
    </Card>
  );
}
