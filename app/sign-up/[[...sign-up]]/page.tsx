import { SignUp } from "@clerk/nextjs";
import { LegalLinks } from "@/components/legal-links";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-ds-5 bg-canvas px-ds-4 py-ds-8">
      <SignUp />
      <LegalLinks />
    </main>
  );
}
