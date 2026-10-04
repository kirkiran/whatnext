import Link from "next/link";
import type { ReactNode } from "react";
import { LegalLinks } from "@/components/legal-links";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-canvas px-ds-4 py-ds-8 text-content-primary sm:px-ds-6">
      <div className="mx-auto max-w-3xl space-y-ds-6">
        <Link href="/" className="text-section-title text-content-brand underline focus-visible:outline focus-visible:outline-2">EegEnu</Link>
        <article className="space-y-ds-6 rounded-card border border-line bg-surface-primary p-ds-5 text-body sm:p-ds-8 [&_h2]:mb-ds-3 [&_h2]:text-section-title [&_p]:mb-ds-3 [&_a]:underline">
          <header>
            <h1 className="text-page-title">{title}</h1>
            <p className="mt-ds-3 text-body-small text-content-secondary">Effective date: October 4, 2026</p>
          </header>
          {children}
        </article>
        <LegalLinks />
      </div>
    </main>
  );
}
