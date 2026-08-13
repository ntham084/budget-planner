"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Wallet2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { FormField, TextInput } from "@/components/ui/FormField";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8">
        <div className="flex items-center gap-2">
          <Wallet2 className="h-6 w-6 text-indigo-600" />
          <span className="text-lg font-semibold text-slate-900">
            Budget Planner
          </span>
        </div>

        <h1 className="mt-6 text-xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back. Enter your details to continue.
        </p>

        <form className="mt-6 space-y-4" action={formAction}>
          <FormField label="Email">
            <TextInput
              required
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </FormField>
          <FormField label="Password">
            <TextInput
              required
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </FormField>

          {state?.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full justify-center" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
