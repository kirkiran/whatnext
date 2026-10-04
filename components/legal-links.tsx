import Link from "next/link";

export function LegalLinks() {
  return (
    <nav aria-label="Legal" className="flex flex-wrap gap-ds-4 text-body-small text-content-secondary">
      <Link href="/privacy" className="underline focus-visible:outline focus-visible:outline-2">Privacy</Link>
      <Link href="/terms" className="underline focus-visible:outline focus-visible:outline-2">Terms</Link>
    </nav>
  );
}
