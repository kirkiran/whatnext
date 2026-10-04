"use client";

import { SignOutButton } from "@clerk/nextjs";
import type { ReactNode } from "react";

export function AppHeader({ accountAction }: { accountAction?: ReactNode }) {
  return (
    <header className="flex flex-col gap-ds-3 border-b border-line pb-ds-5 sm:flex-row sm:items-baseline sm:gap-ds-5">
      <h1 className="shrink-0 text-page-title tracking-tight text-content-primary">
        EegEnu
      </h1>
      <p className="max-w-3xl text-body-small text-content-secondary sm:border-l sm:border-line-brand sm:pl-ds-5">
        Decide what to do next when your day gets messy
      </p>
      <div className="flex items-center gap-ds-2 sm:ml-auto">
        {accountAction}
        <SignOutButton redirectUrl="/sign-in">
          <button type="button" className="text-body-small underline focus-visible:outline focus-visible:outline-2">
            Sign out
          </button>
        </SignOutButton>
      </div>
    </header>
  );
}
